import re
import requests
import logging
from typing import Optional, Dict
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats"""
    youtube_regex = re.compile(
        r'(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})'
    )
    
    match = youtube_regex.search(url)
    if match:
        return match.group(1)
    
    return None

def is_valid_youtube_url(url: str) -> bool:
    """Check if URL is a valid YouTube video URL"""
    return extract_youtube_video_id(url) is not None

def get_youtube_video_info(video_id: str) -> Optional[Dict]:
    """Get YouTube video information using oEmbed API (no API key required)"""
    try:
        # Use YouTube oEmbed API to get video info
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        
        response = requests.get(oembed_url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "title": data.get("title", ""),
            "thumbnail_url": data.get("thumbnail_url", ""),
            "duration": None,  # oEmbed doesn't provide duration
            "author_name": data.get("author_name", ""),
            "width": data.get("width", 0),
            "height": data.get("height", 0)
        }
        
    except Exception as e:
        logger.error(f"Error fetching YouTube video info for {video_id}: {e}")
        return None

def get_youtube_thumbnail_url(video_id: str, quality: str = "hqdefault") -> str:
    """Get YouTube thumbnail URL for a video ID"""
    # Available qualities: default, mqdefault, hqdefault, sddefault, maxresdefault
    return f"https://img.youtube.com/vi/{video_id}/{quality}.jpg"

def is_youtube_video_embeddable(video_id: str) -> bool:
    """Check if YouTube video can be embedded (basic check)"""
    try:
        # Try to access the oEmbed endpoint
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(oembed_url, timeout=10)
        return response.status_code == 200
    except:
        return False

def validate_youtube_video_for_kids(video_id: str) -> Dict[str, any]:
    """Basic validation for kid-friendly content (placeholder - would need more sophisticated checking)"""
    # This is a placeholder function. In a real implementation, you would:
    # 1. Use YouTube Data API to get video details including category
    # 2. Check for age restrictions
    # 3. Analyze title/description for inappropriate content
    # 4. Check if video is marked as "made for kids"
    
    try:
        video_info = get_youtube_video_info(video_id)
        if not video_info:
            return {"approved": False, "reason": "Could not fetch video information"}
        
        # Basic checks
        title = video_info.get("title", "").lower()
        
        # Simple keyword filtering (you would want a more sophisticated system)
        inappropriate_keywords = ["adult", "mature", "violence", "horror", "scary"]
        
        for keyword in inappropriate_keywords:
            if keyword in title:
                return {"approved": False, "reason": f"Contains inappropriate keyword: {keyword}"}
        
        return {"approved": True, "reason": "Basic validation passed"}
        
    except Exception as e:
        logger.error(f"Error validating YouTube video {video_id}: {e}")
        return {"approved": False, "reason": "Validation error"}