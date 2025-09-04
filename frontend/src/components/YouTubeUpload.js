import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { 
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const YouTubeUpload = () => {
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const youtubeUrl = watch('youtube_url');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (youtubeUrl && isValidYouTubeUrl(youtubeUrl)) {
      const videoId = extractVideoId(youtubeUrl);
      if (videoId) {
        setVideoPreview({
          id: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          url: youtubeUrl
        });
      }
    } else {
      setVideoPreview(null);
    }
  }, [youtubeUrl]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to upload videos');
        return;
      }

      const response = await axios.post('/videos/youtube', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('YouTube video added successfully! 🎉');
      reset();
      setVideoPreview(null);
      
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add YouTube video';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Add YouTube Video</h2>
          <p className="text-gray-600">
            Add educational YouTube videos to share with the community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube URL *
            </label>
            <div className="relative">
              <input
                type="url"
                {...register('youtube_url', {
                  required: 'YouTube URL is required',
                  validate: value => isValidYouTubeUrl(value) || 'Please enter a valid YouTube URL'
                })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                  errors.youtube_url ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <PlayIcon className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
            </div>
            {errors.youtube_url && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.youtube_url.message}
              </p>
            )}
          </div>

          {/* Video Preview */}
          {videoPreview && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Video Preview</h4>
              <div className="flex items-center space-x-3">
                <img 
                  src={videoPreview.thumbnail} 
                  alt="Video thumbnail"
                  className="w-24 h-18 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Video ID: {videoPreview.id}</p>
                  <div className="flex items-center mt-1">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Valid YouTube URL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
                maxLength: { value: 100, message: 'Title must be less than 100 characters' }
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter a descriptive title for the video"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description', {
                maxLength: { value: 500, message: 'Description must be less than 500 characters' }
              })}
              rows={4}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Describe what children will learn from this video..."
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category_id', {
                required: 'Please select a category',
                valueAsNumber: true
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                errors.category_id ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.category_id.message}
              </p>
            )}
          </div>

          {/* Age Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age Rating *
            </label>
            <select
              {...register('age_rating', {
                required: 'Please select an age rating'
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                errors.age_rating ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select age rating...</option>
              <option value="G">G - General Audiences (All Ages)</option>
              <option value="PG">PG - Parental Guidance (Ages 6+)</option>
              <option value="PG-13">PG-13 - Parents Strongly Cautioned (Ages 13+)</option>
            </select>
            {errors.age_rating && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.age_rating.message}
              </p>
            )}
          </div>

          {/* Safety Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <h4 className="font-semibold mb-1">Content Safety</h4>
                <p>
                  All YouTube videos are automatically checked for child-appropriate content. 
                  Only educational and safe content will be approved for the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Adding Video...</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-5 w-5" />
                <span>Add YouTube Video</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default YouTubeUpload;