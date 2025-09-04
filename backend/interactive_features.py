"""
Interactive Features System
Watch Party, Quiz System, Mini-games, and other interactive features for kids
"""

import asyncio
import json
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from models import (
    WatchParty, WatchPartyParticipant, QuizQuestion, QuizResult, 
    Achievement, UserAchievement, VideoReaction, Bookmark, User, Video
)

logger = logging.getLogger(__name__)

class WatchPartyManager:
    def __init__(self):
        self.active_parties: Dict[str, Dict] = {}  # In-memory party state
        self.party_connections: Dict[str, Set[int]] = {}  # WebSocket connections
    
    def generate_room_code(self) -> str:
        """Generate unique room code for watch party"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    async def create_watch_party(
        self, 
        db: Session, 
        host_id: int, 
        video_id: int, 
        max_participants: int = 10
    ) -> Dict[str, any]:
        """Create a new watch party"""
        try:
            room_code = self.generate_room_code()
            
            # Ensure room code is unique
            while db.query(WatchParty).filter(WatchParty.room_code == room_code).first():
                room_code = self.generate_room_code()
            
            party = WatchParty(
                room_code=room_code,
                host_id=host_id,
                video_id=video_id,
                max_participants=max_participants,
                current_time=0.0,
                is_playing=False
            )
            
            db.add(party)
            db.commit()
            db.refresh(party)
            
            # Initialize in-memory state
            self.active_parties[room_code] = {
                "id": party.id,
                "host_id": host_id,
                "video_id": video_id,
                "current_time": 0.0,
                "is_playing": False,
                "participants": [host_id],
                "last_sync": datetime.now(),
                "reactions": []
            }
            
            self.party_connections[room_code] = set()
            
            # Add host as participant
            participant = WatchPartyParticipant(
                party_id=party.id,
                user_id=host_id
            )
            db.add(participant)
            db.commit()
            
            logger.info(f"Created watch party {room_code} by user {host_id}")
            
            return {
                "success": True,
                "room_code": room_code,
                "party_id": party.id,
                "host_id": host_id,
                "video_id": video_id
            }
            
        except Exception as e:
            logger.error(f"Error creating watch party: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def join_watch_party(
        self, 
        db: Session, 
        room_code: str, 
        user_id: int
    ) -> Dict[str, any]:
        """Join an existing watch party"""
        try:
            party = db.query(WatchParty).filter(
                WatchParty.room_code == room_code,
                WatchParty.is_active == True
            ).first()
            
            if not party:
                return {"success": False, "error": "Party not found"}
            
            # Check if party is full
            participant_count = db.query(WatchPartyParticipant).filter(
                WatchPartyParticipant.party_id == party.id,
                WatchPartyParticipant.is_active == True
            ).count()
            
            if participant_count >= party.max_participants:
                return {"success": False, "error": "Party is full"}
            
            # Check if user already joined
            existing = db.query(WatchPartyParticipant).filter(
                WatchPartyParticipant.party_id == party.id,
                WatchPartyParticipant.user_id == user_id,
                WatchPartyParticipant.is_active == True
            ).first()
            
            if existing:
                return {"success": False, "error": "Already joined this party"}
            
            # Add participant
            participant = WatchPartyParticipant(
                party_id=party.id,
                user_id=user_id
            )
            db.add(participant)
            db.commit()
            
            # Update in-memory state
            if room_code in self.active_parties:
                self.active_parties[room_code]["participants"].append(user_id)
            
            logger.info(f"User {user_id} joined watch party {room_code}")
            
            return {
                "success": True,
                "party_id": party.id,
                "room_code": room_code,
                "video_id": party.video_id,
                "current_time": party.current_time,
                "is_playing": party.is_playing,
                "host_id": party.host_id
            }
            
        except Exception as e:
            logger.error(f"Error joining watch party: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def sync_party_state(
        self, 
        db: Session, 
        room_code: str, 
        user_id: int, 
        action: str, 
        data: Dict = None
    ) -> Dict[str, any]:
        """Synchronize party state (play, pause, seek, etc.)"""
        try:
            if room_code not in self.active_parties:
                return {"success": False, "error": "Party not found"}
            
            party_state = self.active_parties[room_code]
            
            # Only host can control playback
            if action in ["play", "pause", "seek"] and user_id != party_state["host_id"]:
                return {"success": False, "error": "Only host can control playback"}
            
            # Update state based on action
            if action == "play":
                party_state["is_playing"] = True
                party_state["last_sync"] = datetime.now()
            elif action == "pause":
                party_state["is_playing"] = False
                party_state["current_time"] = data.get("current_time", party_state["current_time"])
            elif action == "seek":
                party_state["current_time"] = data.get("current_time", 0)
                party_state["last_sync"] = datetime.now()
            elif action == "reaction":
                reaction = {
                    "user_id": user_id,
                    "type": data.get("reaction_type", "👍"),
                    "timestamp": datetime.now().isoformat()
                }
                party_state["reactions"].append(reaction)
                # Keep only last 50 reactions
                party_state["reactions"] = party_state["reactions"][-50:]
            
            # Update database
            db.query(WatchParty).filter(WatchParty.room_code == room_code).update({
                "current_time": party_state["current_time"],
                "is_playing": party_state["is_playing"]
            })
            db.commit()
            
            return {
                "success": True,
                "action": action,
                "current_time": party_state["current_time"],
                "is_playing": party_state["is_playing"],
                "participants": party_state["participants"],
                "reactions": party_state["reactions"][-10:]  # Return last 10 reactions
            }
            
        except Exception as e:
            logger.error(f"Error syncing party state: {e}")
            return {"success": False, "error": str(e)}
    
    async def leave_watch_party(
        self, 
        db: Session, 
        room_code: str, 
        user_id: int
    ) -> Dict[str, any]:
        """Leave a watch party"""
        try:
            party = db.query(WatchParty).filter(WatchParty.room_code == room_code).first()
            if not party:
                return {"success": False, "error": "Party not found"}
            
            # Mark participant as inactive
            participant = db.query(WatchPartyParticipant).filter(
                WatchPartyParticipant.party_id == party.id,
                WatchPartyParticipant.user_id == user_id
            ).first()
            
            if participant:
                participant.is_active = False
                db.commit()
            
            # Update in-memory state
            if room_code in self.active_parties:
                party_state = self.active_parties[room_code]
                if user_id in party_state["participants"]:
                    party_state["participants"].remove(user_id)
                
                # If host left, transfer to another participant or close party
                if user_id == party_state["host_id"] and party_state["participants"]:
                    new_host = party_state["participants"][0]
                    party_state["host_id"] = new_host
                    db.query(WatchParty).filter(WatchParty.room_code == room_code).update({
                        "host_id": new_host
                    })
                    db.commit()
                elif user_id == party_state["host_id"]:
                    # Close party if no participants left
                    await self.close_watch_party(db, room_code)
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error leaving watch party: {e}")
            return {"success": False, "error": str(e)}
    
    async def close_watch_party(self, db: Session, room_code: str) -> bool:
        """Close a watch party"""
        try:
            # Mark party as inactive
            db.query(WatchParty).filter(WatchParty.room_code == room_code).update({
                "is_active": False
            })
            
            # Mark all participants as inactive
            party = db.query(WatchParty).filter(WatchParty.room_code == room_code).first()
            if party:
                db.query(WatchPartyParticipant).filter(
                    WatchPartyParticipant.party_id == party.id
                ).update({"is_active": False})
            
            db.commit()
            
            # Clean up in-memory state
            if room_code in self.active_parties:
                del self.active_parties[room_code]
            if room_code in self.party_connections:
                del self.party_connections[room_code]
            
            logger.info(f"Closed watch party {room_code}")
            return True
            
        except Exception as e:
            logger.error(f"Error closing watch party: {e}")
            return False

class QuizManager:
    def __init__(self):
        self.quiz_templates = {
            "educational": [
                {
                    "question": "What color do you get when you mix red and yellow?",
                    "options": ["Orange", "Purple", "Green", "Blue"],
                    "correct_answer": 0,
                    "explanation": "Red and yellow make orange! 🧡"
                },
                {
                    "question": "How many legs does a spider have?",
                    "options": ["6", "8", "10", "4"],
                    "correct_answer": 1,
                    "explanation": "Spiders have 8 legs! 🕷️"
                }
            ],
            "counting": [
                {
                    "question": "If you have 3 apples and eat 1, how many do you have left?",
                    "options": ["1", "2", "3", "4"],
                    "correct_answer": 1,
                    "explanation": "3 - 1 = 2 apples left! 🍎"
                }
            ]
        }
    
    async def create_quiz_questions(
        self, 
        db: Session, 
        video_id: int, 
        questions_data: List[Dict]
    ) -> List[QuizQuestion]:
        """Create quiz questions for a video"""
        try:
            questions = []
            
            for q_data in questions_data:
                question = QuizQuestion(
                    video_id=video_id,
                    question=q_data["question"],
                    options=q_data["options"],
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data.get("explanation", ""),
                    timestamp=q_data.get("timestamp", 0),
                    difficulty=q_data.get("difficulty", "easy")
                )
                
                db.add(question)
                questions.append(question)
            
            db.commit()
            logger.info(f"Created {len(questions)} quiz questions for video {video_id}")
            
            return questions
            
        except Exception as e:
            logger.error(f"Error creating quiz questions: {e}")
            db.rollback()
            return []
    
    async def get_video_quiz_questions(
        self, 
        db: Session, 
        video_id: int,
        user_age_group: str = None
    ) -> List[Dict]:
        """Get quiz questions for a video, filtered by age group"""
        try:
            questions = db.query(QuizQuestion).filter(
                QuizQuestion.video_id == video_id
            ).all()
            
            # Filter by difficulty based on age group
            if user_age_group:
                difficulty_mapping = {
                    "3-6": ["easy"],
                    "7-12": ["easy", "medium"],
                    "13-17": ["easy", "medium", "hard"]
                }
                allowed_difficulties = difficulty_mapping.get(user_age_group, ["easy"])
                questions = [q for q in questions if q.difficulty in allowed_difficulties]
            
            return [
                {
                    "id": q.id,
                    "question": q.question,
                    "options": q.options,
                    "timestamp": q.timestamp,
                    "difficulty": q.difficulty
                }
                for q in questions
            ]
            
        except Exception as e:
            logger.error(f"Error getting quiz questions: {e}")
            return []
    
    async def submit_quiz_answer(
        self, 
        db: Session, 
        user_id: int, 
        question_id: int, 
        selected_answer: int
    ) -> Dict[str, any]:
        """Submit and evaluate quiz answer"""
        try:
            question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
            if not question:
                return {"success": False, "error": "Question not found"}
            
            is_correct = selected_answer == question.correct_answer
            
            # Save result
            result = QuizResult(
                user_id=user_id,
                question_id=question_id,
                selected_answer=selected_answer,
                is_correct=is_correct
            )
            
            db.add(result)
            db.commit()
            
            # Update achievements
            await self.update_quiz_achievements(db, user_id, is_correct)
            
            return {
                "success": True,
                "is_correct": is_correct,
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
                "points_earned": 10 if is_correct else 2
            }
            
        except Exception as e:
            logger.error(f"Error submitting quiz answer: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def get_user_quiz_stats(self, db: Session, user_id: int, days: int = 30) -> Dict:
        """Get user's quiz performance statistics"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            results = db.query(QuizResult).filter(
                QuizResult.user_id == user_id,
                QuizResult.answered_at >= start_date
            ).all()
            
            total_questions = len(results)
            correct_answers = sum(1 for r in results if r.is_correct)
            accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
            
            # Category breakdown
            category_stats = {}
            for result in results:
                question = db.query(QuizQuestion).filter(
                    QuizQuestion.id == result.question_id
                ).first()
                
                if question and question.video:
                    category = question.video.category.name if question.video.category else "General"
                    if category not in category_stats:
                        category_stats[category] = {"total": 0, "correct": 0}
                    
                    category_stats[category]["total"] += 1
                    if result.is_correct:
                        category_stats[category]["correct"] += 1
            
            return {
                "total_questions": total_questions,
                "correct_answers": correct_answers,
                "accuracy_percentage": round(accuracy, 1),
                "points_earned": correct_answers * 10 + (total_questions - correct_answers) * 2,
                "category_breakdown": category_stats,
                "period_days": days
            }
            
        except Exception as e:
            logger.error(f"Error getting quiz stats: {e}")
            return {}
    
    async def update_quiz_achievements(self, db: Session, user_id: int, is_correct: bool):
        """Update quiz-related achievements"""
        try:
            if is_correct:
                # Check for consecutive correct answers
                recent_results = db.query(QuizResult).filter(
                    QuizResult.user_id == user_id
                ).order_by(QuizResult.answered_at.desc()).limit(5).all()
                
                consecutive_correct = 0
                for result in recent_results:
                    if result.is_correct:
                        consecutive_correct += 1
                    else:
                        break
                
                # Award achievements based on streaks
                if consecutive_correct >= 5:
                    await self.award_achievement(db, user_id, "quiz_streak_5")
                elif consecutive_correct >= 3:
                    await self.award_achievement(db, user_id, "quiz_streak_3")
            
        except Exception as e:
            logger.error(f"Error updating quiz achievements: {e}")
    
    async def award_achievement(self, db: Session, user_id: int, achievement_key: str):
        """Award achievement to user"""
        try:
            # This is a simplified version - you'd have a proper achievement system
            achievement_data = {
                "quiz_streak_3": {"name": "Quiz Master", "points": 50},
                "quiz_streak_5": {"name": "Quiz Champion", "points": 100}
            }
            
            if achievement_key in achievement_data:
                logger.info(f"User {user_id} earned achievement: {achievement_key}")
                # Implementation would create UserAchievement record
            
        except Exception as e:
            logger.error(f"Error awarding achievement: {e}")

