from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_parent = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_videos = relationship("Video", back_populates="uploader")
    watch_history = relationship("WatchHistory", back_populates="user")
    comments = relationship("Comment", back_populates="user")

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
    filename = Column(String, nullable=True)  # Optional for YouTube videos
    file_path = Column(String, nullable=True)  # Optional for YouTube videos
    youtube_url = Column(String, nullable=True)  # YouTube video URL
    video_type = Column(String, default="local")  # "local" or "youtube"
    thumbnail_path = Column(String)
    duration = Column(Float)  # Duration in seconds
    file_size = Column(Integer)  # File size in bytes (null for YouTube)
    age_rating = Column(String, default="G")  # G, PG, PG-13 (adapted for kids)
    is_approved = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    category_id = Column(Integer, ForeignKey("categories.id"))
    uploader_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    category = relationship("Category", back_populates="videos")
    uploader = relationship("User", back_populates="uploaded_videos")
    watch_history = relationship("WatchHistory", back_populates="video")
    comments = relationship("Comment", back_populates="video")

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

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_approved = Column(Boolean, default=True)  # Auto-approve for now, can add moderation later
    
    # Foreign Keys
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # For replies
    
    # Relationships
    video = relationship("Video", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent")

class ContentReport(Base):
    __tablename__ = "content_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    # Relationships
    video = relationship("Video")
    reporter = relationship("User")