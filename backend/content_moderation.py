import cv2
import numpy as np
from pathlib import Path
import asyncio
import logging
from typing import Dict, List
import re

logger = logging.getLogger(__name__)

# Keywords that should be flagged for children's content
INAPPROPRIATE_KEYWORDS = [
    # Violence related
    "violence", "fight", "gun", "weapon", "blood", "kill", "death", "war",
    # Inappropriate content
    "adult", "mature", "scary", "horror", "nightmare", "monster",
    # Add more as needed
]

# Positive keywords for children's content
POSITIVE_KEYWORDS = [
    "educational", "learning", "kids", "children", "family", "fun", "cartoon",
    "animation", "story", "song", "music", "dance", "color", "number", "letter",
    "animal", "nature", "science", "art", "craft", "game", "puzzle"
]

async def moderate_content(file_path: Path, title: str, description: str) -> Dict[str, any]:
    """
    Moderate video content for children's safety
    This is a basic implementation - in production, you'd use more sophisticated AI models
    """
    try:
        moderation_result = {
            "approved": True,
            "reason": "",
            "score": 0,
            "flags": []
        }
        
        # Text-based moderation
        text_result = await moderate_text_content(title, description)
        moderation_result["score"] += text_result["score"]
        moderation_result["flags"].extend(text_result["flags"])
        
        # Basic video analysis (frame sampling)
        video_result = await analyze_video_frames(file_path)
        moderation_result["score"] += video_result["score"]
        moderation_result["flags"].extend(video_result["flags"])
        
        # Decision logic
        if moderation_result["score"] > 50:  # Threshold for rejection
            moderation_result["approved"] = False
            moderation_result["reason"] = "Content may not be suitable for children"
        
        # Auto-approve if positive signals are strong
        positive_score = text_result.get("positive_score", 0)
        if positive_score > 80:
            moderation_result["approved"] = True
            moderation_result["reason"] = "Content approved for children"
        
        return moderation_result
        
    except Exception as e:
        logger.error(f"Error in content moderation: {e}")
        # Default to manual review on error
        return {
            "approved": False,
            "reason": "Content requires manual review",
            "score": 100,
            "flags": ["moderation_error"]
        }

async def moderate_text_content(title: str, description: str) -> Dict[str, any]:
    """Analyze text content for appropriateness"""
    text = f"{title} {description}".lower()
    
    result = {
        "score": 0,
        "flags": [],
        "positive_score": 0
    }
    
    # Check for inappropriate keywords
    for keyword in INAPPROPRIATE_KEYWORDS:
        if keyword in text:
            result["score"] += 20
            result["flags"].append(f"inappropriate_keyword: {keyword}")
    
    # Check for positive keywords
    positive_matches = 0
    for keyword in POSITIVE_KEYWORDS:
        if keyword in text:
            positive_matches += 1
    
    result["positive_score"] = min(positive_matches * 10, 100)
    
    # Check text length and quality
    if len(title) < 5:
        result["score"] += 10
        result["flags"].append("title_too_short")
    
    if not description or len(description) < 20:
        result["score"] += 5
        result["flags"].append("insufficient_description")
    
    return result

async def analyze_video_frames(file_path: Path, sample_count: int = 5) -> Dict[str, any]:
    """Basic video frame analysis for inappropriate content"""
    try:
        result = {
            "score": 0,
            "flags": []
        }
        
        # Open video file
        cap = cv2.VideoCapture(str(file_path))
        if not cap.isOpened():
            result["score"] += 30
            result["flags"].append("video_unreadable")
            return result
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Sample frames throughout the video
        frame_indices = np.linspace(0, total_frames - 1, sample_count, dtype=int)
        
        dark_frames = 0
        bright_frames = 0
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if not ret:
                continue
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Check brightness levels
            mean_brightness = np.mean(gray)
            
            if mean_brightness < 50:  # Very dark
                dark_frames += 1
            elif mean_brightness > 200:  # Very bright
                bright_frames += 1
            
            # Basic edge detection to check for violent/chaotic content
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges) / (edges.shape[0] * edges.shape[1])
            
            if edge_density > 0.1:  # High edge density might indicate chaotic content
                result["score"] += 5
        
        cap.release()
        
        # Analyze results
        if dark_frames > sample_count * 0.6:  # More than 60% dark frames
            result["score"] += 15
            result["flags"].append("predominantly_dark_content")
        
        if bright_frames > sample_count * 0.8:  # More than 80% bright frames
            result["flags"].append("bright_colorful_content")  # Positive signal
            result["score"] -= 5  # Reduce negative score
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing video frames: {e}")
        return {
            "score": 20,
            "flags": ["video_analysis_error"]
        }

async def create_content_safety_report(video_id: int, moderation_result: Dict) -> None:
    """Create a detailed safety report for the video"""
    # This would typically be saved to database or external service
    logger.info(f"Content safety report for video {video_id}: {moderation_result}")

def is_child_safe_content(title: str, description: str) -> bool:
    """Quick check if content appears to be child-safe based on text"""
    text = f"{title} {description}".lower()
    
    # Check for obvious child-friendly indicators
    child_indicators = ["kids", "children", "educational", "cartoon", "animation", "learning"]
    has_child_indicator = any(indicator in text for indicator in child_indicators)
    
    # Check for inappropriate content
    has_inappropriate = any(keyword in text for keyword in INAPPROPRIATE_KEYWORDS)
    
    return has_child_indicator and not has_inappropriate