"""
Safe Commenting and Content Reporting System
Child-safe commenting with AI moderation and comprehensive reporting system
"""

import re
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from models import SafeComment, ContentReport, User, Video, ReportReason
from enhanced_content_moderation import EnhancedContentModerator

logger = logging.getLogger(__name__)

class SafeCommentingSystem:
    def __init__(self):
        # Pre-approved emoji comments for kids
        self.approved_emojis = {
            "😀": "happy",
            "😂": "funny", 
            "😍": "love",
            "👍": "like",
            "👏": "clap",
            "❤️": "heart",
            "🎉": "celebrate",
            "🌟": "star",
            "🎈": "party",
            "🦄": "unicorn",
            "🌈": "rainbow",
            "🎨": "art",
            "📚": "book",
            "🎵": "music",
            "🐶": "dog",
            "🐱": "cat",
            "🦋": "butterfly",
            "🌸": "flower"
        }
        
        # Pre-approved text responses for quick commenting
        self.quick_responses = [
            "I love this!",
            "So cool!",
            "Amazing!",
            "This is fun!",
            "I learned something new!",
            "Can you make more videos like this?",
            "This made me happy!",
            "I want to try this too!",
            "Thank you for sharing!",
            "This is my favorite!",
            "So creative!",
            "I love the colors!",
            "This is beautiful!",
            "Great job!",
            "Wow!"
        ]
        
        # Positive keywords that are always allowed
        self.positive_keywords = {
            'emotions': ['happy', 'joy', 'love', 'excited', 'amazing', 'wonderful', 'beautiful', 'awesome'],
            'learning': ['learn', 'teach', 'discover', 'explore', 'understand', 'know', 'study'],
            'creativity': ['creative', 'art', 'draw', 'paint', 'make', 'build', 'design', 'imagine'],
            'appreciation': ['thank', 'thanks', 'grateful', 'appreciate', 'like', 'love', 'enjoy'],
            'encouragement': ['great', 'good', 'excellent', 'perfect', 'brilliant', 'smart', 'clever']
        }
        
        # Blocked words and phrases (even mild ones for kids)
        self.blocked_content = {
            'negative': ['hate', 'stupid', 'dumb', 'ugly', 'bad', 'worst', 'terrible', 'awful', 'boring'],
            'inappropriate': ['adult', 'grown-up', 'mature', 'scary', 'fight', 'hurt'],
            'personal_info': ['phone', 'address', 'school', 'home', 'email', 'password', 'location'],
            'external_links': ['http', 'www', '.com', '.net', '.org', 'youtube', 'instagram', 'facebook']
        }
        
        self.content_moderator = EnhancedContentModerator()
    
    async def create_safe_comment(
        self, 
        db: Session, 
        user_id: int, 
        video_id: int, 
        content: str,
        comment_type: str = "text"  # "emoji", "text", "quick_response"
    ) -> Dict[str, any]:
        """Create a safe comment with AI moderation"""
        try:
            # Validate video exists
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                return {"success": False, "error": "Video not found"}
            
            # Check if user can comment (not banned, etc.)
            user_status = await self.check_user_comment_permission(db, user_id)
            if not user_status["can_comment"]:
                return {"success": False, "error": user_status["reason"]}
            
            # Process comment based on type
            moderation_result = await self.moderate_comment_content(content, comment_type)
            
            if not moderation_result["approved"]:
                return {
                    "success": False, 
                    "error": "Comment not approved",
                    "reason": moderation_result["reason"],
                    "suggestions": moderation_result.get("suggestions", [])
                }
            
            # Create comment
            comment = SafeComment(
                user_id=user_id,
                video_id=video_id,
                content=content,
                is_emoji_only=(comment_type == "emoji"),
                is_approved=moderation_result["auto_approved"],
                moderation_score=moderation_result["score"]
            )
            
            db.add(comment)
            db.commit()
            db.refresh(comment)
            
            # Log comment for monitoring
            logger.info(f"Comment created: User {user_id}, Video {video_id}, Type: {comment_type}")
            
            return {
                "success": True,
                "comment_id": comment.id,
                "content": content,
                "is_approved": comment.is_approved,
                "moderation_score": comment.moderation_score,
                "requires_review": not comment.is_approved
            }
            
        except Exception as e:
            logger.error(f"Error creating safe comment: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def moderate_comment_content(self, content: str, comment_type: str) -> Dict[str, any]:
        """Moderate comment content using AI and rule-based filtering"""
        result = {
            "approved": False,
            "auto_approved": False,
            "score": 0,
            "reason": "",
            "suggestions": []
        }
        
        try:
            # Emoji-only comments are generally safe
            if comment_type == "emoji":
                if all(char in self.approved_emojis or char.isspace() for char in content):
                    result.update({
                        "approved": True,
                        "auto_approved": True,
                        "score": 95,
                        "reason": "Approved emoji comment"
                    })
                else:
                    result.update({
                        "approved": False,
                        "score": 20,
                        "reason": "Contains non-approved emojis",
                        "suggestions": ["Use only the provided emoji options"]
                    })
                return result
            
            # Quick responses are pre-approved
            if comment_type == "quick_response" and content in self.quick_responses:
                result.update({
                    "approved": True,
                    "auto_approved": True,
                    "score": 90,
                    "reason": "Pre-approved quick response"
                })
                return result
            
            # Text comment moderation
            content_lower = content.lower().strip()
            
            # Check for blocked content
            for category, blocked_words in self.blocked_content.items():
                for word in blocked_words:
                    if word in content_lower:
                        result.update({
                            "approved": False,
                            "score": 10,
                            "reason": f"Contains blocked content: {category}",
                            "suggestions": [
                                "Try using positive words instead",
                                "Use emoji or quick responses",
                                "Ask a parent for help with your comment"
                            ]
                        })
                        return result
            
            # Check for personal information patterns
            if self.contains_personal_info(content):
                result.update({
                    "approved": False,
                    "score": 5,
                    "reason": "May contain personal information",
                    "suggestions": [
                        "Don't share personal information online",
                        "Use general comments instead"
                    ]
                })
                return result
            
            # Positive content scoring
            positive_score = 0
            for category, keywords in self.positive_keywords.items():
                for keyword in keywords:
                    if keyword in content_lower:
                        positive_score += 10
            
            # Length and complexity checks
            if len(content) > 200:
                result.update({
                    "approved": False,
                    "score": 30,
                    "reason": "Comment too long",
                    "suggestions": ["Keep comments short and simple"]
                })
                return result
            
            # Final scoring
            base_score = 50
            final_score = base_score + positive_score
            
            # Auto-approve high-scoring positive comments
            if final_score >= 80 and len(content.split()) <= 20:
                result.update({
                    "approved": True,
                    "auto_approved": True,
                    "score": final_score,
                    "reason": "Positive content auto-approved"
                })
            elif final_score >= 60:
                result.update({
                    "approved": False,  # Requires manual review
                    "score": final_score,
                    "reason": "Requires manual review",
                    "suggestions": ["Your comment will be reviewed by moderators"]
                })
            else:
                result.update({
                    "approved": False,
                    "score": final_score,
                    "reason": "Content needs improvement",
                    "suggestions": [
                        "Try using more positive words",
                        "Use emoji or quick responses instead",
                        "Make your comment shorter and clearer"
                    ]
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error moderating comment: {e}")
            result.update({
                "approved": False,
                "score": 0,
                "reason": "Moderation error",
                "suggestions": ["Please try again or use emoji comments"]
            })
            return result
    
    def contains_personal_info(self, content: str) -> bool:
        """Check if content contains potential personal information"""
        # Phone number patterns
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US phone numbers
            r'\b\d{10,}\b'  # Long number sequences
        ]
        
        # Email patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        # Address patterns (simplified)
        address_keywords = ['street', 'avenue', 'road', 'drive', 'lane', 'apt', 'apartment']
        
        for pattern in phone_patterns:
            if re.search(pattern, content):
                return True
        
        if re.search(email_pattern, content):
            return True
        
        content_lower = content.lower()
        for keyword in address_keywords:
            if keyword in content_lower and any(char.isdigit() for char in content):
                return True
        
        return False
    
    async def check_user_comment_permission(self, db: Session, user_id: int) -> Dict[str, any]:
        """Check if user has permission to comment"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                return {"can_comment": False, "reason": "User account not active"}
            
            # Check for recent violations (simplified)
            recent_time = datetime.now() - timedelta(hours=24)
            recent_reports = db.query(ContentReport).filter(
                ContentReport.reporter_id == user_id,
                ContentReport.created_at >= recent_time
            ).count()
            
            # Check comment frequency (prevent spam)
            recent_comments = db.query(SafeComment).filter(
                SafeComment.user_id == user_id,
                SafeComment.created_at >= recent_time
            ).count()
            
            if recent_comments > 50:  # Max 50 comments per day
                return {
                    "can_comment": False, 
                    "reason": "Daily comment limit reached"
                }
            
            return {"can_comment": True, "reason": ""}
            
        except Exception as e:
            logger.error(f"Error checking comment permission: {e}")
            return {"can_comment": False, "reason": "Permission check failed"}
    
    async def get_video_comments(
        self, 
        db: Session, 
        video_id: int, 
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """Get approved comments for a video"""
        try:
            comments = db.query(SafeComment).join(User).filter(
                SafeComment.video_id == video_id,
                SafeComment.is_approved == True
            ).order_by(desc(SafeComment.created_at)).offset(offset).limit(limit).all()
            
            return [
                {
                    "id": comment.id,
                    "user_id": comment.user_id,
                    "username": comment.user.username,
                    "content": comment.content,
                    "is_emoji_only": comment.is_emoji_only,
                    "created_at": comment.created_at.isoformat(),
                    "moderation_score": comment.moderation_score
                }
                for comment in comments
            ]
            
        except Exception as e:
            logger.error(f"Error getting video comments: {e}")
            return []
    
    async def report_comment(
        self, 
        db: Session, 
        reporter_id: int, 
        comment_id: int,
        reason: str = "inappropriate"
    ) -> Dict[str, any]:
        """Report a comment for review"""
        try:
            comment = db.query(SafeComment).filter(SafeComment.id == comment_id).first()
            if not comment:
                return {"success": False, "error": "Comment not found"}
            
            # Create report (reusing ContentReport model)
            report = ContentReport(
                video_id=comment.video_id,
                reporter_id=reporter_id,
                reason=ReportReason.INAPPROPRIATE,  # Default for comment reports
                description=f"Comment report: {reason}",
                status="pending"
            )
            
            db.add(report)
            
            # Mark comment for review
            comment.is_approved = False
            comment.moderation_score = 0
            
            db.commit()
            
            logger.info(f"Comment {comment_id} reported by user {reporter_id}")
            
            return {"success": True, "report_id": report.id}
            
        except Exception as e:
            logger.error(f"Error reporting comment: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}

class ContentReportingSystem:
    def __init__(self):
        self.report_categories = {
            ReportReason.INAPPROPRIATE: {
                "title": "Not Right for Kids",
                "description": "This video has content that's not good for children",
                "icon": "🚫",
                "priority": "high"
            },
            ReportReason.SCARY: {
                "title": "Too Scary",
                "description": "This video is frightening or gives me bad dreams",
                "icon": "😰",
                "priority": "high"
            },
            ReportReason.BORING: {
                "title": "Not Fun",
                "description": "This video is not interesting or fun to watch",
                "icon": "😴",
                "priority": "low"
            },
            ReportReason.OTHER: {
                "title": "Something Else",
                "description": "There's another problem with this video",
                "icon": "❓",
                "priority": "medium"
            }
        }
    
    async def create_content_report(
        self, 
        db: Session, 
        reporter_id: int, 
        video_id: int,
        reason: ReportReason,
        description: str = "",
        additional_info: Dict = None
    ) -> Dict[str, any]:
        """Create a content report with child-friendly interface"""
        try:
            # Validate video exists
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                return {"success": False, "error": "Video not found"}
            
            # Check if user already reported this video recently
            recent_time = datetime.now() - timedelta(hours=24)
            existing_report = db.query(ContentReport).filter(
                ContentReport.reporter_id == reporter_id,
                ContentReport.video_id == video_id,
                ContentReport.created_at >= recent_time
            ).first()
            
            if existing_report:
                return {
                    "success": False, 
                    "error": "You already reported this video today"
                }
            
            # Create report
            priority = self.report_categories.get(reason, {}).get("priority", "medium")
            
            report = ContentReport(
                video_id=video_id,
                reporter_id=reporter_id,
                reason=reason,
                description=description,
                priority=priority,
                status="pending"
            )
            
            db.add(report)
            db.commit()
            db.refresh(report)
            
            # Trigger immediate review for high priority reports
            if priority == "high":
                await self.trigger_urgent_review(db, report.id)
            
            logger.info(f"Content report created: ID {report.id}, Video {video_id}, Reason {reason.value}")
            
            return {
                "success": True,
                "report_id": report.id,
                "message": "Thank you for reporting! We'll check this video soon.",
                "estimated_review_time": "24 hours" if priority != "high" else "2 hours"
            }
            
        except Exception as e:
            logger.error(f"Error creating content report: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def get_child_friendly_report_options(self) -> List[Dict]:
        """Get simplified reporting options for children"""
        return [
            {
                "reason": reason.value,
                "title": info["title"],
                "description": info["description"],
                "icon": info["icon"]
            }
            for reason, info in self.report_categories.items()
        ]
    
    async def process_report_queue(self, db: Session, limit: int = 10) -> List[Dict]:
        """Get pending reports for moderation queue"""
        try:
            reports = db.query(ContentReport).join(Video).join(User).filter(
                ContentReport.status == "pending"
            ).order_by(
                ContentReport.priority.desc(),
                ContentReport.created_at.asc()
            ).limit(limit).all()
            
            return [
                {
                    "id": report.id,
                    "video_id": report.video_id,
                    "video_title": report.video.title,
                    "reporter_id": report.reporter_id,
                    "reporter_username": report.reporter.username,
                    "reason": report.reason.value,
                    "description": report.description,
                    "priority": report.priority,
                    "created_at": report.created_at.isoformat(),
                    "video_safety_score": report.video.safety_score
                }
                for report in reports
            ]
            
        except Exception as e:
            logger.error(f"Error processing report queue: {e}")
            return []
    
    async def resolve_report(
        self, 
        db: Session, 
        report_id: int, 
        moderator_id: int,
        resolution: str,  # "approved", "removed", "restricted"
        admin_notes: str = ""
    ) -> Dict[str, any]:
        """Resolve a content report"""
        try:
            report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
            if not report:
                return {"success": False, "error": "Report not found"}
            
            # Update report status
            report.status = "resolved"
            report.resolved_at = datetime.now()
            report.admin_notes = admin_notes
            
            # Take action on video if needed
            if resolution == "removed":
                video = db.query(Video).filter(Video.id == report.video_id).first()
                if video:
                    video.is_approved = False
                    video.safety_score = 0
            elif resolution == "restricted":
                video = db.query(Video).filter(Video.id == report.video_id).first()
                if video:
                    video.safety_score = max(video.safety_score - 20, 0)
            
            db.commit()
            
            # Send feedback to reporter (child-friendly)
            feedback_message = await self.generate_child_feedback(resolution, report.reason)
            
            logger.info(f"Report {report_id} resolved: {resolution}")
            
            return {
                "success": True,
                "resolution": resolution,
                "feedback_message": feedback_message
            }
            
        except Exception as e:
            logger.error(f"Error resolving report: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def generate_child_feedback(self, resolution: str, reason: ReportReason) -> str:
        """Generate child-friendly feedback message"""
        base_messages = {
            "approved": "Thank you for reporting! We checked the video and it's okay for kids to watch. 😊",
            "removed": "Thank you for reporting! We removed the video because it wasn't right for kids. You helped make our app safer! 🌟",
            "restricted": "Thank you for reporting! We made some changes to make the video better for kids. 👍"
        }
        
        return base_messages.get(resolution, "Thank you for helping us keep videos safe for kids! 💙")
    
    async def trigger_urgent_review(self, db: Session, report_id: int):
        """Trigger urgent review for high-priority reports"""
        try:
            # In a real system, this would:
            # 1. Send notification to moderators
            # 2. Temporarily hide the video
            # 3. Add to priority review queue
            
            report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
            if report and report.priority == "high":
                # Temporarily reduce video visibility
                video = db.query(Video).filter(Video.id == report.video_id).first()
                if video:
                    video.safety_score = min(video.safety_score, 50)  # Lower safety score
                    db.commit()
                
                logger.warning(f"Urgent review triggered for report {report_id}")
            
        except Exception as e:
            logger.error(f"Error triggering urgent review: {e}")
    
    async def get_report_statistics(self, db: Session, days: int = 30) -> Dict[str, any]:
        """Get reporting statistics for admin dashboard"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            reports = db.query(ContentReport).filter(
                ContentReport.created_at >= start_date
            ).all()
            
            # Statistics
            total_reports = len(reports)
            resolved_reports = len([r for r in reports if r.status == "resolved"])
            pending_reports = len([r for r in reports if r.status == "pending"])
            
            # By reason
            reason_breakdown = {}
            for report in reports:
                reason = report.reason.value
                reason_breakdown[reason] = reason_breakdown.get(reason, 0) + 1
            
            # By priority
            priority_breakdown = {}
            for report in reports:
                priority = report.priority
                priority_breakdown[priority] = priority_breakdown.get(priority, 0) + 1
            
            # Average resolution time
            resolved = [r for r in reports if r.resolved_at]
            avg_resolution_hours = 0
            if resolved:
                total_hours = sum(
                    (r.resolved_at - r.created_at).total_seconds() / 3600 
                    for r in resolved
                )
                avg_resolution_hours = total_hours / len(resolved)
            
            return {
                "period_days": days,
                "total_reports": total_reports,
                "resolved_reports": resolved_reports,
                "pending_reports": pending_reports,
                "resolution_rate": (resolved_reports / max(total_reports, 1)) * 100,
                "reason_breakdown": reason_breakdown,
                "priority_breakdown": priority_breakdown,
                "avg_resolution_hours": round(avg_resolution_hours, 1)
            }
            
        except Exception as e:
            logger.error(f"Error getting report statistics: {e}")
            return {}