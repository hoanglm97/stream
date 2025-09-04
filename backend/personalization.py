"""
Personalization and AI Recommendation System
Advanced personalization features including AI content recommendations, 
avatar customization, and adaptive learning paths for children
"""

import json
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
from collections import defaultdict, Counter
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from models import (
    User, Video, WatchHistory, QuizResult, UserAchievement, 
    AgeGroup, ContentType, Category, Bookmark
)

logger = logging.getLogger(__name__)

class AIRecommendationEngine:
    def __init__(self):
        self.recommendation_weights = {
            'age_match': 0.3,
            'content_type_preference': 0.25,
            'category_preference': 0.2,
            'time_of_day': 0.1,
            'educational_progress': 0.15
        }
        
        # Time-based content recommendations
        self.time_based_content = {
            'morning': ['educational', 'music', 'arts_crafts'],
            'afternoon': ['entertainment', 'sports', 'educational'],
            'evening': ['music', 'entertainment', 'arts_crafts']
        }
        
        # Age-appropriate content complexity
        self.complexity_levels = {
            AgeGroup.TODDLER: {'max_duration': 15, 'complexity': 'simple'},
            AgeGroup.CHILD: {'max_duration': 30, 'complexity': 'medium'},
            AgeGroup.TEEN: {'max_duration': 45, 'complexity': 'advanced'}
        }
    
    async def get_personalized_recommendations(
        self, 
        db: Session, 
        user_id: int, 
        limit: int = 20,
        recommendation_type: str = "mixed"  # "mixed", "educational", "entertainment"
    ) -> List[Dict]:
        """Generate personalized content recommendations using AI"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return []
            
            # Get user preferences and history
            user_profile = await self.build_user_profile(db, user_id)
            
            # Get candidate videos
            candidate_videos = await self.get_candidate_videos(db, user, recommendation_type)
            
            # Score and rank videos
            scored_videos = []
            for video in candidate_videos:
                score = await self.calculate_recommendation_score(
                    db, user, video, user_profile
                )
                scored_videos.append((video, score))
            
            # Sort by score and apply diversity
            scored_videos.sort(key=lambda x: x[1], reverse=True)
            final_recommendations = await self.apply_diversity_filter(
                scored_videos, user_profile, limit
            )
            
            # Format response
            recommendations = []
            for video, score in final_recommendations:
                recommendations.append({
                    "video_id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "duration": video.duration,
                    "thumbnail_path": video.thumbnail_path,
                    "category": video.category.name if video.category else None,
                    "age_group": video.target_age_group.value if video.target_age_group else None,
                    "content_type": video.content_type.value if video.content_type else None,
                    "safety_score": video.safety_score,
                    "recommendation_score": round(score, 2),
                    "recommendation_reason": await self.get_recommendation_reason(video, user_profile)
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def build_user_profile(self, db: Session, user_id: int) -> Dict:
        """Build comprehensive user profile for recommendations"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            # Watch history analysis
            watch_history = db.query(WatchHistory).join(Video).filter(
                WatchHistory.user_id == user_id
            ).order_by(desc(WatchHistory.watched_at)).limit(100).all()
            
            # Category preferences
            category_counts = Counter()
            content_type_counts = Counter()
            total_watch_time = 0
            completion_rates = []
            
            for history in watch_history:
                if history.video.category:
                    category_counts[history.video.category.name] += 1
                
                if history.video.content_type:
                    content_type_counts[history.video.content_type.value] += 1
                
                total_watch_time += history.watch_duration or 0
                
                if history.video.duration and history.video.duration > 0:
                    completion_rate = (history.watch_duration or 0) / history.video.duration
                    completion_rates.append(min(completion_rate, 1.0))
            
            # Quiz performance
            quiz_results = db.query(QuizResult).filter(
                QuizResult.user_id == user_id
            ).limit(50).all()
            
            quiz_accuracy = 0
            if quiz_results:
                correct_answers = sum(1 for r in quiz_results if r.is_correct)
                quiz_accuracy = correct_answers / len(quiz_results)
            
            # Time preferences
            viewing_times = [h.watched_at.hour for h in watch_history]
            peak_hours = Counter(viewing_times).most_common(3)
            
            # Recent interests (last 2 weeks)
            recent_date = datetime.now() - timedelta(days=14)
            recent_history = [h for h in watch_history if h.watched_at >= recent_date]
            recent_categories = Counter(
                h.video.category.name for h in recent_history 
                if h.video.category
            )
            
            profile = {
                "user_id": user_id,
                "age_group": user.preferred_age_group.value if user.preferred_age_group else None,
                "category_preferences": dict(category_counts.most_common(10)),
                "content_type_preferences": dict(content_type_counts.most_common()),
                "avg_completion_rate": np.mean(completion_rates) if completion_rates else 0,
                "total_watch_time_hours": total_watch_time / 3600,
                "quiz_accuracy": quiz_accuracy,
                "peak_viewing_hours": [hour for hour, count in peak_hours],
                "recent_interests": dict(recent_categories.most_common(5)),
                "viewing_patterns": {
                    "prefers_short_videos": np.mean([h.video.duration or 0 for h in watch_history[:20]]) < 600,
                    "educational_focus": content_type_counts.get('educational', 0) > len(watch_history) * 0.3,
                    "binge_watcher": len([h for h in watch_history if h.watched_at.date() == datetime.now().date()]) > 5
                }
            }
            
            return profile
            
        except Exception as e:
            logger.error(f"Error building user profile: {e}")
            return {"user_id": user_id}
    
    async def get_candidate_videos(
        self, 
        db: Session, 
        user: User, 
        recommendation_type: str
    ) -> List[Video]:
        """Get candidate videos for recommendation"""
        try:
            query = db.query(Video).filter(
                Video.is_approved == True,
                Video.safety_score >= 70
            )
            
            # Filter by age group
            if user.preferred_age_group:
                query = query.filter(
                    or_(
                        Video.target_age_group == user.preferred_age_group,
                        Video.target_age_group.is_(None)
                    )
                )
            
            # Filter by recommendation type
            if recommendation_type == "educational":
                query = query.filter(Video.content_type == ContentType.EDUCATIONAL)
            elif recommendation_type == "entertainment":
                query = query.filter(Video.content_type == ContentType.ENTERTAINMENT)
            
            # Exclude recently watched videos
            recent_date = datetime.now() - timedelta(days=7)
            watched_video_ids = db.query(WatchHistory.video_id).filter(
                WatchHistory.user_id == user.id,
                WatchHistory.watched_at >= recent_date
            ).subquery()
            
            query = query.filter(~Video.id.in_(watched_video_ids))
            
            # Get random sample for diversity
            candidates = query.order_by(func.random()).limit(200).all()
            
            return candidates
            
        except Exception as e:
            logger.error(f"Error getting candidate videos: {e}")
            return []
    
    async def calculate_recommendation_score(
        self, 
        db: Session, 
        user: User, 
        video: Video, 
        user_profile: Dict
    ) -> float:
        """Calculate recommendation score for a video"""
        try:
            score = 0.0
            
            # Age appropriateness score
            age_score = 0
            if user.preferred_age_group and video.target_age_group:
                if user.preferred_age_group == video.target_age_group:
                    age_score = 1.0
                else:
                    # Partial match for adjacent age groups
                    age_groups = [AgeGroup.TODDLER, AgeGroup.CHILD, AgeGroup.TEEN]
                    user_idx = age_groups.index(user.preferred_age_group)
                    video_idx = age_groups.index(video.target_age_group)
                    if abs(user_idx - video_idx) == 1:
                        age_score = 0.6
            else:
                age_score = 0.5  # Neutral for unspecified age groups
            
            score += age_score * self.recommendation_weights['age_match']
            
            # Content type preference score
            content_type_score = 0
            if video.content_type:
                content_prefs = user_profile.get('content_type_preferences', {})
                total_views = sum(content_prefs.values())
                if total_views > 0:
                    content_type_score = content_prefs.get(video.content_type.value, 0) / total_views
                else:
                    content_type_score = 0.5
            
            score += content_type_score * self.recommendation_weights['content_type_preference']
            
            # Category preference score
            category_score = 0
            if video.category:
                category_prefs = user_profile.get('category_preferences', {})
                total_views = sum(category_prefs.values())
                if total_views > 0:
                    category_score = category_prefs.get(video.category.name, 0) / total_views
                else:
                    category_score = 0.5
            
            score += category_score * self.recommendation_weights['category_preference']
            
            # Time of day relevance
            current_hour = datetime.now().hour
            time_score = 0
            if current_hour < 12:  # Morning
                time_period = 'morning'
            elif current_hour < 18:  # Afternoon
                time_period = 'afternoon'
            else:  # Evening
                time_period = 'evening'
            
            if video.content_type and video.content_type.value in self.time_based_content.get(time_period, []):
                time_score = 1.0
            else:
                time_score = 0.3
            
            score += time_score * self.recommendation_weights['time_of_day']
            
            # Educational progress alignment
            education_score = 0
            if video.content_type == ContentType.EDUCATIONAL:
                quiz_accuracy = user_profile.get('quiz_accuracy', 0)
                if quiz_accuracy > 0.8:  # High performer
                    education_score = 1.0
                elif quiz_accuracy > 0.6:  # Average performer
                    education_score = 0.8
                else:  # Needs more practice
                    education_score = 0.9
            else:
                education_score = 0.5
            
            score += education_score * self.recommendation_weights['educational_progress']
            
            # Boost for high-quality content
            if video.safety_score > 90:
                score *= 1.1
            
            # Boost for popular content (but not too much to avoid echo chamber)
            if video.view_count > 1000:
                score *= 1.05
            
            return min(score, 1.0)  # Cap at 1.0
            
        except Exception as e:
            logger.error(f"Error calculating recommendation score: {e}")
            return 0.0
    
    async def apply_diversity_filter(
        self, 
        scored_videos: List[Tuple], 
        user_profile: Dict, 
        limit: int
    ) -> List[Tuple]:
        """Apply diversity filter to avoid echo chamber"""
        try:
            if len(scored_videos) <= limit:
                return scored_videos
            
            selected = []
            category_counts = defaultdict(int)
            content_type_counts = defaultdict(int)
            
            # First, select top videos while maintaining diversity
            for video, score in scored_videos:
                if len(selected) >= limit:
                    break
                
                category = video.category.name if video.category else "uncategorized"
                content_type = video.content_type.value if video.content_type else "general"
                
                # Check diversity constraints
                max_per_category = max(2, limit // 5)  # At most 20% from same category
                max_per_type = max(3, limit // 3)     # At most 33% from same type
                
                if (category_counts[category] < max_per_category and 
                    content_type_counts[content_type] < max_per_type):
                    selected.append((video, score))
                    category_counts[category] += 1
                    content_type_counts[content_type] += 1
                elif len(selected) < limit // 2:  # Be more flexible for first half
                    selected.append((video, score))
                    category_counts[category] += 1
                    content_type_counts[content_type] += 1
            
            return selected
            
        except Exception as e:
            logger.error(f"Error applying diversity filter: {e}")
            return scored_videos[:limit]
    
    async def get_recommendation_reason(self, video: Video, user_profile: Dict) -> str:
        """Generate explanation for why this video was recommended"""
        try:
            reasons = []
            
            # Age match
            if video.target_age_group:
                reasons.append(f"Perfect for your age group")
            
            # Category preference
            category_prefs = user_profile.get('category_preferences', {})
            if video.category and video.category.name in category_prefs:
                reasons.append(f"You love {video.category.name} videos")
            
            # Content type preference
            content_prefs = user_profile.get('content_type_preferences', {})
            if video.content_type and video.content_type.value in content_prefs:
                reasons.append(f"Based on your {video.content_type.value} interests")
            
            # High quality
            if video.safety_score > 90:
                reasons.append("High quality content")
            
            # Educational value
            if video.content_type == ContentType.EDUCATIONAL:
                quiz_accuracy = user_profile.get('quiz_accuracy', 0)
                if quiz_accuracy > 0.7:
                    reasons.append("Continue your learning journey")
                else:
                    reasons.append("Great for learning new things")
            
            # Default reason
            if not reasons:
                reasons.append("Recommended for you")
            
            return reasons[0]  # Return the most relevant reason
            
        except Exception as e:
            logger.error(f"Error generating recommendation reason: {e}")
            return "Recommended for you"

class AvatarCustomizationSystem:
    def __init__(self):
        self.avatar_components = {
            "face": {
                "shapes": ["round", "oval", "square"],
                "colors": ["light", "medium", "dark", "tan"]
            },
            "eyes": {
                "shapes": ["round", "almond", "wide"],
                "colors": ["brown", "blue", "green", "hazel"]
            },
            "hair": {
                "styles": ["short", "long", "curly", "straight", "braids", "ponytail"],
                "colors": ["black", "brown", "blonde", "red", "blue", "purple", "pink"]
            },
            "clothing": {
                "tops": ["t-shirt", "sweater", "dress", "hoodie"],
                "colors": ["red", "blue", "green", "yellow", "purple", "pink", "orange"],
                "patterns": ["solid", "stripes", "polka-dots", "rainbow"]
            },
            "accessories": {
                "hats": ["cap", "beanie", "crown", "headband"],
                "glasses": ["none", "regular", "sunglasses", "fun-shapes"],
                "items": ["backpack", "book", "toy", "pet"]
            }
        }
        
        self.unlockable_items = {
            "watch_time": {
                60: ["new_hair_color", "cool_hat"],      # 1 hour
                300: ["special_glasses", "superhero_cape"],  # 5 hours
                600: ["rainbow_hair", "magic_wand"]      # 10 hours
            },
            "quiz_score": {
                10: ["smart_glasses", "graduation_cap"],
                25: ["wizard_hat", "book_accessory"],
                50: ["crown", "trophy"]
            },
            "achievements": {
                "first_video": ["welcome_badge"],
                "quiz_master": ["brain_hat", "genius_glasses"],
                "helpful_reporter": ["safety_badge", "hero_cape"]
            }
        }
    
    async def get_avatar_config(self, db: Session, user_id: int) -> Dict:
        """Get user's current avatar configuration"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.avatar_config:
                return self.get_default_avatar()
            
            return user.avatar_config
            
        except Exception as e:
            logger.error(f"Error getting avatar config: {e}")
            return self.get_default_avatar()
    
    def get_default_avatar(self) -> Dict:
        """Get default avatar configuration"""
        return {
            "face": {"shape": "round", "color": "light"},
            "eyes": {"shape": "round", "color": "brown"},
            "hair": {"style": "short", "color": "brown"},
            "clothing": {
                "top": "t-shirt",
                "color": "blue",
                "pattern": "solid"
            },
            "accessories": {
                "hat": "none",
                "glasses": "none",
                "item": "none"
            },
            "unlocked_items": ["basic_items"]
        }
    
    async def update_avatar(
        self, 
        db: Session, 
        user_id: int, 
        avatar_config: Dict
    ) -> Dict[str, any]:
        """Update user's avatar configuration"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Validate configuration
            if not self.validate_avatar_config(avatar_config):
                return {"success": False, "error": "Invalid avatar configuration"}
            
            # Check if user has unlocked all items
            unlocked_items = await self.get_unlocked_items(db, user_id)
            if not self.check_item_permissions(avatar_config, unlocked_items):
                return {"success": False, "error": "Some items are not unlocked yet"}
            
            # Update avatar
            user.avatar_config = avatar_config
            db.commit()
            
            return {"success": True, "avatar_config": avatar_config}
            
        except Exception as e:
            logger.error(f"Error updating avatar: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    def validate_avatar_config(self, config: Dict) -> bool:
        """Validate avatar configuration against available options"""
        try:
            required_components = ["face", "eyes", "hair", "clothing", "accessories"]
            
            for component in required_components:
                if component not in config:
                    return False
            
            # Validate face
            face = config["face"]
            if (face.get("shape") not in self.avatar_components["face"]["shapes"] or
                face.get("color") not in self.avatar_components["face"]["colors"]):
                return False
            
            # Validate other components similarly...
            # (Simplified for brevity)
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating avatar config: {e}")
            return False
    
    async def get_unlocked_items(self, db: Session, user_id: int) -> List[str]:
        """Get list of items user has unlocked"""
        try:
            unlocked = ["basic_items"]  # Everyone starts with basic items
            
            # Get watch time
            total_watch_time = db.query(func.sum(WatchHistory.watch_duration)).filter(
                WatchHistory.user_id == user_id
            ).scalar() or 0
            
            watch_time_hours = total_watch_time / 3600
            
            for threshold, items in self.unlockable_items["watch_time"].items():
                if watch_time_hours >= threshold:
                    unlocked.extend(items)
            
            # Get quiz performance
            quiz_count = db.query(func.count(QuizResult.id)).filter(
                QuizResult.user_id == user_id,
                QuizResult.is_correct == True
            ).scalar() or 0
            
            for threshold, items in self.unlockable_items["quiz_score"].items():
                if quiz_count >= threshold:
                    unlocked.extend(items)
            
            # Get achievements
            user_achievements = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.is_completed == True
            ).all()
            
            # Add achievement-based unlocks (simplified)
            if len(user_achievements) > 0:
                unlocked.extend(self.unlockable_items["achievements"]["first_video"])
            
            return list(set(unlocked))  # Remove duplicates
            
        except Exception as e:
            logger.error(f"Error getting unlocked items: {e}")
            return ["basic_items"]
    
    def check_item_permissions(self, avatar_config: Dict, unlocked_items: List[str]) -> bool:
        """Check if user has permission to use all items in configuration"""
        # Simplified check - in a real system, you'd map each configuration option
        # to specific unlockable items
        return True  # For now, allow all configurations
    
    async def get_avatar_customization_options(
        self, 
        db: Session, 
        user_id: int
    ) -> Dict[str, any]:
        """Get available customization options for user"""
        try:
            unlocked_items = await self.get_unlocked_items(db, user_id)
            
            # Build available options based on unlocked items
            available_options = {}
            
            for component, options in self.avatar_components.items():
                available_options[component] = {}
                for option_type, values in options.items():
                    # Filter based on unlocked items (simplified)
                    available_options[component][option_type] = values
            
            return {
                "components": available_options,
                "unlocked_items": unlocked_items,
                "progress": await self.get_unlock_progress(db, user_id)
            }
            
        except Exception as e:
            logger.error(f"Error getting customization options: {e}")
            return {"components": self.avatar_components, "unlocked_items": ["basic_items"]}
    
    async def get_unlock_progress(self, db: Session, user_id: int) -> Dict:
        """Get progress towards unlocking new items"""
        try:
            # Watch time progress
            total_watch_time = db.query(func.sum(WatchHistory.watch_duration)).filter(
                WatchHistory.user_id == user_id
            ).scalar() or 0
            
            watch_time_hours = total_watch_time / 3600
            
            # Quiz progress
            quiz_count = db.query(func.count(QuizResult.id)).filter(
                QuizResult.user_id == user_id,
                QuizResult.is_correct == True
            ).scalar() or 0
            
            return {
                "watch_time": {
                    "current_hours": round(watch_time_hours, 1),
                    "next_unlock": self.get_next_watch_time_unlock(watch_time_hours)
                },
                "quiz_score": {
                    "current_correct": quiz_count,
                    "next_unlock": self.get_next_quiz_unlock(quiz_count)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting unlock progress: {e}")
            return {}
    
    def get_next_watch_time_unlock(self, current_hours: float) -> Optional[Dict]:
        """Get next watch time unlock threshold"""
        for threshold in sorted(self.unlockable_items["watch_time"].keys()):
            if current_hours < threshold:
                return {
                    "threshold": threshold,
                    "items": self.unlockable_items["watch_time"][threshold],
                    "hours_remaining": threshold - current_hours
                }
        return None
    
    def get_next_quiz_unlock(self, current_score: int) -> Optional[Dict]:
        """Get next quiz score unlock threshold"""
        for threshold in sorted(self.unlockable_items["quiz_score"].keys()):
            if current_score < threshold:
                return {
                    "threshold": threshold,
                    "items": self.unlockable_items["quiz_score"][threshold],
                    "points_remaining": threshold - current_score
                }
        return None

class LearningPathSystem:
    def __init__(self):
        self.learning_paths = {
            "mathematics": {
                "3-6": ["counting", "shapes", "colors", "basic_addition"],
                "7-12": ["multiplication", "fractions", "geometry", "word_problems"],
                "13-17": ["algebra", "statistics", "advanced_geometry"]
            },
            "science": {
                "3-6": ["animals", "plants", "weather", "body_parts"],
                "7-12": ["solar_system", "experiments", "biology", "physics_basics"],
                "13-17": ["chemistry", "advanced_physics", "environmental_science"]
            },
            "language": {
                "3-6": ["alphabet", "phonics", "simple_words", "storytelling"],
                "7-12": ["reading_comprehension", "grammar", "creative_writing"],
                "13-17": ["literature", "advanced_writing", "public_speaking"]
            }
        }
    
    async def generate_learning_path(
        self, 
        db: Session, 
        user_id: int, 
        subject: str
    ) -> List[Dict]:
        """Generate personalized learning path for user"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return []
            
            age_group = user.preferred_age_group.value if user.preferred_age_group else "7-12"
            
            # Get user's progress in this subject
            user_progress = await self.assess_user_progress(db, user_id, subject)
            
            # Get appropriate topics for age group
            topics = self.learning_paths.get(subject, {}).get(age_group, [])
            
            # Create learning path with progress tracking
            learning_path = []
            for i, topic in enumerate(topics):
                topic_progress = user_progress.get(topic, 0)
                
                # Find relevant videos for this topic
                topic_videos = await self.get_topic_videos(db, topic, age_group)
                
                learning_path.append({
                    "topic": topic,
                    "order": i + 1,
                    "progress_percentage": topic_progress,
                    "status": self.get_topic_status(topic_progress),
                    "recommended_videos": topic_videos[:5],  # Top 5 videos
                    "estimated_duration": len(topic_videos) * 10,  # Rough estimate
                    "difficulty": self.get_topic_difficulty(topic, age_group)
                })
            
            return learning_path
            
        except Exception as e:
            logger.error(f"Error generating learning path: {e}")
            return []
    
    async def assess_user_progress(self, db: Session, user_id: int, subject: str) -> Dict[str, float]:
        """Assess user's progress in different topics"""
        try:
            # Get quiz results for educational content
            quiz_results = db.query(QuizResult).join(
                QuizResult.question
            ).join(
                QuizResult.question.has(video=Video)
            ).filter(
                QuizResult.user_id == user_id,
                Video.content_type == ContentType.EDUCATIONAL
            ).all()
            
            # Analyze progress by topic (simplified)
            topic_progress = {}
            
            # This would be more sophisticated in a real system,
            # analyzing video tags, quiz categories, etc.
            
            return topic_progress
            
        except Exception as e:
            logger.error(f"Error assessing user progress: {e}")
            return {}
    
    async def get_topic_videos(self, db: Session, topic: str, age_group: str) -> List[Dict]:
        """Get videos relevant to a specific topic"""
        try:
            # This would use more sophisticated matching in a real system
            videos = db.query(Video).filter(
                Video.is_approved == True,
                Video.content_type == ContentType.EDUCATIONAL,
                Video.safety_score >= 80
            ).limit(20).all()
            
            # Filter and score videos by topic relevance
            relevant_videos = []
            for video in videos:
                relevance_score = self.calculate_topic_relevance(video, topic)
                if relevance_score > 0.3:
                    relevant_videos.append({
                        "video_id": video.id,
                        "title": video.title,
                        "duration": video.duration,
                        "relevance_score": relevance_score
                    })
            
            # Sort by relevance
            relevant_videos.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            return relevant_videos
            
        except Exception as e:
            logger.error(f"Error getting topic videos: {e}")
            return []
    
    def calculate_topic_relevance(self, video: Video, topic: str) -> float:
        """Calculate how relevant a video is to a specific topic"""
        # Simplified relevance calculation
        title_words = video.title.lower().split()
        description_words = (video.description or "").lower().split()
        
        topic_keywords = {
            "counting": ["count", "number", "1", "2", "3", "math"],
            "shapes": ["circle", "square", "triangle", "shape"],
            "animals": ["animal", "dog", "cat", "bird", "zoo"],
            # Add more topic keywords...
        }
        
        keywords = topic_keywords.get(topic, [topic])
        
        relevance = 0
        for keyword in keywords:
            if keyword in title_words:
                relevance += 0.3
            if keyword in description_words:
                relevance += 0.1
        
        return min(relevance, 1.0)
    
    def get_topic_status(self, progress: float) -> str:
        """Get status based on progress percentage"""
        if progress == 0:
            return "not_started"
        elif progress < 30:
            return "just_started"
        elif progress < 70:
            return "in_progress"
        elif progress < 100:
            return "almost_complete"
        else:
            return "completed"
    
    def get_topic_difficulty(self, topic: str, age_group: str) -> str:
        """Get difficulty level for topic and age group"""
        difficulty_map = {
            "3-6": "easy",
            "7-12": "medium",
            "13-17": "hard"
        }
        return difficulty_map.get(age_group, "medium")