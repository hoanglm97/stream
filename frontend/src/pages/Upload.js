import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { 
  CloudArrowUpIcon, 
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import YouTubeUpload from '../components/YouTubeUpload';

const Upload = () => {
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'youtube'

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a video file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a video file');
        e.target.value = '';
      }
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category_id', data.category_id);
    formData.append('age_rating', data.age_rating);

    try {
      const response = await axios.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      toast.success('Video uploaded successfully! 🎉');
      reset();
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      const message = error.response?.data?.detail || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-4">
          <VideoCameraIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Add Content</h1>
        <p className="text-white/80">Share safe, educational content for children</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-lg">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'file'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <CloudArrowUpIcon className="h-5 w-5" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'youtube'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              <LinkIcon className="h-5 w-5" />
              <span>Add YouTube</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'youtube' ? (
        <YouTubeUpload />
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* File Upload Area */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Video File
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-primary-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {selectedFile ? (
                <div className="space-y-4">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Drag and drop your video here
                    </p>
                    <p className="text-gray-600">or click to browse files</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supports MP4, AVI, MOV, and other video formats
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Video Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="input-field"
                placeholder="Enter a fun, descriptive title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('category_id', { required: 'Please select a category' })}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
            </div>

            {/* Age Rating */}
            <div>
              <label htmlFor="age_rating" className="block text-sm font-medium text-gray-700 mb-2">
                Age Rating *
              </label>
              <select
                {...register('age_rating', { required: 'Please select an age rating' })}
                className="input-field"
              >
                <option value="">Select age rating</option>
                <option value="G">G - General Audience</option>
                <option value="PG">PG - Parental Guidance Suggested</option>
                <option value="PG-13">PG-13 - Ages 13 and up</option>
              </select>
              {errors.age_rating && <p className="text-red-500 text-sm mt-1">{errors.age_rating.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe what children will learn or enjoy from this video..."
              />
            </div>
          </div>

          {/* Content Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Content Guidelines</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Content must be appropriate for children</li>
                  <li>• No violence, scary content, or inappropriate language</li>
                  <li>• Educational and entertaining content is encouraged</li>
                  <li>• All uploads are reviewed before being published</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">Uploading...</span>
                <span className="text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="spinner mr-3"></div>
                  Uploading... ({uploadProgress}%)
                </div>
              ) : (
                'Upload Video 🚀'
              )}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
};

export default Upload;