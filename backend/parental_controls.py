"""
Parental Controls System
Comprehensive parental control and monitoring system for children's safety
"""

from datetime import datetime, timedelta, time
from typing import Dict, List, Optional, Tuple
import json
import logging
from sqlalchemy.orm import Session
from models import User, ParentalControl, WatchHistory, Video, ContentReport
from database import get_db

logger = logging.getLogger(__name__)

class ParentalControlManager:
    def __init__(self):
        self.default_settings = {
            "daily_time_limit": 120,  # minutes
            "allowed_content_types": ["educational", "entertainment", "music"],
            "blocked_keywords": [],
            "allowed_time_slots": [
                {"start": "07:00", "end": "09:00"},  # Morning
                {"start": "15:00", "end": "18:00"},  # Afternoon
                {"start": "19:00", "end": "20:00"}   # Evening
            ],
            "max_session_duration": 45,  # minutes
            "break_reminder_interval": 30,  # minutes
            "bedtime_mode": {
                "enabled": True,
                "start_time": "20:00",
                "end_time": "07:00"
            },
            "content_filters": {
                "min_safety_score": 80,
                "require_educational_content": False,
                "block_user_generated_content": True
            }
        }
    
    async def create_parental_control(
        self, 
        db: Session, 
        parent_id: int, 
        child_id: int, 
        settings: Optional[Dict] = None
    ) -> ParentalControl:
        """Create new parental control settings"""
        try:
            # Merge with default settings
            final_settings = {**self.default_settings}
            if settings:
                final_settings.update(settings)
            
            control = ParentalControl(
                parent_id=parent_id,
                child_id=child_id,
                daily_time_limit=final_settings["daily_time_limit"],
                allowed_content_types=final_settings["allowed_content_types"],
                blocked_keywords=final_settings["blocked_keywords"],
                allowed_time_slots=final_settings["allowed_time_slots"]
            )
            
            db.add(control)
            db.commit()
            db.refresh(control)
            
            logger.info(f"Created parental control for child {child_id} by parent {parent_id}")
            return control
            
        except Exception as e:
            logger.error(f"Error creating parental control: {e}")
            db.rollback()
            raise
    
    async def check_viewing_permission(
        self, 
        db: Session, 
        child_id: int, 
        video_id: int,
        current_time: datetime = None
    ) -> Dict[str, any]:
        """Check if child can watch specific video"""
        if current_time is None:
            current_time = datetime.now()
        
        result = {
            "allowed": True,
            "reason": "",
            "restrictions": [],
            "time_remaining": 0
        }
        
        try:
            # Get parental control settings
            control = db.query(ParentalControl).filter(
                ParentalControl.child_id == child_id,
                ParentalControl.is_active == True
            ).first()
            
            if not control:
                return result  # No restrictions
            
            # Get video details
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                result["allowed"] = False
                result["reason"] = "Video not found"
                return result
            
            # Check time slot restrictions
            time_check = self.check_time_slot_permission(control, current_time)
            if not time_check["allowed"]:
                result.update(time_check)
                return result
            
            # Check daily time limit
            time_limit_check = await self.check_daily_time_limit(db, child_id, control, current_time)
            if not time_limit_check["allowed"]:
                result.update(time_limit_check)
                return result
            
            result["time_remaining"] = time_limit_check["time_remaining"]
            
            # Check content appropriateness
            content_check = self.check_content_appropriateness(video, control)
            if not content_check["allowed"]:
                result.update(content_check)
                return result
            
            # Check blocked keywords
            keyword_check = self.check_blocked_keywords(video, control)
            if not keyword_check["allowed"]:
                result.update(keyword_check)
                return result
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking viewing permission: {e}")
            result["allowed"] = False
            result["reason"] = "Permission check failed"
            return result
    
    def check_time_slot_permission(self, control: ParentalControl, current_time: datetime) -> Dict:
        """Check if current time is within allowed viewing slots"""
        current_time_only = current_time.time()
        current_day = current_time.strftime("%A").lower()
        
        # Check bedtime mode
        bedtime_settings = self.default_settings["bedtime_mode"]
        if bedtime_settings["enabled"]:
            bedtime_start = time.fromisoformat(bedtime_settings["start_time"])
            bedtime_end = time.fromisoformat(bedtime_settings["end_time"])
            
            if bedtime_start <= current_time_only or current_time_only <= bedtime_end:
                return {
                    "allowed": False,
                    "reason": "Bedtime mode active",
                    "restrictions": ["bedtime_mode"]
                }
        
        # Check allowed time slots
        allowed_slots = control.allowed_time_slots or []
        if not allowed_slots:
            return {"allowed": True}
        
        for slot in allowed_slots:
            start_time = time.fromisoformat(slot["start"])
            end_time = time.fromisoformat(slot["end"])
            
            if start_time <= current_time_only <= end_time:
                return {"allowed": True}
        
        # Find next allowed time slot
        next_slot_start = None
        for slot in allowed_slots:
            slot_start = time.fromisoformat(slot["start"])
            if slot_start > current_time_only:
                next_slot_start = slot_start
                break
        
        if not next_slot_start and allowed_slots:
            # Next slot is tomorrow
            next_slot_start = time.fromisoformat(allowed_slots[0]["start"])
        
        return {
            "allowed": False,
            "reason": f"Outside allowed viewing hours. Next slot: {next_slot_start}",
            "restrictions": ["time_slot"],
            "next_allowed_time": next_slot_start.isoformat() if next_slot_start else None
        }
    
    async def check_daily_time_limit(
        self, 
        db: Session, 
        child_id: int, 
        control: ParentalControl,
        current_time: datetime
    ) -> Dict:
        """Check daily viewing time limit"""
        today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Calculate today's watch time
        today_watch_time = db.query(WatchHistory).filter(
            WatchHistory.user_id == child_id,
            WatchHistory.watched_at >= today_start,
            WatchHistory.watched_at < today_end
        ).all()
        
        total_minutes = sum(
            (history.watch_duration or 0) / 60 
            for history in today_watch_time
        )
        
        daily_limit = control.daily_time_limit
        remaining_minutes = daily_limit - total_minutes
        
        if remaining_minutes <= 0:
            return {
                "allowed": False,
                "reason": f"Daily time limit ({daily_limit} minutes) exceeded",
                "restrictions": ["daily_limit"],
                "time_remaining": 0
            }
        
        return {
            "allowed": True,
            "time_remaining": int(remaining_minutes)
        }
    
    def check_content_appropriateness(self, video: Video, control: ParentalControl) -> Dict:
        """Check if video content is appropriate"""
        allowed_types = control.allowed_content_types or []
        
        # Check content type
        if video.content_type and video.content_type.value not in allowed_types:
            return {
                "allowed": False,
                "reason": f"Content type '{video.content_type.value}' not allowed",
                "restrictions": ["content_type"]
            }
        
        # Check safety score
        min_safety_score = self.default_settings["content_filters"]["min_safety_score"]
        if video.safety_score < min_safety_score:
            return {
                "allowed": False,
                "reason": f"Content safety score too low ({video.safety_score}/{min_safety_score})",
                "restrictions": ["safety_score"]
            }
        
        return {"allowed": True}
    
    def check_blocked_keywords(self, video: Video, control: ParentalControl) -> Dict:
        """Check for blocked keywords in video content"""
        blocked_keywords = control.blocked_keywords or []
        if not blocked_keywords:
            return {"allowed": True}
        
        content_text = f"{video.title} {video.description}".lower()
        
        found_keywords = [
            keyword for keyword in blocked_keywords 
            if keyword.lower() in content_text
        ]
        
        if found_keywords:
            return {
                "allowed": False,
                "reason": f"Contains blocked keywords: {', '.join(found_keywords)}",
                "restrictions": ["blocked_keywords"]
            }
        
        return {"allowed": True}
    
    async def get_child_viewing_report(
        self, 
        db: Session, 
        child_id: int, 
        days: int = 7
    ) -> Dict[str, any]:
        """Generate comprehensive viewing report for child"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get watch history
        watch_history = db.query(WatchHistory).join(Video).filter(
            WatchHistory.user_id == child_id,
            WatchHistory.watched_at >= start_date
        ).all()
        
        # Calculate statistics
        total_watch_time = sum(h.watch_duration or 0 for h in watch_history)
        total_videos = len(watch_history)
        
        # Daily breakdown
        daily_stats = {}
        for history in watch_history:
            date_key = history.watched_at.date().isoformat()
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "watch_time": 0,
                    "videos_watched": 0,
                    "categories": set()
                }
            
            daily_stats[date_key]["watch_time"] += history.watch_duration or 0
            daily_stats[date_key]["videos_watched"] += 1
            if history.video.category:
                daily_stats[date_key]["categories"].add(history.video.category.name)
        
        # Convert sets to lists for JSON serialization
        for date_key in daily_stats:
            daily_stats[date_key]["categories"] = list(daily_stats[date_key]["categories"])
        
        # Category breakdown
        category_stats = {}
        for history in watch_history:
            if history.video.category:
                cat_name = history.video.category.name
                if cat_name not in category_stats:
                    category_stats[cat_name] = {
                        "watch_time": 0,
                        "video_count": 0
                    }
                category_stats[cat_name]["watch_time"] += history.watch_duration or 0
                category_stats[cat_name]["video_count"] += 1
        
        # Most watched videos
        video_stats = {}
        for history in watch_history:
            video_id = history.video.id
            if video_id not in video_stats:
                video_stats[video_id] = {
                    "title": history.video.title,
                    "watch_count": 0,
                    "total_watch_time": 0
                }
            video_stats[video_id]["watch_count"] += 1
            video_stats[video_id]["total_watch_time"] += history.watch_duration or 0
        
        most_watched = sorted(
            video_stats.items(), 
            key=lambda x: x[1]["watch_count"], 
            reverse=True
        )[:10]
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "summary": {
                "total_watch_time_minutes": round(total_watch_time / 60, 1),
                "total_videos_watched": total_videos,
                "average_daily_time": round(total_watch_time / 60 / days, 1),
                "average_video_length": round(total_watch_time / max(total_videos, 1) / 60, 1)
            },
            "daily_breakdown": daily_stats,
            "category_breakdown": category_stats,
            "most_watched_videos": [
                {
                    "video_id": video_id,
                    "title": data["title"],
                    "watch_count": data["watch_count"],
                    "total_watch_time_minutes": round(data["total_watch_time"] / 60, 1)
                }
                for video_id, data in most_watched
            ]
        }
    
    async def update_parental_settings(
        self, 
        db: Session, 
        parent_id: int, 
        child_id: int, 
        new_settings: Dict
    ) -> bool:
        """Update parental control settings"""
        try:
            control = db.query(ParentalControl).filter(
                ParentalControl.parent_id == parent_id,
                ParentalControl.child_id == child_id
            ).first()
            
            if not control:
                return False
            
            # Update settings
            if "daily_time_limit" in new_settings:
                control.daily_time_limit = new_settings["daily_time_limit"]
            
            if "allowed_content_types" in new_settings:
                control.allowed_content_types = new_settings["allowed_content_types"]
            
            if "blocked_keywords" in new_settings:
                control.blocked_keywords = new_settings["blocked_keywords"]
            
            if "allowed_time_slots" in new_settings:
                control.allowed_time_slots = new_settings["allowed_time_slots"]
            
            db.commit()
            
            logger.info(f"Updated parental settings for child {child_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating parental settings: {e}")
            db.rollback()
            return False
    
    async def get_content_reports_summary(
        self, 
        db: Session, 
        parent_id: int,
        days: int = 30
    ) -> Dict[str, any]:
        """Get summary of content reports for parent's children"""
        # Get parent's children
        children = db.query(User).filter(User.parent_id == parent_id).all()
        child_ids = [child.id for child in children]
        
        if not child_ids:
            return {"reports": [], "summary": {"total": 0, "by_reason": {}}}
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get reports made by children
        reports = db.query(ContentReport).filter(
            ContentReport.reporter_id.in_(child_ids),
            ContentReport.created_at >= start_date
        ).all()
        
        # Summarize reports
        by_reason = {}
        for report in reports:
            reason = report.reason.value if report.reason else "unknown"
            by_reason[reason] = by_reason.get(reason, 0) + 1
        
        return {
            "reports": [
                {
                    "id": report.id,
                    "video_id": report.video_id,
                    "reporter_id": report.reporter_id,
                    "reason": report.reason.value if report.reason else "unknown",
                    "description": report.description,
                    "status": report.status,
                    "created_at": report.created_at.isoformat()
                }
                for report in reports
            ],
            "summary": {
                "total": len(reports),
                "by_reason": by_reason,
                "period_days": days
            }
        }
    
    async def create_emergency_restriction(
        self, 
        db: Session, 
        parent_id: int, 
        child_id: int, 
        restriction_type: str,
        duration_hours: int = 24
    ) -> bool:
        """Create emergency restriction (e.g., temporary ban)"""
        try:
            control = db.query(ParentalControl).filter(
                ParentalControl.parent_id == parent_id,
                ParentalControl.child_id == child_id
            ).first()
            
            if not control:
                # Create temporary control if doesn't exist
                control = await self.create_parental_control(db, parent_id, child_id)
            
            # Apply emergency restriction
            if restriction_type == "complete_ban":
                control.daily_time_limit = 0
                control.allowed_time_slots = []
            elif restriction_type == "educational_only":
                control.allowed_content_types = ["educational"]
            
            # Set expiration (this would need additional field in model)
            # For now, we'll log it
            logger.warning(f"Emergency restriction '{restriction_type}' applied to child {child_id} for {duration_hours} hours")
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error creating emergency restriction: {e}")
            db.rollback()
            return False

