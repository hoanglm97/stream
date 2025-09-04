import ffmpeg
import os
from pathlib import Path
import asyncio
import logging
from typing import Dict

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path("processed")
THUMBNAILS_DIR = Path("thumbnails")

async def process_video(input_path: Path) -> Dict[str, any]:
    """Process video to multiple qualities and extract metadata"""
    try:
        # Get video info
        probe = ffmpeg.probe(str(input_path))
        video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        duration = float(probe['format']['duration'])
        
        # Create output directory for this video
        video_id = input_path.stem
        output_dir = PROCESSED_DIR / video_id
        output_dir.mkdir(exist_ok=True)
        
        # Define output qualities
        qualities = {
            "480p": {"width": 854, "height": 480, "bitrate": "1000k"},
            "720p": {"width": 1280, "height": 720, "bitrate": "2500k"},
            "1080p": {"width": 1920, "height": 1080, "bitrate": "4000k"}
        }
        
        processed_files = {}
        
        # Process each quality
        for quality, settings in qualities.items():
            output_path = output_dir / f"{video_id}_{quality}.mp4"
            
            # Skip if original resolution is lower than target
            original_height = int(video_info.get('height', 0))
            if original_height < settings["height"]:
                continue
            
            try:
                # Convert video with ffmpeg
                stream = ffmpeg.input(str(input_path))
                stream = ffmpeg.filter(stream, 'scale', settings["width"], settings["height"])
                stream = ffmpeg.output(
                    stream,
                    str(output_path),
                    vcodec='libx264',
                    acodec='aac',
                    video_bitrate=settings["bitrate"],
                    audio_bitrate='128k',
                    format='mp4'
                )
                
                # Run conversion
                await asyncio.to_thread(ffmpeg.run, stream, overwrite_output=True, quiet=True)
                processed_files[quality] = output_path
                logger.info(f"Processed {quality} version: {output_path}")
                
            except ffmpeg.Error as e:
                logger.error(f"Error processing {quality}: {e}")
                continue
        
        # If no qualities were processed, use original
        if not processed_files:
            # At least copy the original file
            original_copy = output_dir / f"{video_id}_original.mp4"
            await asyncio.to_thread(os.rename, str(input_path), str(original_copy))
            processed_files["original"] = original_copy
        
        processed_files["duration"] = duration
        return processed_files
        
    except Exception as e:
        logger.error(f"Error processing video {input_path}: {e}")
        raise

async def generate_thumbnail(input_path: Path, timestamp: str = "00:00:01") -> Path:
    """Generate thumbnail from video"""
    try:
        video_id = input_path.stem
        thumbnail_path = THUMBNAILS_DIR / f"{video_id}_thumb.jpg"
        
        # Extract frame at specified timestamp
        stream = ffmpeg.input(str(input_path), ss=timestamp)
        stream = ffmpeg.filter(stream, 'scale', 320, 240)
        stream = ffmpeg.output(stream, str(thumbnail_path), vframes=1, format='image2')
        
        await asyncio.to_thread(ffmpeg.run, stream, overwrite_output=True, quiet=True)
        
        logger.info(f"Generated thumbnail: {thumbnail_path}")
        return thumbnail_path
        
    except Exception as e:
        logger.error(f"Error generating thumbnail for {input_path}: {e}")
        # Return a default thumbnail path or create a placeholder
        return THUMBNAILS_DIR / "default_thumb.jpg"

async def get_video_duration(file_path: Path) -> float:
    """Get video duration in seconds"""
    try:
        probe = ffmpeg.probe(str(file_path))
        duration = float(probe['format']['duration'])
        return duration
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")
        return 0.0