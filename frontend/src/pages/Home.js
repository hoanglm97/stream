import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
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

  const categoryIcons = {
    'Educational': AcademicCapIcon,
    'Entertainment': SparklesIcon,
    'Stories': BookOpenIcon,
    'Music': MusicalNoteIcon,
    'Arts & Crafts': PaintBrushIcon,
  };

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [selectedCategory, selectedAgeRating]);

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedAgeRating) params.append('age_rating', selectedAgeRating);
      
      const response = await axios.get(`/videos?${params.toString()}`);
      setVideos(response.data);
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

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-white">Loading awesome videos... 🎬</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 bg-white/10 backdrop-blur-md rounded-3xl p-8">
        <h1 className="text-5xl font-bold text-white mb-4 animate-pulse-slow">
          Welcome to KidsStream! 🌟
        </h1>
        <p className="text-xl text-white/90 mb-6">
          Safe, fun, and educational videos for children
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for fun videos... 🔍"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 shadow-lg text-lg focus:ring-4 focus:ring-primary-300 transition-all duration-300"
          />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
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
                  className={`card p-6 text-center transition-all duration-300 ${
                    selectedCategory === category.id 
                      ? 'ring-4 ring-primary-400 bg-primary-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;