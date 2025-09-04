from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import os
import aiofiles
from pathlib import Path
import mimetypes
from typing import List, Optional
import logging

from database import get_db, engine
from models import Base, Video, User, Category
from schemas import VideoResponse, VideoCreate, UserCreate, UserResponse
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from video_processing import process_video, generate_thumbnail
from content_moderation import moderate_content

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KidsStream API",
    description="Safe video streaming platform for children",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create upload directories
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
THUMBNAILS_DIR = Path("thumbnails")

for directory in [UPLOAD_DIR, PROCESSED_DIR, THUMBNAILS_DIR]:
    directory.mkdir(exist_ok=True)

security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "Welcome to KidsStream - Safe Video Platform for Children"}

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_parent=user.is_parent
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        is_parent=db_user.is_parent
    )

@app.post("/auth/login")
async def login(email: str = Form(), password: str = Form(), db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/videos/upload", response_model=VideoResponse)
async def upload_video(
    title: str = Form(),
    description: str = Form(),
    category_id: int = Form(),
    age_rating: str = Form(default="G"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a new video"""
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can upload content")
    
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save uploaded file
    file_path = UPLOAD_DIR / f"{file.filename}"
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    try:
        # Content moderation check
        moderation_result = await moderate_content(file_path, title, description)
        if not moderation_result["approved"]:
            os.remove(file_path)
            raise HTTPException(
                status_code=400, 
                detail=f"Content rejected: {moderation_result['reason']}"
            )
        
        # Process video (convert to multiple qualities)
        processed_files = await process_video(file_path)
        
        # Generate thumbnail
        thumbnail_path = await generate_thumbnail(file_path)
        
        # Create database entry
        video = Video(
            title=title,
            description=description,
            filename=file.filename,
            file_path=str(processed_files["720p"]),
            thumbnail_path=str(thumbnail_path),
            category_id=category_id,
            age_rating=age_rating,
            uploader_id=current_user.id,
            duration=processed_files["duration"],
            file_size=os.path.getsize(processed_files["720p"])
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Clean up original file
        os.remove(file_path)
        
        return VideoResponse(
            id=video.id,
            title=video.title,
            description=video.description,
            thumbnail_url=f"/thumbnails/{video.id}",
            duration=video.duration,
            age_rating=video.age_rating,
            created_at=video.created_at
        )
        
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            os.remove(file_path)
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing video")

@app.get("/videos", response_model=List[VideoResponse])
async def get_videos(
    category_id: Optional[int] = None,
    age_rating: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get list of approved videos with filtering"""
    query = db.query(Video).filter(Video.is_approved == True)
    
    if category_id:
        query = query.filter(Video.category_id == category_id)
    
    if age_rating:
        query = query.filter(Video.age_rating == age_rating)
    
    videos = query.offset(skip).limit(limit).all()
    
    return [
        VideoResponse(
            id=video.id,
            title=video.title,
            description=video.description,
            thumbnail_url=f"/thumbnails/{video.id}",
            duration=video.duration,
            age_rating=video.age_rating,
            created_at=video.created_at
        )
        for video in videos
    ]

@app.get("/videos/{video_id}/stream")
async def stream_video(video_id: int, db: Session = Depends(get_db)):
    """Stream video with range support for large files"""
    video = db.query(Video).filter(Video.id == video_id, Video.is_approved == True).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    file_path = Path(video.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    def iterfile(file_path: Path, chunk_size: int = 8192):
        with open(file_path, "rb") as file:
            while chunk := file.read(chunk_size):
                yield chunk
    
    file_size = file_path.stat().st_size
    content_type = mimetypes.guess_type(str(file_path))[0] or "video/mp4"
    
    return StreamingResponse(
        iterfile(file_path),
        media_type=content_type,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Content-Disposition": f"inline; filename={video.filename}"
        }
    )

@app.get("/thumbnails/{video_id}")
async def get_thumbnail(video_id: int, db: Session = Depends(get_db)):
    """Get video thumbnail"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or not video.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
    thumbnail_path = Path(video.thumbnail_path)
    if not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file not found")
    
    return FileResponse(thumbnail_path)

@app.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all video categories"""
    categories = db.query(Category).all()
    return [{"id": cat.id, "name": cat.name, "description": cat.description} for cat in categories]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)