class MiniGamesManager:
    def __init__(self):
        self.game_types = {
            "memory": "Memory matching game with video screenshots",
            "coloring": "Digital coloring book based on video content",
            "puzzle": "Jigsaw puzzle from video frames",
            "word_match": "Match words to pictures from educational videos"
        }
    
    async def create_memory_game(self, db: Session, video_id: int) -> Dict[str, any]:
        """Create memory matching game from video content"""
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                return {"success": False, "error": "Video not found"}
            
            # Generate game data (simplified)
            game_data = {
                "game_type": "memory",
                "video_id": video_id,
                "difficulty": "easy",  # Could be adjusted based on user age
                "cards": self.generate_memory_cards(video),
                "time_limit": 300,  # 5 minutes
                "max_attempts": 20
            }
            
            return {
                "success": True,
                "game_id": f"memory_{video_id}_{int(datetime.now().timestamp())}",
                "game_data": game_data
            }
            
        except Exception as e:
            logger.error(f"Error creating memory game: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_memory_cards(self, video: Video) -> List[Dict]:
        """Generate memory game cards from video content"""
        # This would extract frames/screenshots from video
        # For now, using placeholder data
        
        base_cards = [
            {"id": 1, "type": "image", "content": "frame_1.jpg", "match_id": 1},
            {"id": 2, "type": "image", "content": "frame_1.jpg", "match_id": 1},
            {"id": 3, "type": "image", "content": "frame_2.jpg", "match_id": 2},
            {"id": 4, "type": "image", "content": "frame_2.jpg", "match_id": 2},
            {"id": 5, "type": "image", "content": "frame_3.jpg", "match_id": 3},
            {"id": 6, "type": "image", "content": "frame_3.jpg", "match_id": 3},
        ]
        
        # Shuffle cards
        random.shuffle(base_cards)
        return base_cards
    
    async def create_coloring_page(self, db: Session, video_id: int) -> Dict[str, any]:
        """Create coloring page from video content"""
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                return {"success": False, "error": "Video not found"}
            
            # Generate coloring page data
            coloring_data = {
                "game_type": "coloring",
                "video_id": video_id,
                "template": "template_1.svg",  # SVG coloring template
                "colors": [
                    "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                    "#FF00FF", "#00FFFF", "#FFA500", "#800080"
                ],
                "tools": ["brush", "bucket", "eraser"],
                "save_enabled": True
            }
            
            return {
                "success": True,
                "game_id": f"coloring_{video_id}_{int(datetime.now().timestamp())}",
                "game_data": coloring_data
            }
            
        except Exception as e:
            logger.error(f"Error creating coloring page: {e}")
            return {"success": False, "error": str(e)}

class BookmarkManager:
    async def create_bookmark(
        self, 
        db: Session, 
        user_id: int, 
        video_id: int, 
        timestamp: float,
        note: str = "",
        folder_name: str = "Default"
    ) -> Dict[str, any]:
        """Create a bookmark for a specific video timestamp"""
        try:
            bookmark = Bookmark(
                user_id=user_id,
                video_id=video_id,
                timestamp=timestamp,
                note=note,
                folder_name=folder_name
            )
            
            db.add(bookmark)
            db.commit()
            db.refresh(bookmark)
            
            return {
                "success": True,
                "bookmark_id": bookmark.id,
                "timestamp": timestamp,
                "note": note,
                "folder_name": folder_name
            }
            
        except Exception as e:
            logger.error(f"Error creating bookmark: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def get_user_bookmarks(
        self, 
        db: Session, 
        user_id: int, 
        folder_name: str = None
    ) -> List[Dict]:
        """Get user's bookmarks, optionally filtered by folder"""
        try:
            query = db.query(Bookmark).join(Video).filter(Bookmark.user_id == user_id)
            
            if folder_name:
                query = query.filter(Bookmark.folder_name == folder_name)
            
            bookmarks = query.order_by(Bookmark.created_at.desc()).all()
            
            return [
                {
                    "id": b.id,
                    "video_id": b.video_id,
                    "video_title": b.video.title,
                    "timestamp": b.timestamp,
                    "note": b.note,
                    "folder_name": b.folder_name,
                    "created_at": b.created_at.isoformat()
                }
                for b in bookmarks
            ]
            
        except Exception as e:
            logger.error(f"Error getting bookmarks: {e}")
            return []
    
    async def create_video_clip(
        self, 
        db: Session, 
        user_id: int, 
        video_id: int, 
        start_time: float, 
        end_time: float,
        clip_name: str = ""
    ) -> Dict[str, any]:
        """Create a short clip from bookmarked segments"""
        try:
            # This would involve video processing to extract the clip
            # For now, we'll just create a bookmark record with special metadata
            
            clip_data = {
                "type": "clip",
                "start_time": start_time,
                "end_time": end_time,
                "duration": end_time - start_time,
                "clip_name": clip_name or f"Clip {int(datetime.now().timestamp())}"
            }
            
            bookmark = Bookmark(
                user_id=user_id,
                video_id=video_id,
                timestamp=start_time,
                note=json.dumps(clip_data),
                folder_name="Clips"
            )
            
            db.add(bookmark)
            db.commit()
            db.refresh(bookmark)
            
            return {
                "success": True,
                "clip_id": bookmark.id,
                "clip_data": clip_data
            }
            
        except Exception as e:
            logger.error(f"Error creating video clip: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}

# Reaction system for real-time emoji reactions
class ReactionManager:
    def __init__(self):
        self.reaction_types = {
            "😀": "happy",
            "😂": "laugh",
            "😍": "love",
            "😮": "wow",
            "👏": "clap",
            "❤️": "heart",
            "🎉": "celebrate",
            "🤔": "thinking"
        }
    
    async def add_reaction(
        self, 
        db: Session, 
        user_id: int, 
        video_id: int, 
        reaction_type: str,
        timestamp: float
    ) -> Dict[str, any]:
        """Add emoji reaction to video at specific timestamp"""
        try:
            if reaction_type not in self.reaction_types.values():
                return {"success": False, "error": "Invalid reaction type"}
            
            reaction = VideoReaction(
                user_id=user_id,
                video_id=video_id,
                reaction_type=reaction_type,
                timestamp=timestamp
            )
            
            db.add(reaction)
            db.commit()
            
            return {
                "success": True,
                "reaction_id": reaction.id,
                "reaction_type": reaction_type,
                "timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"Error adding reaction: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}
    
    async def get_video_reactions(
        self, 
        db: Session, 
        video_id: int, 
        time_window: float = 60.0
    ) -> Dict[str, List]:
        """Get recent reactions for a video within time window"""
        try:
            recent_time = datetime.now() - timedelta(seconds=time_window)
            
            reactions = db.query(VideoReaction).filter(
                VideoReaction.video_id == video_id,
                VideoReaction.created_at >= recent_time
            ).all()
            
            # Group reactions by type
            reaction_counts = {}
            recent_reactions = []
            
            for reaction in reactions:
                reaction_type = reaction.reaction_type
                reaction_counts[reaction_type] = reaction_counts.get(reaction_type, 0) + 1
                
                recent_reactions.append({
                    "user_id": reaction.user_id,
                    "reaction_type": reaction_type,
                    "timestamp": reaction.timestamp,
                    "created_at": reaction.created_at.isoformat()
                })
            
            return {
                "reaction_counts": reaction_counts,
                "recent_reactions": recent_reactions[-20:],  # Last 20 reactions
                "total_reactions": len(reactions)
            }
            
        except Exception as e:
            logger.error(f"Error getting video reactions: {e}")
            return {"reaction_counts": {}, "recent_reactions": [], "total_reactions": 0}