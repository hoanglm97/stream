import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  VideoCameraIcon,
  EyeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import VideoCard from '../components/VideoCard';

const Profile = () => {
  const { user, isParent } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // In a real implementation, you'd have endpoints for user's videos and watch history
      // For now, we'll simulate with the general videos endpoint
      const videosResponse = await axios.get('/videos');
      setUploadedVideos(videosResponse.data.slice(0, 4)); // Simulate user's videos
      setWatchHistory(videosResponse.data.slice(0, 6)); // Simulate watch history
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    videosUploaded: uploadedVideos.length,
    totalViews: uploadedVideos.reduce((sum, video) => sum + (video.view_count || 0), 0),
    videosWatched: watchHistory.length,
    joinDate: new Date().toLocaleDateString() // Simulate join date
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'videos', label: 'My Videos', icon: VideoCameraIcon },
    { id: 'history', label: 'Watch History', icon: EyeIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-white">Loading profile... 👤</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-8">
        <div className="flex items-center space-x-6">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-6 rounded-2xl">
            <UserIcon className="h-16 w-16 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {user?.username || 'User'}
              </h1>
              {isParent && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Parent
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">{user?.email}</p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isParent && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{stats.videosUploaded}</div>
                    <div className="text-sm text-gray-600">Videos Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{stats.totalViews}</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.videosWatched}</div>
                <div className="text-sm text-gray-600">Videos Watched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  <CalendarIcon className="h-6 w-6 inline" />
                </div>
                <div className="text-sm text-gray-600">Joined {stats.joinDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome back! 👋</h2>
                <p className="text-gray-600 leading-relaxed">
                  {isParent 
                    ? "As a parent account, you can upload and manage educational content for children. Thank you for contributing to our safe learning community!"
                    : "Enjoy watching safe, educational, and fun videos curated especially for children. Happy learning!"
                  }
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isParent && (
                    <button className="card p-6 text-center hover:bg-primary-50 transition-colors duration-200">
                      <VideoCameraIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-800">Upload Video</h4>
                      <p className="text-sm text-gray-600">Share educational content</p>
                    </button>
                  )}
                  
                  <button className="card p-6 text-center hover:bg-primary-50 transition-colors duration-200">
                    <EyeIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800">Browse Videos</h4>
                    <p className="text-sm text-gray-600">Discover new content</p>
                  </button>
                  
                  <button className="card p-6 text-center hover:bg-primary-50 transition-colors duration-200">
                    <HeartIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800">View Favorites</h4>
                    <p className="text-sm text-gray-600">Your liked videos</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Uploaded Videos</h2>
                {isParent && (
                  <button className="btn-primary">
                    Upload New Video
                  </button>
                )}
              </div>

              {!isParent ? (
                <div className="text-center py-12">
                  <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Parent Account Required</h3>
                  <p className="text-gray-500">Only parent accounts can upload videos for child safety.</p>
                </div>
              ) : uploadedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No videos uploaded yet</h3>
                  <p className="text-gray-500">Start sharing educational content with children!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uploadedVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Watch History</h2>
              
              {watchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <EyeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No watch history yet</h3>
                  <p className="text-gray-500">Start watching videos to see your history here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {watchHistory.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Favorite Videos</h2>
              
              <div className="text-center py-12">
                <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
                <p className="text-gray-500">Like videos to add them to your favorites!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;