import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  SparklesIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAgeRating, setSelectedAgeRating] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);

  const categoryIcons = {
    'Educational': AcademicCapIcon,
    'Entertainment': SparklesIcon,
    'Stories': BookOpenIcon,
    'Music': MusicalNoteIcon,
    'Arts & Crafts': PaintBrushIcon,
  };

  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasMore(true);
    fetchVideos(1, true);
    fetchCategories();
  }, [selectedCategory, selectedAgeRating]);

  const fetchVideos = async (pageNum = page, reset = false) => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedAgeRating) params.append('age_rating', selectedAgeRating);
      params.append('page', pageNum);
      params.append('limit', '12'); // Load 12 videos per page
      
      const response = await axios.get(`/videos?${params.toString()}`);
      const newVideos = response.data.videos || response.data;
      const total = response.data.total || newVideos.length;
      
      if (reset) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }
      
      setTotalVideos(total);
      setHasMore(newVideos.length === 12 && videos.length + newVideos.length < total);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadMoreVideos = useCallback(async () => {
    if (!hasMore) return;
    await fetchVideos(page);
  }, [page, hasMore]);

  const { isLoading: isLoadingMore } = useInfiniteScroll(loadMoreVideos, hasMore);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Hero Section Skeleton */}
        <div className="text-center mb-12 bg-white/10 backdrop-blur-md rounded-3xl p-8">
          <div className="h-12 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg mb-4 animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <div className="h-6 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg mb-6 w-3/4 mx-auto animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <div className="max-w-2xl mx-auto h-12 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-2xl animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-wrap gap-4 mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="h-6 w-16 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <div className="h-10 w-32 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-xl animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <div className="h-10 w-32 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-xl animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="mb-12">
          <div className="h-8 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg mb-6 w-64 mx-auto animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          <LoadingSkeleton type="categories" />
        </div>

        {/* Videos Skeleton */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg w-48 animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
            <div className="h-6 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded w-20 animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
          </div>
          <LoadingSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 bg-white/10 backdrop-blur-md rounded-3xl p-8 transform transition-all duration-500 hover:scale-105 hover:bg-white/15">
        <h1 className="text-5xl font-bold text-white mb-4 animate-pulse-slow hover:animate-wiggle cursor-default">
          Welcome to KidsStream! 🌟
        </h1>
        <p className="text-xl text-white/90 mb-6 animate-float">
          Safe, fun, and educational videos for children
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            placeholder="Search for fun videos... 🔍"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 shadow-lg text-lg focus:ring-4 focus:ring-primary-300 transition-all duration-300 focus:scale-105 hover:shadow-xl"
          />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 group-focus-within:text-primary-500 group-focus-within:scale-110" />
          
          {/* Search suggestions placeholder */}
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10 animate-[fadeInUp_0.3s_ease-out]">
              <div className="p-4 text-gray-600 text-sm">
                Searching for "{searchTerm}"... ✨
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center text-white font-semibold">
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters:
        </div>
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-xl border-0 shadow-md focus:ring-2 focus:ring-primary-500 transition-all duration-200"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Age Rating Filter */}
        <select
          value={selectedAgeRating}
          onChange={(e) => setSelectedAgeRating(e.target.value)}
          className="px-4 py-2 rounded-xl border-0 shadow-md focus:ring-2 focus:ring-primary-500 transition-all duration-200"
        >
          <option value="">All Ages</option>
          <option value="G">G - General Audience</option>
          <option value="PG">PG - Parental Guidance</option>
          <option value="PG-13">PG-13 - Ages 13+</option>
        </select>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Explore Categories 🎭
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map(category => {
              const IconComponent = categoryIcons[category.name] || SparklesIcon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)}
                  className={`card p-6 text-center transition-all duration-300 hover:scale-110 hover:rotate-1 group ${
                    selectedCategory === category.id 
                      ? 'ring-4 ring-primary-400 bg-primary-50 scale-105 animate-pulse' 
                      : 'hover:bg-gray-50 hover:shadow-xl'
                  }`}
                >
                  <IconComponent className={`h-8 w-8 mx-auto mb-2 text-primary-600 transition-all duration-300 group-hover:animate-bounce ${
                    selectedCategory === category.id ? 'animate-wiggle' : ''
                  }`} />
                  <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors duration-200">
                    {category.name}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Latest Videos'} 📺
          </h2>
          <span className="text-white/80">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">No videos found</h3>
            <p className="text-white/80">
              {searchTerm 
                ? "Try searching for something else!" 
                : "Check back later for new content!"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
            
            {/* Infinite scroll loading indicator */}
            {isLoadingMore && (
              <div className="mt-8">
                <LoadingSkeleton count={4} />
              </div>
            )}
            
            {/* End of results indicator */}
            {!hasMore && filteredVideos.length > 0 && (
              <div className="text-center mt-12 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4 animate-pulse">
                  <span className="text-2xl">🎬</span>
                </div>
                <p className="text-white/80 text-lg font-medium">
                  You've seen all the awesome videos! 🌟
                </p>
                <p className="text-white/60 text-sm mt-2">
                  Check back later for more content!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;