from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_parent: bool = False

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    age_rating: str = "G"

class VideoCreate(VideoBase):
    category_id: int

class YouTubeVideoCreate(VideoBase):
    category_id: int
    youtube_url: str

class VideoResponse(VideoBase):
    id: int
    video_type: str = "local"
    youtube_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    view_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    video_id: int
    parent_id: Optional[int] = None

class CommentResponse(CommentBase):
    id: int
    video_id: int
    user_id: int
    username: str  # We'll include username for display
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = []
    
    class Config:
        from_attributes = True

# Update forward reference
CommentResponse.model_rebuild()