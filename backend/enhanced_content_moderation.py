"""
Enhanced Content Moderation System with AI
Comprehensive content safety analysis for children's video platform
"""

import cv2
import numpy as np
from pathlib import Path
import asyncio
import logging
from typing import Dict, List, Optional, Tuple
import re
import json
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

# Enhanced keyword lists for better content filtering
INAPPROPRIATE_KEYWORDS = {
    'violence': ['violence', 'fight', 'gun', 'weapon', 'blood', 'kill', 'death', 'war', 'battle', 'attack', 'hurt', 'pain'],
    'scary': ['horror', 'scary', 'nightmare', 'monster', 'ghost', 'demon', 'evil', 'dark', 'creepy', 'frightening'],
    'mature': ['adult', 'mature', 'grown-up only', 'not for kids', 'parental guidance'],
    'negative': ['hate', 'stupid', 'dumb', 'ugly', 'bad', 'worst', 'terrible', 'awful']
}

POSITIVE_KEYWORDS = {
    'educational': ['learn', 'education', 'teach', 'school', 'study', 'knowledge', 'discover', 'explore'],
    'creative': ['art', 'craft', 'draw', 'paint', 'create', 'make', 'build', 'design'],
    'music': ['music', 'song', 'sing', 'dance', 'rhythm', 'melody', 'instrument'],
    'nature': ['animal', 'nature', 'forest', 'ocean', 'flower', 'tree', 'bird', 'fish'],
    'family': ['family', 'parent', 'mom', 'dad', 'brother', 'sister', 'friend', 'together'],
    'positive': ['happy', 'joy', 'fun', 'smile', 'laugh', 'love', 'kind', 'nice', 'good', 'amazing']
}

# Age-appropriate content indicators
AGE_INDICATORS = {
    '3-6': ['toddler', 'preschool', 'nursery', 'simple', 'basic', 'easy'],
    '7-12': ['elementary', 'school', 'grade', 'homework', 'learn', 'discover'],
    '13-17': ['teen', 'teenager', 'advanced', 'complex', 'challenge']
}

