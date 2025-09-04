import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { HeartIcon } from '@heroicons/react/24/outline';

const Favorites = () => {
  const [favoriteVideos, setFavoriteVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load favorites from localStorage for now
    // In a real app, this would come from the backend
    const savedFavorites = JSON.parse(localStorage.getItem('kidsstream-favorites') || '[]');
    setFavoriteVideos(savedFavorites);
    setLoading(false);
  }, []);

  const removeFavorite = (videoId) => {
    const updatedFavorites = favoriteVideos.filter(video => video.id !== videoId);
    setFavoriteVideos(updatedFavorites);
    localStorage.setItem('kidsstream-favorites', JSON.stringify(updatedFavorites));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="h-12 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg mb-4 w-64 mx-auto animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <div className="h-6 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg w-96 mx-auto animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        </div>
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-3xl p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4 animate-float">
          <HeartIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-4">
          Your Favorites 💖
        </h1>
        <p className="text-xl text-white/90 dark:text-gray-300">
          All your loved videos in one place
        </p>
      </div>

      {/* Favorites Grid */}
      {favoriteVideos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-8xl mb-4">💔</div>
          <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-2">
            No favorites yet
          </h3>
          <p className="text-white/80 dark:text-gray-400 mb-6">
            Start adding videos to your favorites by clicking the heart icon!
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary"
          >
            Discover Videos ✨
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white dark:text-gray-100">
              {favoriteVideos.length} Favorite Video{favoriteVideos.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => {
                setFavoriteVideos([]);
                localStorage.removeItem('kidsstream-favorites');
              }}
              className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteVideos.map((video, index) => (
              <div 
                key={video.id} 
                className="animate-[fadeInUp_0.5s_ease-out]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <VideoCard 
                  video={video} 
                  onRemoveFavorite={removeFavorite}
                  isFavorited={true}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Favorites;