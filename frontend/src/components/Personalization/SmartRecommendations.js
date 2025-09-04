import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  ClockIcon,
  HeartIcon,
  StarIcon,
  PlayIcon,
  EyeIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  FireIcon,
  BoltIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';

const SmartRecommendations = ({ userId, onVideoSelect }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('for-you');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [mood, setMood] = useState('happy');
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({});
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [seasonalContent, setSeasonalContent] = useState([]);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });

  const filters = [
    { id: 'for-you', label: 'For You', icon: SparklesIcon, color: 'purple' },
    { id: 'trending', label: 'Trending', icon: FireIcon, color: 'orange' },
    { id: 'new', label: 'New', icon: BoltIcon, color: 'blue' },
    { id: 'educational', label: 'Learn', icon: AcademicCapIcon, color: 'green' },
    { id: 'entertainment', label: 'Fun', icon: PlayIcon, color: 'pink' },
    { id: 'music', label: 'Music', icon: MusicalNoteIcon, color: 'yellow' },
    { id: 'art', label: 'Art', icon: PaintBrushIcon, color: 'indigo' }
  ];

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊', color: 'yellow' },
    { id: 'curious', label: 'Curious', emoji: '🤔', color: 'blue' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡', color: 'orange' },
    { id: 'calm', label: 'Calm', emoji: '😌', color: 'green' },
    { id: 'creative', label: 'Creative', emoji: '🎨', color: 'purple' },
    { id: 'sleepy', label: 'Sleepy', emoji: '😴', color: 'indigo' }
  ];

  const timeBasedRecommendations = {
    morning: {
      title: '🌅 Good Morning!',
      description: 'Start your day with energy and learning!',
      categories: ['educational', 'music', 'exercise']
    },
    afternoon: {
      title: '☀️ Afternoon Fun',
      description: 'Perfect time for adventures and creativity!',
      categories: ['entertainment', 'art', 'science']
    },
    evening: {
      title: '🌙 Evening Wind Down',
      description: 'Relax with calming stories and gentle activities',
      categories: ['stories', 'calm-music', 'nature']
    }
  };

  useEffect(() => {
    determineTimeOfDay();
    fetchRecommendations();
    fetchUserPreferences();
    fetchTrendingTopics();
    fetchSeasonalContent();
  }, [userId, activeFilter, mood]);

  useEffect(() => {
    if (inView) {
      loadMoreRecommendations();
    }
  }, [inView]);

  const determineTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/recommendations/${userId}`, {
        params: {
          filter: activeFilter,
          mood,
          timeOfDay,
          limit: 20
        }
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setSampleRecommendations();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get(`/api/user/${userId}/preferences`);
      setUserPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setUserPreferences({
        favoriteCategories: ['educational', 'entertainment'],
        watchTime: 'afternoon',
        contentComplexity: 'medium'
      });
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const response = await axios.get('/api/trending/topics');
      setTrendingTopics(response.data);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setTrendingTopics([
        { id: 1, name: 'Space Adventure', emoji: '🚀', count: 1250 },
        { id: 2, name: 'Ocean Animals', emoji: '🐠', count: 980 },
        { id: 3, name: 'Art & Crafts', emoji: '🎨', count: 750 },
        { id: 4, name: 'Dinosaurs', emoji: '🦕', count: 1100 }
      ]);
    }
  };

  const fetchSeasonalContent = async () => {
    try {
      const response = await axios.get('/api/content/seasonal');
      setSeasonalContent(response.data);
    } catch (error) {
      console.error('Error fetching seasonal content:', error);
      setSeasonalContent([
        { id: 1, title: 'Winter Wonderland', type: 'collection', thumbnail: '/api/placeholder/200/120' },
        { id: 2, title: 'Holiday Crafts', type: 'playlist', thumbnail: '/api/placeholder/200/120' }
      ]);
    }
  };

  const setSampleRecommendations = () => {
    const sampleVideos = [
      {
        id: 1,
        title: 'Amazing Ocean Animals',
        thumbnail: '/api/placeholder/300/200',
        duration: '8:45',
        category: 'educational',
        difficulty: 'easy',
        views: 12500,
        rating: 4.8,
        isNew: false,
        matchReason: 'Based on your love for animal videos',
        tags: ['animals', 'ocean', 'learning'],
        aiScore: 95
      },
      {
        id: 2,
        title: 'Space Adventure Story',
        thumbnail: '/api/placeholder/300/200',
        duration: '12:30',
        category: 'entertainment',
        difficulty: 'medium',
        views: 8900,
        rating: 4.9,
        isNew: true,
        matchReason: 'Perfect for your curious mood',
        tags: ['space', 'adventure', 'story'],
        aiScore: 92
      },
      {
        id: 3,
        title: 'Fun with Colors and Shapes',
        thumbnail: '/api/placeholder/300/200',
        duration: '6:15',
        category: 'educational',
        difficulty: 'easy',
        views: 15600,
        rating: 4.7,
        isNew: false,
        matchReason: 'Great for afternoon learning',
        tags: ['colors', 'shapes', 'basics'],
        aiScore: 88
      },
      {
        id: 4,
        title: 'Magical Music Adventure',
        thumbnail: '/api/placeholder/300/200',
        duration: '10:20',
        category: 'music',
        difficulty: 'easy',
        views: 9800,
        rating: 4.8,
        isNew: false,
        matchReason: 'You enjoyed similar music videos',
        tags: ['music', 'singing', 'fun'],
        aiScore: 90
      }
    ];
    
    setRecommendations(sampleVideos);
  };

  const loadMoreRecommendations = async () => {
    try {
      const response = await axios.get(`/api/recommendations/${userId}`, {
        params: {
          filter: activeFilter,
          mood,
          timeOfDay,
          offset: recommendations.length,
          limit: 10
        }
      });
      setRecommendations(prev => [...prev, ...response.data]);
    } catch (error) {
      console.error('Error loading more recommendations:', error);
    }
  };

  const getFilterColor = (color) => {
    const colors = {
      purple: 'bg-purple-600 text-white',
      orange: 'bg-orange-600 text-white',
      blue: 'bg-blue-600 text-white',
      green: 'bg-green-600 text-white',
      pink: 'bg-pink-600 text-white',
      yellow: 'bg-yellow-600 text-white',
      indigo: 'bg-indigo-600 text-white'
    };
    return colors[color] || colors.purple;
  };

  const getMoodColor = (color) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[color] || colors.yellow;
  };

  const VideoCard = ({ video, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
      onClick={() => onVideoSelect?.(video)}
    >
      <div className="relative">
        <img 
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {video.duration}
        </div>
        
        {/* New Badge */}
        {video.isNew && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            NEW
          </div>
        )}
        
        {/* AI Match Score */}
        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          <SparklesIcon className="h-3 w-3 mr-1" />
          {video.aiScore}%
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
            <PlayIcon className="h-8 w-8 text-gray-800 ml-1" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            video.category === 'educational' ? 'bg-green-100 text-green-800' :
            video.category === 'entertainment' ? 'bg-pink-100 text-pink-800' :
            video.category === 'music' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {video.category}
          </span>
          
          <span className={`px-2 py-1 rounded-full text-xs ${
            video.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
            video.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            {video.difficulty}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{video.views?.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <StarSolid className="h-4 w-4 text-yellow-400" />
              <span>{video.rating}</span>
            </div>
          </div>
          
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
        
        {/* AI Match Reason */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700">{video.matchReason}</span>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {video.tags?.slice(0, 3).map((tag, tagIndex) => (
            <span 
              key={tagIndex}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {timeBasedRecommendations[timeOfDay].title}
            </h1>
            <p className="text-gray-600">{timeBasedRecommendations[timeOfDay].description}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-colors">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mood Selector */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How are you feeling today?</h3>
        <div className="flex flex-wrap gap-3">
          {moods.map((moodOption) => (
            <button
              key={moodOption.id}
              onClick={() => setMood(moodOption.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 border-2 ${
                mood === moodOption.id
                  ? getMoodColor(moodOption.color)
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{moodOption.emoji}</span>
              {moodOption.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
            Trending Now
          </h3>
          <div className="flex flex-wrap gap-3">
            {trendingTopics.map((topic) => (
              <button
                key={topic.id}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center space-x-2"
              >
                <span>{topic.emoji}</span>
                <span>{topic.name}</span>
                <span className="text-xs bg-orange-200 px-2 py-1 rounded-full">
                  {topic.count}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-lg mb-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeFilter === filter.id
                  ? getFilterColor(filter.color)
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <filter.icon className="h-4 w-4 mr-2" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
          </div>
          
          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </>
      )}

      {/* Seasonal Content */}
      {seasonalContent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <GiftIcon className="h-6 w-6 mr-2 text-purple-600" />
            Special Collections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seasonalContent.map((content) => (
              <div key={content.id} className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <img 
                    src={content.thumbnail}
                    alt={content.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-1">{content.title}</h4>
                    <p className="text-gray-600 capitalize">{content.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SmartRecommendations;