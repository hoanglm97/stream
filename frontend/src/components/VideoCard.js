import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, ClockIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const VideoCard = ({ video, onRemoveFavorite, isFavorited: initialFavorited = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialFavorited);

  useEffect(() => {
    // Check if video is in favorites on mount
    const favorites = JSON.parse(localStorage.getItem('kidsstream-favorites') || '[]');
    setIsFavorited(favorites.some(fav => fav.id === video.id));
  }, [video.id]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('kidsstream-favorites') || '[]');
    
    if (isFavorited) {
      // Remove from favorites
      const updatedFavorites = favorites.filter(fav => fav.id !== video.id);
      localStorage.setItem('kidsstream-favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
      
      // If we're on the favorites page, remove the video
      if (onRemoveFavorite) {
        onRemoveFavorite(video.id);
      }
    } else {
      // Add to favorites
      const updatedFavorites = [...favorites, video];
      localStorage.setItem('kidsstream-favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(true);
    }
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
    <div 
      className="card overflow-hidden group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/video/${video.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative overflow-hidden">
          <img 
            src={video.thumbnail_url || '/api/placeholder/320/180'} 
            alt={video.title}
            className={`w-full h-48 object-cover transition-all duration-500 ${
              isHovered ? 'scale-110 brightness-75' : 'scale-100'
            }`}
          />
          
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-300 ${
              isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}>
              <PlayIcon className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            } ${isFavorited ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isFavorited ? (
              <HeartIconSolid className="h-5 w-5 animate-pulse" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>

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
          <h3 className={`font-bold text-lg text-gray-800 mb-2 line-clamp-2 transition-all duration-300 ${
            isHovered ? 'text-primary-600 transform translate-x-1' : ''
          }`}>
            {video.title}
          </h3>
          
          {video.description && (
            <p className={`text-gray-600 text-sm mb-3 line-clamp-2 transition-all duration-300 ${
              isHovered ? 'text-gray-700' : ''
            }`}>
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className={`flex items-center transition-all duration-300 ${
              isHovered ? 'text-primary-600 transform scale-105' : ''
            }`}>
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>{video.view_count || 0} views</span>
            </div>
            
            <span className={`transition-all duration-300 ${
              isHovered ? 'text-gray-700' : ''
            }`}>
              {new Date(video.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Hover progress bar */}
          <div className={`mt-3 h-1 bg-gray-200 rounded-full overflow-hidden transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transform transition-transform duration-1000 -translate-x-full group-hover:translate-x-0"></div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;