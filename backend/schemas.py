from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

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

class VideoResponse(VideoBase):
    id: int
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