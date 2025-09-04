import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';

const VideoCard = ({ video }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAgeRatingColor = (rating) => {
    switch (rating) {
      case 'G': return 'bg-green-100 text-green-800';
      case 'PG': return 'bg-yellow-100 text-yellow-800';
      case 'PG-13': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card overflow-hidden group">
      <Link to={`/video/${video.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative overflow-hidden">
          <img 
            src={video.thumbnail_url || '/api/placeholder/320/180'} 
            alt={video.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <PlayIcon className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Age rating badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${getAgeRatingColor(video.age_rating)}`}>
            {video.age_rating}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
            {video.title}
          </h3>
          
          {video.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>{video.view_count || 0} views</span>
            </div>
            
            <span>
              {new Date(video.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;