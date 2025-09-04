"""
Enhanced KidsStream API with Advanced Features
Comprehensive API integrating all safety, interactive, and personalization features
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn
import os
import aiofiles
from pathlib import Path
import mimetypes
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

# Import existing modules
from database import get_db, engine
from models import Base, Video, User, Category, AgeGroup, ContentType, ReportReason
from schemas import VideoResponse, VideoCreate, UserCreate, UserResponse
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from video_processing import process_video, generate_thumbnail

# Import new enhanced modules
from enhanced_content_moderation import EnhancedContentModerator
from parental_controls import ParentalControlManager, get_parental_dashboard_data
from interactive_features import WatchPartyManager, QuizManager, MiniGamesManager, BookmarkManager, ReactionManager
from safe_commenting import SafeCommentingSystem, ContentReportingSystem
from personalization import AIRecommendationEngine, AvatarCustomizationSystem, LearningPathSystem
from advanced_features import OfflineDownloadManager, VoiceSearchSystem, AdaptiveStreamingManager, PictureInPictureManager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KidsStream Enhanced API",
    description="Comprehensive safe video streaming platform for children with advanced features",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create directories
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
THUMBNAILS_DIR = Path("thumbnails")

for directory in [UPLOAD_DIR, PROCESSED_DIR, THUMBNAILS_DIR]:
    directory.mkdir(exist_ok=True)

# Initialize managers
content_moderator = EnhancedContentModerator()
parental_manager = ParentalControlManager()
watch_party_manager = WatchPartyManager()
quiz_manager = QuizManager()
games_manager = MiniGamesManager()
bookmark_manager = BookmarkManager()
reaction_manager = ReactionManager()
commenting_system = SafeCommentingSystem()
reporting_system = ContentReportingSystem()
recommendation_engine = AIRecommendationEngine()
avatar_system = AvatarCustomizationSystem()
learning_system = LearningPathSystem()
download_manager = OfflineDownloadManager()
voice_search = VoiceSearchSystem()
streaming_manager = AdaptiveStreamingManager()
pip_manager = PictureInPictureManager()

security = HTTPBearer()

# Pydantic models for request/response
class WatchPartyCreate(BaseModel):
    video_id: int
    max_participants: int = 10

class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: int

class CommentCreate(BaseModel):
    video_id: int
    content: str
    comment_type: str = "text"

class ContentReportCreate(BaseModel):
    video_id: int
    reason: str
    description: str = ""

class AvatarUpdate(BaseModel):
    avatar_config: Dict[str, Any]

class DownloadRequest(BaseModel):
    video_id: int
    quality: str = "medium"

# === BASIC API ENDPOINTS ===

@app.get("/")
async def root():
    return {
        "message": "Welcome to KidsStream Enhanced - Advanced Safe Video Platform for Children",
        "version": "2.0.0",
        "features": [
            "AI Content Moderation",
            "Parental Controls",
            "Interactive Watch Parties",
            "Educational Quizzes",
            "Safe Commenting",
            "Personalized Recommendations",
            "Avatar Customization",
            "Offline Downloads",
            "Voice Search"
        ]
    }

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with enhanced features"""
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_parent=user.is_parent,
        avatar_config=avatar_system.get_default_avatar(),
        parental_settings={} if user.is_parent else None
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
    """Enhanced login with user profile data"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    
    # Get user profile data
    user_profile = {
        "id": user.id,
        "username": user.username,
        "is_parent": user.is_parent,
        "age_group": user.preferred_age_group.value if user.preferred_age_group else None,
        "avatar_config": user.avatar_config
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_profile": user_profile
    }

# === ENHANCED VIDEO ENDPOINTS ===

@app.post("/videos/upload", response_model=VideoResponse)
async def upload_video(
    title: str = Form(),
    description: str = Form(),
    category_id: int = Form(),
    age_rating: str = Form(default="G"),
    target_age_group: str = Form(default="7-12"),
    content_type: str = Form(default="entertainment"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced video upload with AI content moderation"""
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can upload content")
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    file_path = UPLOAD_DIR / f"{file.filename}"
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    try:
        # Enhanced AI content moderation
        moderation_result = await content_moderator.comprehensive_content_analysis(
            file_path, title, description, target_age_group
        )
        
        if not moderation_result["approved"]:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Content rejected by AI moderation",
                    "reason": moderation_result.get("reason", "Content not suitable for children"),
                    "recommendations": moderation_result.get("recommendations", [])
                }
            )
        
        # Process video
        processed_files = await process_video(file_path)
        thumbnail_path = await generate_thumbnail(file_path)
        
        # Create enhanced video entry
        video = Video(
            title=title,
            description=description,
            filename=file.filename,
            file_path=str(processed_files["720p"]),
            thumbnail_path=str(thumbnail_path),
            category_id=category_id,
            age_rating=age_rating,
            target_age_group=AgeGroup(target_age_group),
            content_type=ContentType(content_type),
            uploader_id=current_user.id,
            duration=processed_files["duration"],
            file_size=os.path.getsize(processed_files["720p"]),
            safety_score=moderation_result["safety_score"],
            moderation_flags=moderation_result["flags"],
            educational_tags=moderation_result.get("content_tags", [])
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
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
        if file_path.exists():
            os.remove(file_path)
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing video")

@app.get("/videos/recommendations")
async def get_personalized_recommendations(
    limit: int = 20,
    recommendation_type: str = "mixed",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered personalized video recommendations"""
    recommendations = await recommendation_engine.get_personalized_recommendations(
        db, current_user.id, limit, recommendation_type
    )
    
    return {
        "recommendations": recommendations,
        "user_age_group": current_user.preferred_age_group.value if current_user.preferred_age_group else None,
        "recommendation_type": recommendation_type
    }

@app.get("/videos/{video_id}/permission")
async def check_video_permission(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has permission to watch video (parental controls)"""
    if current_user.is_parent:
        return {"allowed": True, "reason": "Parent account"}
    
    permission = await parental_manager.check_viewing_permission(
        db, current_user.id, video_id
    )
    
    return permission

# === PARENTAL CONTROL ENDPOINTS ===

@app.get("/parental/dashboard")
async def get_parental_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive parental dashboard data"""
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can access dashboard")
    
    dashboard_data = await get_parental_dashboard_data(db, current_user.id)
    return dashboard_data

@app.post("/parental/controls")
async def create_parental_controls(
    child_id: int,
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update parental control settings"""
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can set controls")
    
    control = await parental_manager.create_parental_control(
        db, current_user.id, child_id, settings
    )
    
    return {"success": True, "control_id": control.id}

@app.get("/parental/reports/{child_id}")
async def get_child_viewing_report(
    child_id: int,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed viewing report for child"""
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can view reports")
    
    report = await parental_manager.get_child_viewing_report(db, child_id, days)
    return report

# === INTERACTIVE FEATURES ENDPOINTS ===

@app.post("/watch-party/create")
async def create_watch_party(
    party_data: WatchPartyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new watch party"""
    result = await watch_party_manager.create_watch_party(
        db, current_user.id, party_data.video_id, party_data.max_participants
    )
    return result

@app.post("/watch-party/{room_code}/join")
async def join_watch_party(
    room_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an existing watch party"""
    result = await watch_party_manager.join_watch_party(db, room_code, current_user.id)
    return result

@app.post("/watch-party/{room_code}/sync")
async def sync_watch_party(
    room_code: str,
    action: str,
    data: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync watch party state (play, pause, seek, reaction)"""
    result = await watch_party_manager.sync_party_state(
        db, room_code, current_user.id, action, data
    )
    return result

@app.get("/videos/{video_id}/quiz")
async def get_video_quiz(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz questions for video"""
    user_age_group = current_user.preferred_age_group.value if current_user.preferred_age_group else None
    questions = await quiz_manager.get_video_quiz_questions(db, video_id, user_age_group)
    return {"questions": questions}

@app.post("/quiz/submit")
async def submit_quiz_answer(
    answer_data: QuizAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit quiz answer"""
    result = await quiz_manager.submit_quiz_answer(
        db, current_user.id, answer_data.question_id, answer_data.selected_answer
    )
    return result

@app.get("/quiz/stats")
async def get_quiz_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's quiz performance statistics"""
    stats = await quiz_manager.get_user_quiz_stats(db, current_user.id, days)
    return stats

@app.post("/games/memory/{video_id}")
async def create_memory_game(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create memory matching game from video"""
    game = await games_manager.create_memory_game(db, video_id)
    return game

@app.post("/games/coloring/{video_id}")
async def create_coloring_game(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create coloring page from video"""
    game = await games_manager.create_coloring_page(db, video_id)
    return game

# === SAFE COMMENTING ENDPOINTS ===

@app.post("/comments")
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a safe comment with AI moderation"""
    result = await commenting_system.create_safe_comment(
        db, current_user.id, comment_data.video_id, 
        comment_data.content, comment_data.comment_type
    )
    return result

@app.get("/videos/{video_id}/comments")
async def get_video_comments(
    video_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get approved comments for video"""
    comments = await commenting_system.get_video_comments(db, video_id, limit, offset)
    return {"comments": comments}

@app.get("/comments/quick-responses")
async def get_quick_responses():
    """Get pre-approved quick response options"""
    return {
        "quick_responses": commenting_system.quick_responses,
        "approved_emojis": list(commenting_system.approved_emojis.keys())
    }

# === CONTENT REPORTING ENDPOINTS ===

@app.post("/reports")
async def create_content_report(
    report_data: ContentReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Report inappropriate content"""
    result = await reporting_system.create_content_report(
        db, current_user.id, report_data.video_id,
        ReportReason(report_data.reason), report_data.description
    )
    return result

@app.get("/reports/options")
async def get_report_options():
    """Get child-friendly reporting options"""
    options = await reporting_system.get_child_friendly_report_options()
    return {"report_options": options}

# === PERSONALIZATION ENDPOINTS ===

@app.get("/avatar")
async def get_avatar_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's avatar configuration"""
    config = await avatar_system.get_avatar_config(db, current_user.id)
    return {"avatar_config": config}

@app.post("/avatar")
async def update_avatar(
    avatar_data: AvatarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's avatar configuration"""
    result = await avatar_system.update_avatar(
        db, current_user.id, avatar_data.avatar_config
    )
    return result

@app.get("/avatar/options")
async def get_avatar_options(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available avatar customization options"""
    options = await avatar_system.get_avatar_customization_options(db, current_user.id)
    return options

@app.get("/learning/path/{subject}")
async def get_learning_path(
    subject: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized learning path for subject"""
    path = await learning_system.generate_learning_path(db, current_user.id, subject)
    return {"learning_path": path, "subject": subject}

# === ADVANCED FEATURES ENDPOINTS ===

@app.post("/downloads/request")
async def request_download(
    download_data: DownloadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request video download for offline viewing"""
    result = await download_manager.request_download(
        db, current_user.id, download_data.video_id, download_data.quality
    )
    return result

@app.get("/downloads")
async def get_user_downloads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's download history"""
    downloads = await download_manager.get_user_downloads(current_user.id)
    return {"downloads": downloads}

@app.delete("/downloads/{download_id}")
async def delete_download(
    download_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a downloaded video"""
    success = await download_manager.delete_download(current_user.id, download_id)
    return {"success": success}

@app.post("/search/voice")
async def voice_search(
    audio_data: bytes,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process voice search query"""
    result = await voice_search.process_voice_search(db, audio_data, current_user.id)
    return result

@app.get("/search/voice/help")
async def get_voice_help():
    """Get voice command help"""
    help_data = await voice_search.get_voice_command_help()
    return help_data

@app.get("/streaming/quality")
async def get_optimal_quality(
    network_speed: float,
    device_capabilities: Dict[str, Any] = {},
    user_preferences: Dict[str, Any] = {}
):
    """Get optimal streaming quality based on network and device"""
    quality_config = await streaming_manager.get_optimal_quality(
        network_speed, device_capabilities, user_preferences
    )
    return quality_config

@app.post("/pip/enable/{video_id}")
async def enable_picture_in_picture(
    video_id: int,
    user_preferences: Dict[str, Any] = {}
):
    """Enable picture-in-picture mode"""
    pip_config = await pip_manager.enable_pip_mode(video_id, user_preferences)
    return pip_config

# === REACTION AND BOOKMARK ENDPOINTS ===

@app.post("/videos/{video_id}/reaction")
async def add_video_reaction(
    video_id: int,
    reaction_type: str,
    timestamp: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add emoji reaction to video"""
    result = await reaction_manager.add_reaction(
        db, current_user.id, video_id, reaction_type, timestamp
    )
    return result

@app.get("/videos/{video_id}/reactions")
async def get_video_reactions(
    video_id: int,
    time_window: float = 60.0,
    db: Session = Depends(get_db)
):
    """Get recent reactions for video"""
    reactions = await reaction_manager.get_video_reactions(db, video_id, time_window)
    return reactions

@app.post("/bookmarks")
async def create_bookmark(
    video_id: int,
    timestamp: float,
    note: str = "",
    folder_name: str = "Default",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create bookmark for video timestamp"""
    result = await bookmark_manager.create_bookmark(
        db, current_user.id, video_id, timestamp, note, folder_name
    )
    return result

@app.get("/bookmarks")
async def get_user_bookmarks(
    folder_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's bookmarks"""
    bookmarks = await bookmark_manager.get_user_bookmarks(db, current_user.id, folder_name)
    return {"bookmarks": bookmarks}

# === EXISTING ENDPOINTS (Enhanced) ===

@app.get("/videos", response_model=List[VideoResponse])
async def get_videos(
    category_id: Optional[int] = None,
    age_rating: Optional[str] = None,
    age_group: Optional[str] = None,
    content_type: Optional[str] = None,
    min_safety_score: float = 70.0,
    skip: int = 0,
    limit: int = 20,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced video listing with advanced filtering"""
    query = db.query(Video).filter(
        Video.is_approved == True,
        Video.safety_score >= min_safety_score
    )
    
    if category_id:
        query = query.filter(Video.category_id == category_id)
    
    if age_rating:
        query = query.filter(Video.age_rating == age_rating)
    
    if age_group:
        query = query.filter(Video.target_age_group == AgeGroup(age_group))
    
    if content_type:
        query = query.filter(Video.content_type == ContentType(content_type))
    
    # Apply parental controls if user is a child
    if current_user and not current_user.is_parent:
        # Additional filtering based on parental controls would go here
        pass
    
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
async def stream_video(
    video_id: int, 
    quality: str = "720p",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced video streaming with quality selection and parental controls"""
    # Check viewing permission for children
    if not current_user.is_parent:
        permission = await parental_manager.check_viewing_permission(
            db, current_user.id, video_id
        )
        if not permission["allowed"]:
            raise HTTPException(status_code=403, detail=permission["reason"])
    
    video = db.query(Video).filter(Video.id == video_id, Video.is_approved == True).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    file_path = Path(video.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    # Log watch history
    # This would be implemented with proper watch tracking
    
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
    """Get all video categories with enhanced data"""
    categories = db.query(Category).all()
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "color": cat.color,
            "video_count": len(cat.videos)
        }
        for cat in categories
    ]

# === HEALTH CHECK AND SYSTEM INFO ===

@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "features_active": {
            "content_moderation": True,
            "parental_controls": True,
            "interactive_features": True,
            "personalization": True,
            "advanced_features": True
        }
    }

@app.get("/system/info")
async def get_system_info():
    """Get system information and feature availability"""
    return {
        "api_version": "2.0.0",
        "features": {
            "ai_content_moderation": "Enhanced AI analysis with real-time processing",
            "parental_controls": "Comprehensive time limits, content filtering, and monitoring",
            "watch_parties": "Real-time synchronized viewing with up to 10 participants",
            "educational_quizzes": "Interactive learning with progress tracking",
            "safe_commenting": "AI-moderated comments with emoji-only mode",
            "content_reporting": "Child-friendly reporting system with 24h response",
            "personalization": "AI-powered recommendations and avatar customization",
            "offline_downloads": "High-quality downloads with 7-day expiration",
            "voice_search": "Natural language voice commands and search",
            "adaptive_streaming": "Network-aware quality adjustment"
        },
        "safety_measures": {
            "content_safety_score": "Minimum 70/100 for all content",
            "ai_moderation": "Real-time analysis of video, audio, and text",
            "parental_oversight": "Complete control and monitoring for parents",
            "coppa_compliant": "Full compliance with children's privacy laws"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)