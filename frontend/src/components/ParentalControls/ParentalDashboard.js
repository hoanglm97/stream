import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  EyeIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const ParentalDashboard = ({ childId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [watchingData, setWatchingData] = useState({});
  const [screenTime, setScreenTime] = useState({});
  const [contentReport, setContentReport] = useState({});
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [childId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [watchingRes, screenTimeRes, contentRes, settingsRes] = await Promise.all([
        axios.get(`/api/parental/watching-activity/${childId}`),
        axios.get(`/api/parental/screen-time/${childId}`),
        axios.get(`/api/parental/content-report/${childId}`),
        axios.get(`/api/parental/settings/${childId}`)
      ]);

      setWatchingData(watchingRes.data);
      setScreenTime(screenTimeRes.data);
      setContentReport(contentRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChildAccess = async () => {
    try {
      const response = await axios.post(`/api/parental/toggle-access/${childId}`);
      setSettings(prev => ({ ...prev, isBlocked: response.data.isBlocked }));
    } catch (error) {
      console.error('Error toggling access:', error);
    }
  };

  const screenTimeChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Screen Time (hours)',
        data: screenTime.weeklyData || [2, 3, 1.5, 2.5, 3.5, 4, 3],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  const contentCategoryData = {
    labels: ['Educational', 'Entertainment', 'Music', 'Sports', 'Art'],
    datasets: [
      {
        data: contentReport.categoryBreakdown || [35, 25, 20, 15, 5],
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Comic Neue',
            size: 12
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        cornerRadius: 8,
        font: {
          family: 'Comic Neue'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Comic Neue'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Comic Neue'
          }
        }
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'screen-time', label: 'Screen Time', icon: ClockIcon },
    { id: 'content', label: 'Content', icon: EyeIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Today's Screen Time</p>
            <p className="text-2xl font-bold text-purple-600">{screenTime.today || '2h 15m'}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-xl">
            <ClockIcon className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-green-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Videos Watched</p>
            <p className="text-2xl font-bold text-green-600">{watchingData.todayCount || 8}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <PlayIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Educational %</p>
            <p className="text-2xl font-bold text-blue-600">{contentReport.educationalPercentage || 65}%</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Safety Score</p>
            <p className="text-2xl font-bold text-orange-600">{contentReport.safetyScore || 98}/100</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-8">
      <QuickStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
            Weekly Screen Time
          </h3>
          <Line data={screenTimeChartData} options={chartOptions} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <EyeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Content Categories
          </h3>
          <Doughnut data={contentCategoryData} options={chartOptions} />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {(watchingData.recentVideos || []).slice(0, 5).map((video, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <img 
                src={video.thumbnail || '/api/placeholder/60/40'} 
                alt={video.title}
                className="w-15 h-10 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{video.title}</h4>
                <p className="text-sm text-gray-600">{video.duration} • {video.category}</p>
              </div>
              <span className="text-xs text-gray-500">{video.watchedAt}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const ScreenTimeTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Screen Time Management</h3>
          <button
            onClick={toggleChildAccess}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
              settings.isBlocked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {settings.isBlocked ? (
              <>
                <LockClosedIcon className="h-4 w-4 inline mr-2" />
                Blocked
              </>
            ) : (
              <>
                <LockOpenIcon className="h-4 w-4 inline mr-2" />
                Active
              </>
            )}
          </button>
        </div>
        
        <Line data={screenTimeChartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="font-bold text-gray-800 mb-4">Daily Limits</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekday Limit</label>
              <input 
                type="range" 
                min="30" 
                max="240" 
                value={settings.weekdayLimit || 120}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600">{Math.floor((settings.weekdayLimit || 120) / 60)}h {(settings.weekdayLimit || 120) % 60}m</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekend Limit</label>
              <input 
                type="range" 
                min="30" 
                max="360" 
                value={settings.weekendLimit || 180}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600">{Math.floor((settings.weekendLimit || 180) / 60)}h {(settings.weekendLimit || 180) % 60}m</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="font-bold text-gray-800 mb-4">Time Schedule</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Morning (6AM - 12PM)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Afternoon (12PM - 6PM)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Evening (6PM - 9PM)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Parental Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your child's viewing experience</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-2 shadow-lg">
        {tabs.map((tab) => (
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

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'screen-time' && <ScreenTimeTab />}
          {activeTab === 'content' && <div>Content tab content...</div>}
          {activeTab === 'settings' && <div>Settings tab content...</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ParentalDashboard;