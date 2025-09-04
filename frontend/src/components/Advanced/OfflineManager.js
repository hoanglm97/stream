import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowDownIcon,
  WifiIcon,
  SignalSlashIcon,
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  FolderIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid, CloudArrowDownIcon as DownloadSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const OfflineManager = ({ userId, onVideoSelect, onClose }) => {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageInfo, setStorageInfo] = useState({});
  const [downloadSettings, setDownloadSettings] = useState({
    quality: 'medium',
    autoDownload: false,
    downloadOnWifi: true,
    maxStorage: 1000 // MB
  });
  const [activeTab, setActiveTab] = useState('downloaded');
  const [showSettings, setShowSettings] = useState(false);

  const tabs = [
    { id: 'downloaded', label: 'Downloaded', icon: CheckCircleIcon },
    { id: 'queue', label: 'Queue', icon: ClockIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  const qualityOptions = [
    { id: 'low', label: 'Low (360p)', size: '~50MB', description: 'Great for saving space' },
    { id: 'medium', label: 'Medium (480p)', size: '~100MB', description: 'Good balance' },
    { id: 'high', label: 'High (720p)', size: '~200MB', description: 'Best quality' }
  ];

  useEffect(() => {
    fetchDownloadedVideos();
    fetchStorageInfo();
    fetchDownloadSettings();
    
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [userId]);

  const fetchDownloadedVideos = async () => {
    try {
      const response = await axios.get(`/api/offline/downloaded/${userId}`);
      setDownloadedVideos(response.data);
    } catch (error) {
      console.error('Error fetching downloaded videos:', error);
      // Set sample data for demo
      setDownloadedVideos([
        {
          id: 1,
          title: 'Ocean Animals Adventure',
          thumbnail: '/api/placeholder/200/120',
          duration: '8:45',
          size: 95.2,
          quality: 'medium',
          downloadDate: '2024-01-15T10:30:00Z',
          expiryDate: '2024-01-22T10:30:00Z',
          category: 'educational',
          progress: 100
        },
        {
          id: 2,
          title: 'Space Exploration Fun',
          thumbnail: '/api/placeholder/200/120',
          duration: '12:30',
          size: 180.5,
          quality: 'high',
          downloadDate: '2024-01-14T15:20:00Z',
          expiryDate: '2024-01-21T15:20:00Z',
          category: 'science',
          progress: 100
        }
      ]);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageInfo({
          used: Math.round((estimate.usage || 0) / 1024 / 1024), // MB
          available: Math.round((estimate.quota || 0) / 1024 / 1024), // MB
          usedByApp: downloadedVideos.reduce((total, video) => total + video.size, 0)
        });
      }
    } catch (error) {
      console.error('Error fetching storage info:', error);
      setStorageInfo({
        used: 450,
        available: 2000,
        usedByApp: 275.7
      });
    }
  };

  const fetchDownloadSettings = async () => {
    try {
      const response = await axios.get(`/api/user/${userId}/download-settings`);
      setDownloadSettings(response.data);
    } catch (error) {
      console.error('Error fetching download settings:', error);
    }
  };

  const downloadVideo = async (videoId, quality = downloadSettings.quality) => {
    try {
      const response = await axios.post('/api/offline/download', {
        videoId,
        userId,
        quality
      });
      
      // Add to queue
      const newDownload = {
        id: videoId,
        title: response.data.title,
        thumbnail: response.data.thumbnail,
        progress: 0,
        quality,
        estimatedSize: response.data.estimatedSize
      };
      
      setDownloadQueue(prev => [...prev, newDownload]);
      
      // Simulate download progress
      simulateDownloadProgress(videoId);
      
    } catch (error) {
      console.error('Error starting download:', error);
    }
  };

  const simulateDownloadProgress = (videoId) => {
    const interval = setInterval(() => {
      setDownloadQueue(prev => 
        prev.map(download => {
          if (download.id === videoId) {
            const newProgress = Math.min(download.progress + Math.random() * 15, 100);
            if (newProgress >= 100) {
              clearInterval(interval);
              // Move to downloaded
              setTimeout(() => {
                setDownloadQueue(prev => prev.filter(d => d.id !== videoId));
                fetchDownloadedVideos(); // Refresh downloaded list
              }, 1000);
            }
            return { ...download, progress: newProgress };
          }
          return download;
        })
      );
    }, 500);
  };

  const deleteDownload = async (videoId) => {
    try {
      await axios.delete(`/api/offline/download/${videoId}`);
      setDownloadedVideos(prev => prev.filter(video => video.id !== videoId));
      fetchStorageInfo(); // Update storage info
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  const cancelDownload = (videoId) => {
    setDownloadQueue(prev => prev.filter(download => download.id !== videoId));
  };

  const updateSettings = async (newSettings) => {
    try {
      await axios.put(`/api/user/${userId}/download-settings`, newSettings);
      setDownloadSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const clearExpiredVideos = () => {
    const now = new Date();
    const expiredVideos = downloadedVideos.filter(video => 
      new Date(video.expiryDate) < now
    );
    
    expiredVideos.forEach(video => deleteDownload(video.id));
  };

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB < 1) return `${Math.round(sizeInMB * 1024)} KB`;
    if (sizeInMB < 1024) return `${Math.round(sizeInMB)} MB`;
    return `${Math.round(sizeInMB / 1024 * 10) / 10} GB`;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStoragePercentage = () => {
    if (!storageInfo.available) return 0;
    return Math.round((storageInfo.usedByApp / storageInfo.available) * 100);
  };

  const VideoCard = ({ video, isDownloaded = true }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex space-x-4">
        <div className="relative">
          <img 
            src={video.thumbnail}
            alt={video.title}
            className="w-24 h-16 rounded-lg object-cover"
          />
          {isDownloaded && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckSolid className="h-3 w-3 text-white" />
            </div>
          )}
          {!isDownloaded && video.progress < 100 && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-xs font-bold">
                {Math.round(video.progress)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
            <span>{video.duration}</span>
            <span>{formatFileSize(video.size || video.estimatedSize)}</span>
            <span className="capitalize">{video.quality}</span>
          </div>
          
          {isDownloaded && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Expires in {getDaysUntilExpiry(video.expiryDate)} days
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onVideoSelect?.(video)}
                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteDownload(video.id)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {!isDownloaded && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${video.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Downloading... {Math.round(video.progress)}%
                </span>
                <button
                  onClick={() => cancelDownload(video.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const DownloadedTab = () => (
    <div className="space-y-6">
      {/* Storage Info */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <FolderIcon className="h-5 w-5 mr-2" />
            Storage Usage
          </h3>
          <button
            onClick={clearExpiredVideos}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            Clean Up
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Used by downloads: {formatFileSize(storageInfo.usedByApp)}</span>
            <span>{getStoragePercentage()}% of available space</span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getStoragePercentage()}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {formatFileSize(storageInfo.available - storageInfo.used)} available
          </div>
        </div>
      </div>

      {/* Downloaded Videos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            Downloaded Videos ({downloadedVideos.length})
          </h3>
          {!isOnline && (
            <div className="flex items-center space-x-2 text-orange-600">
              <SignalSlashIcon className="h-4 w-4" />
              <span className="text-sm">Offline Mode</span>
            </div>
          )}
        </div>
        
        {downloadedVideos.length > 0 ? (
          <div className="space-y-4">
            {downloadedVideos.map(video => (
              <VideoCard key={video.id} video={video} isDownloaded={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CloudArrowDownIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Downloads Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Download videos to watch them offline!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const QueueTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          Download Queue ({downloadQueue.length})
        </h3>
        {!isOnline && (
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Paused - No Internet</span>
          </div>
        )}
      </div>
      
      {downloadQueue.length > 0 ? (
        <div className="space-y-4">
          {downloadQueue.map(video => (
            <VideoCard key={video.id} video={video} isDownloaded={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Downloads in Queue
          </h3>
          <p className="text-gray-500">
            Add videos to your download queue from the video player
          </p>
        </div>
      )}
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Download Quality</h3>
        <div className="space-y-3">
          {qualityOptions.map(option => (
            <button
              key={option.id}
              onClick={() => updateSettings({ ...downloadSettings, quality: option.id })}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                downloadSettings.quality === option.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {option.size}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Download Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-800">Auto-download favorites</div>
              <div className="text-sm text-gray-600">Automatically download videos you favorite</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSettings.autoDownload}
                onChange={(e) => updateSettings({ ...downloadSettings, autoDownload: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-800">Download on Wi-Fi only</div>
              <div className="text-sm text-gray-600">Avoid using mobile data</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSettings.downloadOnWifi}
                onChange={(e) => updateSettings({ ...downloadSettings, downloadOnWifi: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Storage Limit</h3>
        <div className="space-y-3">
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={downloadSettings.maxStorage}
            onChange={(e) => updateSettings({ ...downloadSettings, maxStorage: parseInt(e.target.value) })}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>100 MB</span>
            <span className="font-semibold">{formatFileSize(downloadSettings.maxStorage)}</span>
            <span>5 GB</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-purple-100 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <CloudArrowDownIcon className="h-8 w-8 mr-3 text-purple-600" />
                Offline Manager
              </h1>
              <p className="text-gray-600">Download videos to watch anytime, anywhere!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? (
                  <WifiIcon className="h-4 w-4" />
                ) : (
                  <SignalSlashIcon className="h-4 w-4" />
                )}
                <span className="font-semibold">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-lg transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl p-2 shadow-lg mb-8">
            <div className="flex space-x-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'downloaded' && <DownloadedTab />}
              {activeTab === 'queue' && <QueueTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OfflineManager;