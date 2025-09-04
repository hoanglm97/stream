"""
Advanced Technical Features
Offline download, voice search, adaptive streaming, and other advanced features
"""

import os
import json
import asyncio
import logging
import hashlib
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import speech_recognition as sr
import librosa
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from models import Video, User, WatchHistory
from database import get_db

logger = logging.getLogger(__name__)

class OfflineDownloadManager:
    def __init__(self):
        self.download_dir = Path("downloads")
        self.download_dir.mkdir(exist_ok=True)
        
        self.quality_options = {
            "low": {"resolution": "480p", "bitrate": "500k", "size_factor": 0.3},
            "medium": {"resolution": "720p", "bitrate": "1000k", "size_factor": 0.6},
            "high": {"resolution": "1080p", "bitrate": "2000k", "size_factor": 1.0}
        }
        
        self.max_downloads_per_user = 20
        self.download_expiry_days = 7
    
    async def request_download(
        self, 
        db: Session, 
        user_id: int, 
        video_id: int,
        quality: str = "medium"
    ) -> Dict[str, any]:
        """Request video download for offline viewing"""
        try:
            # Validate video and user
            video = db.query(Video).filter(
                Video.id == video_id,
                Video.is_approved == True
            ).first()
            
            if not video:
                return {"success": False, "error": "Video not found or not approved"}
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Check user's download quota
            user_downloads = await self.get_user_downloads(user_id)
            if len(user_downloads) >= self.max_downloads_per_user:
                return {
                    "success": False, 
                    "error": f"Download limit reached ({self.max_downloads_per_user} videos)"
                }
            
            # Check if already downloaded
            existing_download = next(
                (d for d in user_downloads if d["video_id"] == video_id), 
                None
            )
            
            if existing_download:
                if existing_download["status"] == "completed":
                    return {
                        "success": False,
                        "error": "Video already downloaded",
                        "download_info": existing_download
                    }
                elif existing_download["status"] == "processing":
                    return {
                        "success": False,
                        "error": "Download already in progress",
                        "download_info": existing_download
                    }
            
            # Validate quality option
            if quality not in self.quality_options:
                quality = "medium"
            
            # Create download record
            download_id = f"{user_id}_{video_id}_{int(datetime.now().timestamp())}"
            
            download_info = {
                "download_id": download_id,
                "user_id": user_id,
                "video_id": video_id,
                "video_title": video.title,
                "quality": quality,
                "status": "queued",
                "progress": 0,
                "file_size": 0,
                "download_path": "",
                "created_at": datetime.now().isoformat(),
                "expires_at": (datetime.now() + timedelta(days=self.download_expiry_days)).isoformat()
            }
            
            # Save download info
            await self.save_download_info(download_info)
            
            # Queue download task
            asyncio.create_task(self.process_download(download_info, video))
            
            return {
                "success": True,
                "download_id": download_id,
                "estimated_size": await self.estimate_download_size(video, quality),
                "estimated_time": "2-5 minutes",
                "expires_in_days": self.download_expiry_days
            }
            
        except Exception as e:
            logger.error(f"Error requesting download: {e}")
            return {"success": False, "error": str(e)}
    
    async def process_download(self, download_info: Dict, video: Video):
        """Process video download in background"""
        try:
            download_id = download_info["download_id"]
            quality = download_info["quality"]
            
            # Update status to processing
            download_info["status"] = "processing"
            await self.save_download_info(download_info)
            
            # Create user download directory
            user_dir = self.download_dir / str(download_info["user_id"])
            user_dir.mkdir(exist_ok=True)
            
            # Generate output filename
            safe_title = "".join(c for c in video.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            output_file = user_dir / f"{safe_title}_{quality}_{download_id}.mp4"
            
            # Process video with FFmpeg
            quality_settings = self.quality_options[quality]
            
            cmd = [
                'ffmpeg',
                '-i', video.file_path,
                '-vf', f'scale=-2:{quality_settings["resolution"][:-1]}',
                '-b:v', quality_settings["bitrate"],
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',  # Enable streaming
                '-progress', 'pipe:1',
                str(output_file)
            ]
            
            # Run FFmpeg with progress tracking
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            # Monitor progress
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output and 'out_time_ms' in output:
                    # Parse progress from FFmpeg output
                    try:
                        time_ms = int(output.split('=')[1])
                        duration_ms = video.duration * 1000 if video.duration else 1
                        progress = min((time_ms / duration_ms) * 100, 100)
                        
                        download_info["progress"] = int(progress)
                        await self.save_download_info(download_info)
                        
                    except (ValueError, IndexError):
                        pass
            
            # Check if successful
            if process.returncode == 0 and output_file.exists():
                file_size = output_file.stat().st_size
                
                download_info.update({
                    "status": "completed",
                    "progress": 100,
                    "file_size": file_size,
                    "download_path": str(output_file)
                })
                
                logger.info(f"Download completed: {download_id}")
                
            else:
                download_info["status"] = "failed"
                logger.error(f"Download failed: {download_id}")
            
            await self.save_download_info(download_info)
            
        except Exception as e:
            logger.error(f"Error processing download: {e}")
            download_info["status"] = "failed"
            await self.save_download_info(download_info)
    
    async def get_user_downloads(self, user_id: int) -> List[Dict]:
        """Get user's download history"""
        try:
            downloads_file = self.download_dir / f"user_{user_id}_downloads.json"
            
            if not downloads_file.exists():
                return []
            
            with open(downloads_file, 'r') as f:
                downloads = json.load(f)
            
            # Filter out expired downloads
            current_time = datetime.now()
            active_downloads = []
            
            for download in downloads:
                expires_at = datetime.fromisoformat(download["expires_at"])
                if expires_at > current_time:
                    active_downloads.append(download)
                else:
                    # Clean up expired files
                    await self.cleanup_download(download)
            
            # Save updated list
            if len(active_downloads) != len(downloads):
                with open(downloads_file, 'w') as f:
                    json.dump(active_downloads, f)
            
            return active_downloads
            
        except Exception as e:
            logger.error(f"Error getting user downloads: {e}")
            return []
    
    async def save_download_info(self, download_info: Dict):
        """Save download information to file"""
        try:
            user_id = download_info["user_id"]
            downloads_file = self.download_dir / f"user_{user_id}_downloads.json"
            
            # Load existing downloads
            downloads = []
            if downloads_file.exists():
                with open(downloads_file, 'r') as f:
                    downloads = json.load(f)
            
            # Update or add download info
            download_id = download_info["download_id"]
            updated = False
            
            for i, download in enumerate(downloads):
                if download["download_id"] == download_id:
                    downloads[i] = download_info
                    updated = True
                    break
            
            if not updated:
                downloads.append(download_info)
            
            # Save to file
            with open(downloads_file, 'w') as f:
                json.dump(downloads, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving download info: {e}")
    
    async def estimate_download_size(self, video: Video, quality: str) -> str:
        """Estimate download size based on video duration and quality"""
        try:
            if not video.duration:
                return "Unknown"
            
            # Base size estimation (MB per minute)
            size_per_minute = {
                "low": 5,    # ~5MB per minute at 480p
                "medium": 12, # ~12MB per minute at 720p
                "high": 25   # ~25MB per minute at 1080p
            }
            
            estimated_mb = video.duration / 60 * size_per_minute.get(quality, 12)
            
            if estimated_mb < 1024:
                return f"{int(estimated_mb)} MB"
            else:
                return f"{estimated_mb / 1024:.1f} GB"
                
        except Exception as e:
            logger.error(f"Error estimating download size: {e}")
            return "Unknown"
    
    async def delete_download(self, user_id: int, download_id: str) -> bool:
        """Delete a downloaded video"""
        try:
            downloads = await self.get_user_downloads(user_id)
            download = next((d for d in downloads if d["download_id"] == download_id), None)
            
            if not download:
                return False
            
            # Delete file
            if download.get("download_path") and Path(download["download_path"]).exists():
                Path(download["download_path"]).unlink()
            
            # Remove from downloads list
            downloads = [d for d in downloads if d["download_id"] != download_id]
            
            # Save updated list
            downloads_file = self.download_dir / f"user_{user_id}_downloads.json"
            with open(downloads_file, 'w') as f:
                json.dump(downloads, f)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting download: {e}")
            return False
    
    async def cleanup_download(self, download_info: Dict):
        """Clean up expired download"""
        try:
            if download_info.get("download_path"):
                file_path = Path(download_info["download_path"])
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"Cleaned up expired download: {download_info['download_id']}")
        except Exception as e:
            logger.error(f"Error cleaning up download: {e}")

class VoiceSearchSystem:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Kid-friendly voice commands
        self.voice_commands = {
            "playback": {
                "play": ["play", "start", "go"],
                "pause": ["pause", "stop", "wait"],
                "louder": ["louder", "volume up", "turn up"],
                "quieter": ["quieter", "volume down", "turn down"],
                "skip": ["skip", "next", "forward"],
                "back": ["back", "previous", "rewind"]
            },
            "search": {
                "animals": ["animals", "pets", "zoo", "dogs", "cats"],
                "music": ["music", "songs", "dance", "singing"],
                "learning": ["learn", "school", "education", "teach"],
                "fun": ["fun", "funny", "games", "play"],
                "colors": ["colors", "rainbow", "red", "blue", "green"],
                "numbers": ["numbers", "counting", "math", "one", "two"]
            }
        }
    
    async def process_voice_search(
        self, 
        db: Session, 
        audio_data: bytes,
        user_id: int
    ) -> Dict[str, any]:
        """Process voice search from audio data"""
        try:
            # Convert audio data to text
            text = await self.speech_to_text(audio_data)
            
            if not text:
                return {
                    "success": False,
                    "error": "Could not understand audio",
                    "suggestions": ["Try speaking more clearly", "Check your microphone"]
                }
            
            # Process the text query
            search_result = await self.process_text_query(db, text, user_id)
            
            return {
                "success": True,
                "recognized_text": text,
                "search_results": search_result["videos"],
                "search_type": search_result["type"],
                "confidence": search_result["confidence"]
            }
            
        except Exception as e:
            logger.error(f"Error processing voice search: {e}")
            return {"success": False, "error": str(e)}
    
    async def speech_to_text(self, audio_data: bytes) -> Optional[str]:
        """Convert speech to text using speech recognition"""
        try:
            # Convert bytes to AudioData (simplified)
            # In a real implementation, you'd properly handle audio format conversion
            
            # For now, return a mock result
            # In production, you'd use:
            # audio = sr.AudioData(audio_data, sample_rate, sample_width)
            # text = self.recognizer.recognize_google(audio, language='en-US')
            
            # Mock implementation for demonstration
            mock_queries = [
                "funny animals",
                "learning colors",
                "counting numbers",
                "music for kids",
                "play video"
            ]
            
            return random.choice(mock_queries)
            
        except Exception as e:
            logger.error(f"Error in speech to text: {e}")
            return None
    
    async def process_text_query(
        self, 
        db: Session, 
        query_text: str, 
        user_id: int
    ) -> Dict[str, any]:
        """Process text query and return search results"""
        try:
            query_lower = query_text.lower()
            
            # Check for playback commands
            if any(cmd in query_lower for cmd in self.voice_commands["playback"]["play"]):
                return {
                    "type": "command",
                    "command": "play",
                    "videos": [],
                    "confidence": 0.9
                }
            
            # Determine search category
            search_category = "general"
            confidence = 0.5
            
            for category, keywords in self.voice_commands["search"].items():
                if any(keyword in query_lower for keyword in keywords):
                    search_category = category
                    confidence = 0.8
                    break
            
            # Search for videos
            videos = await self.search_videos_by_category(db, search_category, query_text, user_id)
            
            return {
                "type": "search",
                "category": search_category,
                "videos": videos,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error processing text query: {e}")
            return {"type": "error", "videos": [], "confidence": 0.0}
    
    async def search_videos_by_category(
        self, 
        db: Session, 
        category: str, 
        query_text: str,
        user_id: int
    ) -> List[Dict]:
        """Search videos by category and query text"""
        try:
            # Get user for age-appropriate filtering
            user = db.query(User).filter(User.id == user_id).first()
            
            # Base query
            query = db.query(Video).filter(
                Video.is_approved == True,
                Video.safety_score >= 70
            )
            
            # Filter by age group if available
            if user and user.preferred_age_group:
                query = query.filter(
                    or_(
                        Video.target_age_group == user.preferred_age_group,
                        Video.target_age_group.is_(None)
                    )
                )
            
            # Category-specific filtering
            if category == "animals":
                query = query.filter(
                    or_(
                        Video.title.ilike('%animal%'),
                        Video.title.ilike('%pet%'),
                        Video.title.ilike('%zoo%'),
                        Video.description.ilike('%animal%')
                    )
                )
            elif category == "music":
                query = query.filter(
                    or_(
                        Video.title.ilike('%music%'),
                        Video.title.ilike('%song%'),
                        Video.title.ilike('%dance%'),
                        Video.content_type == ContentType.MUSIC
                    )
                )
            elif category == "learning":
                query = query.filter(Video.content_type == ContentType.EDUCATIONAL)
            else:
                # General text search
                search_terms = query_text.split()
                for term in search_terms:
                    query = query.filter(
                        or_(
                            Video.title.ilike(f'%{term}%'),
                            Video.description.ilike(f'%{term}%')
                        )
                    )
            
            # Get results
            videos = query.order_by(desc(Video.view_count)).limit(10).all()
            
            return [
                {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "duration": video.duration,
                    "thumbnail_path": video.thumbnail_path,
                    "safety_score": video.safety_score,
                    "view_count": video.view_count
                }
                for video in videos
            ]
            
        except Exception as e:
            logger.error(f"Error searching videos by category: {e}")
            return []
    
    async def get_voice_command_help(self) -> Dict[str, List[str]]:
        """Get list of available voice commands for help"""
        return {
            "playback_controls": [
                "Say 'play' to start the video",
                "Say 'pause' to pause the video",
                "Say 'louder' to increase volume",
                "Say 'quieter' to decrease volume"
            ],
            "search_examples": [
                "Say 'funny animals' to find animal videos",
                "Say 'learning colors' to find educational content",
                "Say 'music for kids' to find music videos",
                "Say 'counting numbers' to find math videos"
            ]
        }

class AdaptiveStreamingManager:
    def __init__(self):
        self.quality_levels = {
            "240p": {"bitrate": 300, "resolution": "426x240"},
            "360p": {"bitrate": 500, "resolution": "640x360"},
            "480p": {"bitrate": 800, "resolution": "854x480"},
            "720p": {"bitrate": 1200, "resolution": "1280x720"},
            "1080p": {"bitrate": 2000, "resolution": "1920x1080"}
        }
        
        self.network_thresholds = {
            "slow": {"max_bitrate": 500, "recommended_quality": "360p"},
            "medium": {"max_bitrate": 1000, "recommended_quality": "480p"},
            "fast": {"max_bitrate": 2000, "recommended_quality": "720p"},
            "very_fast": {"max_bitrate": 5000, "recommended_quality": "1080p"}
        }
    
    async def get_optimal_quality(
        self, 
        network_speed: float,  # Mbps
        device_capabilities: Dict,
        user_preferences: Dict
    ) -> Dict[str, any]:
        """Determine optimal streaming quality based on conditions"""
        try:
            # Convert Mbps to kbps
            network_kbps = network_speed * 1000
            
            # Determine network category
            if network_kbps < 1000:
                network_type = "slow"
            elif network_kbps < 2000:
                network_type = "medium"
            elif network_kbps < 5000:
                network_type = "fast"
            else:
                network_type = "very_fast"
            
            # Get recommended quality based on network
            recommended_quality = self.network_thresholds[network_type]["recommended_quality"]
            
            # Adjust based on device capabilities
            max_device_resolution = device_capabilities.get("max_resolution", "1080p")
            if self.compare_quality(recommended_quality, max_device_resolution) > 0:
                recommended_quality = max_device_resolution
            
            # Consider user preferences
            user_quality_pref = user_preferences.get("preferred_quality", "auto")
            if user_quality_pref != "auto":
                # Check if user preference is feasible
                user_bitrate = self.quality_levels[user_quality_pref]["bitrate"]
                if user_bitrate <= network_kbps * 0.8:  # 80% of available bandwidth
                    recommended_quality = user_quality_pref
            
            # Generate adaptive playlist
            available_qualities = self.get_available_qualities(network_kbps)
            
            return {
                "recommended_quality": recommended_quality,
                "available_qualities": available_qualities,
                "network_type": network_type,
                "estimated_buffer_time": self.estimate_buffer_time(network_kbps, recommended_quality),
                "adaptive_enabled": True
            }
            
        except Exception as e:
            logger.error(f"Error determining optimal quality: {e}")
            return {
                "recommended_quality": "480p",
                "available_qualities": ["240p", "360p", "480p"],
                "network_type": "medium",
                "adaptive_enabled": False
            }
    
    def compare_quality(self, quality1: str, quality2: str) -> int:
        """Compare two quality levels. Returns -1, 0, or 1"""
        qualities = ["240p", "360p", "480p", "720p", "1080p"]
        
        try:
            index1 = qualities.index(quality1)
            index2 = qualities.index(quality2)
            
            if index1 < index2:
                return -1
            elif index1 > index2:
                return 1
            else:
                return 0
        except ValueError:
            return 0
    
    def get_available_qualities(self, network_kbps: float) -> List[str]:
        """Get list of qualities available for current network speed"""
        available = []
        
        for quality, specs in self.quality_levels.items():
            # Include quality if network can handle it with some buffer
            if specs["bitrate"] <= network_kbps * 0.9:
                available.append(quality)
        
        return available if available else ["240p"]
    
    def estimate_buffer_time(self, network_kbps: float, quality: str) -> int:
        """Estimate initial buffer time in seconds"""
        try:
            required_bitrate = self.quality_levels[quality]["bitrate"]
            
            if network_kbps >= required_bitrate * 2:
                return 2  # Fast network, minimal buffering
            elif network_kbps >= required_bitrate * 1.5:
                return 5  # Good network
            elif network_kbps >= required_bitrate:
                return 10  # Adequate network
            else:
                return 15  # Slow network, more buffering needed
                
        except KeyError:
            return 5  # Default buffer time
    
    async def generate_hls_playlist(
        self, 
        video_id: int, 
        available_qualities: List[str]
    ) -> str:
        """Generate HLS playlist for adaptive streaming"""
        try:
            playlist_lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
            
            for quality in available_qualities:
                specs = self.quality_levels[quality]
                playlist_lines.extend([
                    f"#EXT-X-STREAM-INF:BANDWIDTH={specs['bitrate'] * 1000},RESOLUTION={specs['resolution']}",
                    f"/stream/{video_id}/{quality}/playlist.m3u8"
                ])
            
            return "\n".join(playlist_lines)
            
        except Exception as e:
            logger.error(f"Error generating HLS playlist: {e}")
            return ""

class PictureInPictureManager:
    def __init__(self):
        self.pip_settings = {
            "default_size": {"width": 320, "height": 180},
            "min_size": {"width": 200, "height": 112},
            "max_size": {"width": 640, "height": 360},
            "default_position": {"x": "right", "y": "bottom"},
            "margin": 20
        }
    
    async def enable_pip_mode(
        self, 
        video_id: int, 
        user_preferences: Dict = None
    ) -> Dict[str, any]:
        """Enable picture-in-picture mode for video"""
        try:
            # Get user preferences or use defaults
            size = user_preferences.get("size", self.pip_settings["default_size"])
            position = user_preferences.get("position", self.pip_settings["default_position"])
            
            # Validate size constraints
            size = self.validate_pip_size(size)
            
            pip_config = {
                "video_id": video_id,
                "enabled": True,
                "size": size,
                "position": position,
                "controls": {
                    "play_pause": True,
                    "close": True,
                    "resize": True,
                    "move": True
                },
                "features": {
                    "always_on_top": True,
                    "click_to_focus": True,
                    "auto_hide_controls": True
                }
            }
            
            return {
                "success": True,
                "pip_config": pip_config,
                "instructions": [
                    "Video will continue playing in small window",
                    "Click and drag to move the window",
                    "Double-click to return to full size"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error enabling PiP mode: {e}")
            return {"success": False, "error": str(e)}
    
    def validate_pip_size(self, size: Dict) -> Dict:
        """Validate and adjust PiP window size"""
        width = max(
            self.pip_settings["min_size"]["width"],
            min(size.get("width", 320), self.pip_settings["max_size"]["width"])
        )
        
        # Maintain 16:9 aspect ratio
        height = int(width * 9 / 16)
        
        return {"width": width, "height": height}
    
    async def get_pip_capabilities(self) -> Dict[str, any]:
        """Get PiP capabilities and settings"""
        return {
            "supported": True,
            "size_options": {
                "small": {"width": 240, "height": 135},
                "medium": {"width": 320, "height": 180},
                "large": {"width": 480, "height": 270}
            },
            "position_options": [
                "top-left", "top-right", "bottom-left", "bottom-right"
            ],
            "features": [
                "Always on top",
                "Draggable",
                "Resizable",
                "Auto-hide controls",
                "Click to focus main window"
            ]
        }