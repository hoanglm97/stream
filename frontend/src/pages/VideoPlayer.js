import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  EyeIcon, 
  CalendarIcon,
  ShareIcon,
  HeartIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Comments from '../components/Comments';

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchVideo();
    fetchRelatedVideos();
  }, [id]);

  const fetchVideo = async () => {
    try {
      // In a real implementation, you'd have an endpoint to get video by ID
      // For now, we'll simulate it by fetching all videos and finding the one
      const response = await axios.get('/videos');
      const foundVideo = response.data.find(v => v.id === parseInt(id));
      
      if (foundVideo) {
        setVideo(foundVideo);
      } else {
        toast.error('Video not found');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedVideos = async () => {
    try {
      const response = await axios.get('/videos?limit=6');
      setRelatedVideos(response.data.filter(v => v.id !== parseInt(id)));
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard! 📋');
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Removed from favorites' : 'Added to favorites! ❤️');
  };

  const handleReport = () => {
    toast.success('Thank you for reporting. We\'ll review this content. 🛡️');
  };

  const getAgeRatingColor = (rating) => {
    switch (rating) {
      case 'G': return 'bg-green-100 text-green-800';
      case 'PG': return 'bg-yellow-100 text-yellow-800';
      case 'PG-13': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-white">Loading video... 🎬</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <div className="text-8xl mb-4">😕</div>
        <h2 className="text-3xl font-bold text-white mb-4">Video not found</h2>
        <Link to="/" className="btn-primary">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center text-white hover:text-white/80 mb-6 transition-colors duration-200"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to videos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="video-container mb-6">
            <ReactPlayer
              url={video.video_type === 'youtube' ? video.youtube_url : `/videos/${video.id}/stream`}
              width="100%"
              height="500px"
              controls
              playing={false}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                },
                youtube: {
                  playerVars: {
                    showinfo: 1,
                    rel: 0, // Don't show related videos from other channels
                    modestbranding: 1, // Reduce YouTube branding
                    fs: 1, // Allow fullscreen
                    cc_load_policy: 1, // Show captions by default
                    iv_load_policy: 3, // Hide video annotations
                    autohide: 1 // Auto-hide controls
                  }
                }
              }}
            />
          </div>

          {/* Video Info */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {video.title}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    <span>{video.view_count || 0} views</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getAgeRatingColor(video.age_rating)}`}>
                    {video.age_rating}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={handleLike}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  liked 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <HeartIcon className={`h-5 w-5 mr-2 ${liked ? 'fill-current' : ''}`} />
                {liked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>

              <button
                onClick={handleReport}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <FlagIcon className="h-5 w-5 mr-2" />
                Report
              </button>
            </div>

            {/* Description */}
            {video.description && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="lg:col-span-2 mt-8">
          <Comments videoId={parseInt(id)} />
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              More Fun Videos 🎉
            </h3>
            
            <div className="space-y-4">
              {relatedVideos.map(relatedVideo => (
                <Link
                  key={relatedVideo.id}
                  to={`/video/${relatedVideo.id}`}
                  className="block group"
                >
                  <div className="flex space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <img
                      src={relatedVideo.thumbnail_url || '/api/placeholder/120/90'}
                      alt={relatedVideo.title}
                      className="w-20 h-15 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
                        {relatedVideo.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{relatedVideo.view_count || 0} views</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(relatedVideo.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-2 ${getAgeRatingColor(relatedVideo.age_rating)}`}>
                        {relatedVideo.age_rating}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {relatedVideos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎬</div>
                <p>No related videos yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;