class EnhancedContentModerator:
    def __init__(self):
        self.safety_threshold = 70  # Minimum safety score for approval
        self.confidence_threshold = 0.8
        
    async def comprehensive_content_analysis(
        self, 
        file_path: Path, 
        title: str, 
        description: str,
        target_age_group: str = None
    ) -> Dict[str, any]:
        """
        Comprehensive content analysis using multiple AI techniques
        """
        try:
            analysis_result = {
                "safety_score": 100.0,
                "approved": True,
                "confidence": 0.0,
                "flags": [],
                "recommendations": [],
                "age_appropriateness": {},
                "content_tags": [],
                "moderation_details": {}
            }
            
            # Text Analysis
            text_analysis = await self.analyze_text_content(title, description, target_age_group)
            analysis_result["safety_score"] -= text_analysis["penalty"]
            analysis_result["flags"].extend(text_analysis["flags"])
            analysis_result["content_tags"].extend(text_analysis["tags"])
            analysis_result["moderation_details"]["text"] = text_analysis
            
            # Advanced Video Analysis
            video_analysis = await self.analyze_video_content(file_path)
            analysis_result["safety_score"] -= video_analysis["penalty"]
            analysis_result["flags"].extend(video_analysis["flags"])
            analysis_result["moderation_details"]["video"] = video_analysis
            
            # Audio Analysis (if available)
            audio_analysis = await self.analyze_audio_content(file_path)
            analysis_result["safety_score"] -= audio_analysis["penalty"]
            analysis_result["flags"].extend(audio_analysis["flags"])
            analysis_result["moderation_details"]["audio"] = audio_analysis
            
            # Age Appropriateness Check
            age_analysis = await self.check_age_appropriateness(title, description, target_age_group)
            analysis_result["age_appropriateness"] = age_analysis
            
            # Final Decision
            analysis_result["confidence"] = min(
                text_analysis.get("confidence", 0.5),
                video_analysis.get("confidence", 0.5),
                audio_analysis.get("confidence", 0.5)
            )
            
            analysis_result["approved"] = (
                analysis_result["safety_score"] >= self.safety_threshold and
                analysis_result["confidence"] >= self.confidence_threshold
            )
            
            # Generate recommendations
            analysis_result["recommendations"] = self.generate_recommendations(analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in comprehensive content analysis: {e}")
            return {
                "safety_score": 0.0,
                "approved": False,
                "confidence": 0.0,
                "flags": ["analysis_error"],
                "recommendations": ["Manual review required"],
                "age_appropriateness": {},
                "content_tags": [],
                "moderation_details": {"error": str(e)}
            }
    
    async def analyze_text_content(self, title: str, description: str, target_age_group: str = None) -> Dict:
        """Enhanced text analysis with NLP techniques"""
        text = f"{title} {description}".lower()
        
        result = {
            "penalty": 0,
            "flags": [],
            "tags": [],
            "confidence": 0.8,
            "sentiment": "neutral",
            "complexity_score": 0
        }
        
        # Keyword Analysis
        inappropriate_count = 0
        positive_count = 0
        
        for category, keywords in INAPPROPRIATE_KEYWORDS.items():
            matches = [kw for kw in keywords if kw in text]
            if matches:
                result["penalty"] += len(matches) * 15
                result["flags"].append(f"inappropriate_{category}: {', '.join(matches)}")
                inappropriate_count += len(matches)
        
        for category, keywords in POSITIVE_KEYWORDS.items():
            matches = [kw for kw in keywords if kw in text]
            if matches:
                result["penalty"] -= len(matches) * 2  # Positive bonus
                result["tags"].append(category)
                positive_count += len(matches)
        
        # Sentiment Analysis (simple implementation)
        if positive_count > inappropriate_count * 2:
            result["sentiment"] = "positive"
        elif inappropriate_count > positive_count:
            result["sentiment"] = "negative"
            result["penalty"] += 10
        
        # Text Quality Checks
        if len(title) < 5:
            result["penalty"] += 15
            result["flags"].append("title_too_short")
        
        if not description or len(description) < 20:
            result["penalty"] += 10
            result["flags"].append("insufficient_description")
        
        # Language Complexity Check
        result["complexity_score"] = self.calculate_text_complexity(text)
        if target_age_group and not self.is_age_appropriate_text(text, target_age_group):
            result["penalty"] += 20
            result["flags"].append("age_inappropriate_language")
        
        return result
    
    async def analyze_video_content(self, file_path: Path) -> Dict:
        """Advanced video content analysis"""
        result = {
            "penalty": 0,
            "flags": [],
            "confidence": 0.7,
            "visual_features": {},
            "scene_analysis": []
        }
        
        try:
            cap = cv2.VideoCapture(str(file_path))
            if not cap.isOpened():
                result["penalty"] += 50
                result["flags"].append("video_unreadable")
                result["confidence"] = 0.0
                return result
            
            # Video Properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            # Sample frames for analysis
            sample_count = min(20, max(5, int(duration / 10)))  # Sample every 10 seconds
            frame_indices = np.linspace(0, total_frames - 1, sample_count, dtype=int)
            
            brightness_values = []
            motion_values = []
            color_distributions = []
            
            prev_frame = None
            
            for i, frame_idx in enumerate(frame_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                
                if not ret:
                    continue
                
                # Brightness analysis
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                brightness = np.mean(gray)
                brightness_values.append(brightness)
                
                # Color analysis
                color_hist = cv2.calcHist([frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                color_distributions.append(color_hist.flatten())
                
                # Motion detection
                if prev_frame is not None:
                    diff = cv2.absdiff(prev_frame, gray)
                    motion = np.mean(diff)
                    motion_values.append(motion)
                
                prev_frame = gray.copy()
                
                # Scene-specific analysis
                scene_analysis = self.analyze_frame_content(frame)
                result["scene_analysis"].append(scene_analysis)
            
            cap.release()
            
            # Analyze collected data
            avg_brightness = np.mean(brightness_values) if brightness_values else 128
            avg_motion = np.mean(motion_values) if motion_values else 0
            
            result["visual_features"] = {
                "avg_brightness": avg_brightness,
                "avg_motion": avg_motion,
                "duration": duration,
                "fps": fps
            }
            
            # Apply rules
            if avg_brightness < 30:  # Very dark content
                result["penalty"] += 25
                result["flags"].append("very_dark_content")
            elif avg_brightness > 200:  # Very bright, likely colorful
                result["penalty"] -= 5  # Bonus for bright content
            
            if avg_motion > 50:  # High motion might indicate action/violence
                result["penalty"] += 15
                result["flags"].append("high_motion_content")
            
            # Duration check
            if duration > 3600:  # Over 1 hour
                result["penalty"] += 10
                result["flags"].append("very_long_content")
            elif duration < 30:  # Under 30 seconds
                result["penalty"] += 5
                result["flags"].append("very_short_content")
            
        except Exception as e:
            logger.error(f"Error in video analysis: {e}")
            result["penalty"] += 30
            result["flags"].append("video_analysis_error")
            result["confidence"] = 0.3
        
        return result
    
    async def analyze_audio_content(self, file_path: Path) -> Dict:
        """Basic audio analysis (placeholder for more advanced audio AI)"""
        result = {
            "penalty": 0,
            "flags": [],
            "confidence": 0.6,
            "audio_features": {}
        }
        
        # This is a placeholder - in production, you'd use libraries like:
        # - librosa for audio feature extraction
        # - speech_recognition for speech-to-text
        # - Audio classification models for sound detection
        
        try:
            # Basic audio file validation
            import subprocess
            cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', str(file_path)]
            proc = subprocess.run(cmd, capture_output=True, text=True)
            
            if proc.returncode == 0:
                audio_info = json.loads(proc.stdout)
                duration = float(audio_info.get('format', {}).get('duration', 0))
                
                result["audio_features"]["duration"] = duration
                
                # Basic checks
                if duration == 0:
                    result["penalty"] += 20
                    result["flags"].append("no_audio_detected")
            else:
                result["penalty"] += 10
                result["flags"].append("audio_analysis_failed")
                
        except Exception as e:
            logger.error(f"Error in audio analysis: {e}")
            result["penalty"] += 5
            result["flags"].append("audio_check_error")
        
        return result
    
    def analyze_frame_content(self, frame) -> Dict:
        """Analyze individual frame for specific content"""
        analysis = {
            "has_faces": False,
            "color_dominant": "unknown",
            "edge_density": 0,
            "objects_detected": []
        }
        
        # Face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        analysis["has_faces"] = len(faces) > 0
        
        # Dominant color
        colors = frame.reshape(-1, 3)
        dominant_color = np.mean(colors, axis=0)
        analysis["color_dominant"] = self.classify_color(dominant_color)
        
        # Edge density
        edges = cv2.Canny(gray, 50, 150)
        analysis["edge_density"] = np.sum(edges) / (edges.shape[0] * edges.shape[1])
        
        return analysis
    
    def classify_color(self, color_bgr) -> str:
        """Classify dominant color"""
        b, g, r = color_bgr
        
        if r > 150 and g < 100 and b < 100:
            return "red"
        elif g > 150 and r < 100 and b < 100:
            return "green"
        elif b > 150 and r < 100 and g < 100:
            return "blue"
        elif r > 200 and g > 200 and b > 200:
            return "white"
        elif r < 50 and g < 50 and b < 50:
            return "black"
        elif r > 150 and g > 150 and b < 100:
            return "yellow"
        else:
            return "mixed"
    
    async def check_age_appropriateness(self, title: str, description: str, target_age_group: str) -> Dict:
        """Check if content is appropriate for target age group"""
        text = f"{title} {description}".lower()
        
        result = {
            "target_age": target_age_group,
            "recommended_ages": [],
            "appropriateness_score": 50,
            "concerns": []
        }
        
        if not target_age_group:
            return result
        
        # Check for age-specific indicators
        for age_range, indicators in AGE_INDICATORS.items():
            matches = sum(1 for indicator in indicators if indicator in text)
            if matches > 0:
                result["recommended_ages"].append(age_range)
                if age_range == target_age_group:
                    result["appropriateness_score"] += matches * 10
        
        # Complexity analysis
        complexity = self.calculate_text_complexity(text)
        
        if target_age_group == "3-6" and complexity > 5:
            result["concerns"].append("language_too_complex_for_toddlers")
            result["appropriateness_score"] -= 20
        elif target_age_group == "7-12" and complexity > 8:
            result["concerns"].append("language_too_complex_for_children")
            result["appropriateness_score"] -= 15
        
        return result
    
    def calculate_text_complexity(self, text: str) -> int:
        """Simple text complexity calculation"""
        words = text.split()
        if not words:
            return 0
        
        # Average word length
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Sentence count (rough estimate)
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        sentence_count = max(1, sentence_count)
        
        # Words per sentence
        words_per_sentence = len(words) / sentence_count
        
        # Simple complexity score
        complexity = (avg_word_length * 0.5) + (words_per_sentence * 0.3)
        
        return int(complexity)
    
    def is_age_appropriate_text(self, text: str, target_age_group: str) -> bool:
        """Check if text language is appropriate for age group"""
        complexity = self.calculate_text_complexity(text)
        
        age_complexity_limits = {
            "3-6": 4,
            "7-12": 7,
            "13-17": 12
        }
        
        return complexity <= age_complexity_limits.get(target_age_group, 10)
    
    def generate_recommendations(self, analysis_result: Dict) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if analysis_result["safety_score"] < 50:
            recommendations.append("Content requires significant review before approval")
        elif analysis_result["safety_score"] < 70:
            recommendations.append("Content needs minor modifications for approval")
        
        if analysis_result["confidence"] < 0.6:
            recommendations.append("Manual review recommended due to low confidence")
        
        if "inappropriate_violence" in str(analysis_result["flags"]):
            recommendations.append("Remove or reduce violent content")
        
        if "very_dark_content" in analysis_result["flags"]:
            recommendations.append("Consider brightening video or adding warning")
        
        if not analysis_result["content_tags"]:
            recommendations.append("Add more descriptive tags to improve content discovery")
        
        return recommendations

# Utility functions for content filtering

async def filter_content_by_age(content_list: List[Dict], user_age_group: str) -> List[Dict]:
    """Filter content list based on user's age group"""
    if not user_age_group:
        return content_list
    
    filtered_content = []
    
    for content in content_list:
        target_age = content.get('target_age_group')
        safety_score = content.get('safety_score', 0)
        
        # Basic age filtering logic
        if target_age == user_age_group and safety_score >= 70:
            filtered_content.append(content)
        elif not target_age and safety_score >= 80:  # General content with high safety
            filtered_content.append(content)
    
    return filtered_content

async def get_content_recommendations(user_preferences: Dict, available_content: List[Dict]) -> List[Dict]:
    """AI-powered content recommendations"""
    # This is a simplified recommendation system
    # In production, you'd use more sophisticated ML algorithms
    
    user_age = user_preferences.get('age_group')
    user_interests = user_preferences.get('interests', [])
    watch_history = user_preferences.get('watch_history', [])
    
    scored_content = []
    
    for content in available_content:
        score = 0
        
        # Age appropriateness
        if content.get('target_age_group') == user_age:
            score += 30
        
        # Interest matching
        content_tags = content.get('content_tags', [])
        common_interests = set(user_interests) & set(content_tags)
        score += len(common_interests) * 10
        
        # Safety score
        score += content.get('safety_score', 0) * 0.2
        
        # Popularity boost
        score += min(content.get('view_count', 0) / 100, 20)
        
        # Avoid recently watched
        if content['id'] not in [item['video_id'] for item in watch_history[-10:]]:
            score += 10
        
        scored_content.append((content, score))
    
    # Sort by score and return top recommendations
    scored_content.sort(key=lambda x: x[1], reverse=True)
    return [content for content, score in scored_content[:20]]

def create_content_safety_hash(content_data: Dict) -> str:
    """Create a hash for content safety verification"""
    safety_string = f"{content_data.get('title', '')}{content_data.get('safety_score', 0)}{content_data.get('flags', [])}"
    return hashlib.sha256(safety_string.encode()).hexdigest()[:16]