# Utility functions for parental dashboard

async def get_parental_dashboard_data(db: Session, parent_id: int) -> Dict[str, any]:
    """Get comprehensive dashboard data for parent"""
    manager = ParentalControlManager()
    
    # Get parent's children
    children = db.query(User).filter(User.parent_id == parent_id).all()
    
    dashboard_data = {
        "children": [],
        "alerts": [],
        "weekly_summary": {}
    }
    
    for child in children:
        # Get child's viewing report
        child_report = await manager.get_child_viewing_report(db, child.id, days=7)
        
        # Get current restrictions
        control = db.query(ParentalControl).filter(
            ParentalControl.child_id == child.id,
            ParentalControl.is_active == True
        ).first()
        
        child_data = {
            "id": child.id,
            "username": child.username,
            "age_group": child.preferred_age_group.value if child.preferred_age_group else None,
            "viewing_report": child_report,
            "current_restrictions": {
                "daily_time_limit": control.daily_time_limit if control else 120,
                "time_remaining_today": 0,  # Would be calculated in real-time
                "allowed_content_types": control.allowed_content_types if control else [],
                "blocked_keywords": control.blocked_keywords if control else []
            }
        }
        
        # Check for alerts
        if child_report["summary"]["average_daily_time"] > (control.daily_time_limit if control else 120):
            dashboard_data["alerts"].append({
                "type": "time_limit_exceeded",
                "child_id": child.id,
                "message": f"{child.username} exceeded daily time limit"
            })
        
        dashboard_data["children"].append(child_data)
    
    return dashboard_data