from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

# Enums for better type safety
class AgeGroup(enum.Enum):
    TODDLER = "3-6"      # 3-6 tuổi
    CHILD = "7-12"       # 7-12 tuổi  
    TEEN = "13-17"       # 13-17 tuổi

class ContentType(enum.Enum):
    EDUCATIONAL = "educational"
    ENTERTAINMENT = "entertainment"
    MUSIC = "music"
    SPORTS = "sports"
    ARTS_CRAFTS = "arts_crafts"

class ReportReason(enum.Enum):
    INAPPROPRIATE = "inappropriate"
    SCARY = "scary"
    BORING = "boring"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_parent = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    birth_date = Column(DateTime)  # For age calculation
    preferred_age_group = Column(Enum(AgeGroup))
    avatar_config = Column(JSON)  # Avatar customization data
    parental_settings = Column(JSON)  # Parental control settings
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_videos = relationship("Video", back_populates="uploader")
    watch_history = relationship("WatchHistory", back_populates="user")
    children = relationship("User", backref="parent", remote_side=[id])
    parent_id = Column(Integer, ForeignKey("users.id"))

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    color = Column(String, default="#3B82F6")  # Tailwind blue-500
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    videos = relationship("Video", back_populates="category")

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    thumbnail_path = Column(String)
    duration = Column(Float)  # Duration in seconds
    file_size = Column(Integer)  # File size in bytes
    age_rating = Column(String, default="G")  # G, PG, PG-13 (adapted for kids)
    target_age_group = Column(Enum(AgeGroup))
    content_type = Column(Enum(ContentType))
    is_approved = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    educational_tags = Column(JSON)  # Tags for educational content
    safety_score = Column(Float, default=100.0)  # Content safety score (0-100)
    moderation_flags = Column(JSON)  # AI moderation results
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    category_id = Column(Integer, ForeignKey("categories.id"))
    uploader_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    category = relationship("Category", back_populates="videos")
    uploader = relationship("User", back_populates="uploaded_videos")
    watch_history = relationship("WatchHistory", back_populates="video")
    quiz_questions = relationship("QuizQuestion", back_populates="video")
    bookmarks = relationship("Bookmark", back_populates="video")

class WatchHistory(Base):
    __tablename__ = "watch_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    watched_at = Column(DateTime, default=datetime.utcnow)
    watch_duration = Column(Float, default=0)  # How long they watched in seconds
    completed = Column(Boolean, default=False)  # Did they watch the whole video
    
    # Relationships
    user = relationship("User", back_populates="watch_history")
    video = relationship("Video", back_populates="watch_history")

class ContentReport(Base):
    __tablename__ = "content_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    priority = Column(String, default="medium")  # low, medium, high
    admin_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    # Relationships
    video = relationship("Video")
    reporter = relationship("User")

# New models for enhanced features

class ParentalControl(Base):
    __tablename__ = "parental_controls"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    child_id = Column(Integer, ForeignKey("users.id"))
    daily_time_limit = Column(Integer, default=120)  # minutes
    allowed_content_types = Column(JSON)  # List of allowed content types
    blocked_keywords = Column(JSON)  # List of blocked keywords
    allowed_time_slots = Column(JSON)  # Time slots when watching is allowed
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    parent = relationship("User", foreign_keys=[parent_id])
    child = relationship("User", foreign_keys=[child_id])

class WatchParty(Base):
    __tablename__ = "watch_parties"
    
    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, unique=True, nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    current_time = Column(Float, default=0)  # Current playback time
    is_playing = Column(Boolean, default=False)
    max_participants = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    host = relationship("User")
    video = relationship("Video")
    participants = relationship("WatchPartyParticipant", back_populates="party")

class WatchPartyParticipant(Base):
    __tablename__ = "watch_party_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    party_id = Column(Integer, ForeignKey("watch_parties.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    party = relationship("WatchParty", back_populates="participants")
    user = relationship("User")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    question = Column(Text, nullable=False)
    options = Column(JSON)  # List of answer options
    correct_answer = Column(Integer)  # Index of correct answer
    explanation = Column(Text)
    timestamp = Column(Float)  # When in video this question appears
    difficulty = Column(String, default="easy")  # easy, medium, hard
    
    # Relationships
    video = relationship("Video", back_populates="quiz_questions")

class QuizResult(Base):
    __tablename__ = "quiz_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("quiz_questions.id"))
    selected_answer = Column(Integer)
    is_correct = Column(Boolean)
    answered_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    question = relationship("QuizQuestion")

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    icon = Column(String)  # Icon URL or name
    badge_color = Column(String, default="#FFD700")
    requirement_type = Column(String)  # consecutive_days, videos_watched, quiz_score, etc.
    requirement_value = Column(Integer)
    points = Column(Integer, default=10)
    
class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    earned_at = Column(DateTime, default=datetime.utcnow)
    progress = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User")
    achievement = relationship("Achievement")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    timestamp = Column(Float, nullable=False)  # Bookmark position in video
    note = Column(Text)
    folder_name = Column(String, default="Default")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    video = relationship("Video", back_populates="bookmarks")

class VideoReaction(Base):
    __tablename__ = "video_reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    reaction_type = Column(String)  # emoji type: happy, love, wow, etc.
    timestamp = Column(Float)  # When in video the reaction was made
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    video = relationship("Video")

class SafeComment(Base):
    __tablename__ = "safe_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    content = Column(Text)  # Pre-approved comment or emoji
    is_emoji_only = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    moderation_score = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    video = relationship("Video")

class ContentModerationLog(Base):
    __tablename__ = "content_moderation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    ai_analysis = Column(JSON)  # AI analysis results
    manual_review = Column(JSON)  # Manual review notes
    final_decision = Column(String)  # approved, rejected, flagged
    moderator_id = Column(Integer, ForeignKey("users.id"))
    processed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    video = relationship("Video")
    moderator = relationship("User")