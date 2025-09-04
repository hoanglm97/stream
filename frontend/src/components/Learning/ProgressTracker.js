import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon,
  StarIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  FireIcon,
  HeartIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
  PlayIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarSolid,
  HeartIcon as HeartSolid,
  TrophyIcon as TrophySolid
} from '@heroicons/react/24/solid';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import axios from 'axios';

const ProgressTracker = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [progressData, setProgressData] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [learningPath, setLearningPath] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      const [progressRes, achievementsRes, statsRes, pathRes] = await Promise.all([
        axios.get(`/api/progress/${userId}`),
        axios.get(`/api/achievements/${userId}`),
        axios.get(`/api/stats/weekly/${userId}`),
        axios.get(`/api/learning-path/${userId}`)
      ]);

      setProgressData(progressRes.data);
      setAchievements(achievementsRes.data);
      setWeeklyStats(statsRes.data);
      setLearningPath(pathRes.data);
      setCurrentStreak(progressRes.data.currentStreak || 0);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      // Set sample data for demo
      setSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const setSampleData = () => {
    setProgressData({
      totalVideosWatched: 47,
      totalQuizzesTaken: 23,
      averageScore: 85,
      totalPoints: 1250,
      currentLevel: 8,
      currentStreak: 5,
      weeklyGoal: 10,
      weeklyProgress: 7,
      categories: {
        science: { watched: 12, total: 20, percentage: 60 },
        math: { watched: 8, total: 15, percentage: 53 },
        reading: { watched: 15, total: 18, percentage: 83 },
        art: { watched: 7, total: 12, percentage: 58 },
        music: { watched: 5, total: 8, percentage: 63 }
      }
    });

    setAchievements([
      { id: 1, name: 'First Steps', description: 'Watched your first video', icon: '👶', earned: true, date: '2024-01-10' },
      { id: 2, name: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: '🧠', earned: true, date: '2024-01-15' },
      { id: 3, name: 'Week Warrior', description: 'Maintained 7-day streak', icon: '🔥', earned: true, date: '2024-01-20' },
      { id: 4, name: 'Science Explorer', description: 'Completed Science series', icon: '🔬', earned: true, date: '2024-01-25' },
      { id: 5, name: 'Math Magician', description: 'Mastered 10 math concepts', icon: '🎯', earned: false, progress: 70 },
      { id: 6, name: 'Reading Champion', description: 'Read 25 stories', icon: '📚', earned: false, progress: 60 },
    ]);

    setWeeklyStats({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      videosWatched: [2, 3, 1, 4, 2, 5, 3],
      quizzesTaken: [1, 2, 0, 2, 1, 3, 2],
      timeSpent: [45, 60, 30, 75, 40, 90, 50] // minutes
    });

    setLearningPath([
      { id: 1, title: 'Colors & Shapes', completed: true, current: false, locked: false },
      { id: 2, title: 'Numbers 1-10', completed: true, current: false, locked: false },
      { id: 3, title: 'Animal Friends', completed: false, current: true, locked: false },
      { id: 4, title: 'Space Adventure', completed: false, current: false, locked: false },
      { id: 5, title: 'Ocean Exploration', completed: false, current: false, locked: true },
    ]);

    setCurrentStreak(5);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'achievements', label: 'Achievements', icon: TrophyIcon },
    { id: 'progress', label: 'Progress', icon: ArrowTrendingUpIcon },
    { id: 'path', label: 'Learning Path', icon: BookOpenIcon }
  ];

  const weeklyChartData = {
    labels: weeklyStats.labels || [],
    datasets: [
      {
        label: 'Videos Watched',
        data: weeklyStats.videosWatched || [],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: 'Quizzes Taken',
        data: weeklyStats.quizzesTaken || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(progressData.categories || {}),
    datasets: [
      {
        data: Object.values(progressData.categories || {}).map(cat => cat.percentage),
        backgroundColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
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
          font: { family: 'Comic Neue', size: 12 },
          color: '#374151',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { font: { family: 'Comic Neue' } }
      },
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { font: { family: 'Comic Neue' } }
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-lg border ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('-100', '-100')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border-', 'text-').replace('-100', '-600')}`} />
        </div>
      </div>
    </motion.div>
  );

  const AchievementBadge = ({ achievement, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
        achievement.earned 
          ? 'border-yellow-200 hover:shadow-xl' 
          : 'border-gray-200 opacity-75'
      }`}
    >
      <div className="text-center">
        <div className={`text-4xl mb-3 ${achievement.earned ? '' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <h3 className={`font-bold mb-2 ${achievement.earned ? 'text-gray-800' : 'text-gray-500'}`}>
          {achievement.name}
        </h3>
        <p className={`text-sm mb-3 ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
          {achievement.description}
        </p>
        
        {achievement.earned ? (
          <div className="flex items-center justify-center space-x-1 text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">
              Earned {new Date(achievement.date).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{achievement.progress}% complete</span>
          </div>
        )}
      </div>
      
      {achievement.earned && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <StarSolid className="h-3 w-3 text-yellow-800" />
          </div>
        </div>
      )}
    </motion.div>
  );

  const LearningPathItem = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
        item.current 
          ? 'bg-purple-100 border-2 border-purple-300' 
          : item.completed 
          ? 'bg-green-50 border-2 border-green-200' 
          : item.locked 
          ? 'bg-gray-50 border-2 border-gray-200 opacity-50' 
          : 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        item.current 
          ? 'bg-purple-600' 
          : item.completed 
          ? 'bg-green-600' 
          : item.locked 
          ? 'bg-gray-400' 
          : 'bg-blue-600'
      }`}>
        {item.completed ? (
          <CheckCircleIcon className="h-6 w-6 text-white" />
        ) : item.current ? (
          <PlayIcon className="h-6 w-6 text-white" />
        ) : item.locked ? (
          <LockClosedIcon className="h-6 w-6 text-white" />
        ) : (
          <BookOpenIcon className="h-6 w-6 text-white" />
        )}
      </div>
      
      <div className="flex-1">
        <h3 className={`font-semibold ${
          item.locked ? 'text-gray-400' : 'text-gray-800'
        }`}>
          {item.title}
        </h3>
        <p className={`text-sm ${
          item.current 
            ? 'text-purple-600' 
            : item.completed 
            ? 'text-green-600' 
            : item.locked 
            ? 'text-gray-400' 
            : 'text-blue-600'
        }`}>
          {item.current ? 'Currently Learning' : 
           item.completed ? 'Completed!' : 
           item.locked ? 'Locked' : 'Ready to Start'}
        </p>
      </div>
      
      {item.current && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-3 h-3 bg-purple-600 rounded-full"
        />
      )}
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Videos Watched"
          value={progressData.totalVideosWatched || 0}
          icon={PlayIcon}
          color="border-blue-100"
          subtitle="Keep exploring!"
        />
        <StatCard
          title="Quizzes Taken"
          value={progressData.totalQuizzesTaken || 0}
          icon={AcademicCapIcon}
          color="border-green-100"
          subtitle={`Avg: ${progressData.averageScore || 0}%`}
        />
        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          icon={FireIcon}
          color="border-orange-100"
          subtitle="Amazing consistency!"
        />
        <StatCard
          title="Total Points"
          value={progressData.totalPoints || 0}
          icon={TrophyIcon}
          color="border-yellow-100"
          subtitle={`Level ${progressData.currentLevel || 1}`}
        />
      </div>

      {/* Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Weekly Activity
          </h3>
          <Line data={weeklyChartData} options={chartOptions} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <PuzzlePieceIcon className="h-5 w-5 mr-2 text-blue-600" />
            Learning Categories
          </h3>
          <Doughnut data={categoryData} options={chartOptions} />
        </motion.div>
      </div>

      {/* Weekly Goal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-purple-600" />
            This Week's Goal
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {progressData.weeklyProgress || 0}/{progressData.weeklyGoal || 10}
            </div>
            <div className="text-sm text-gray-600">videos</div>
          </div>
        </div>
        
        <div className="w-full bg-white/50 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${((progressData.weeklyProgress || 0) / (progressData.weeklyGoal || 10)) * 100}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-700">
          {progressData.weeklyProgress >= progressData.weeklyGoal 
            ? "🎉 Congratulations! You've reached your weekly goal!" 
            : `${(progressData.weeklyGoal || 10) - (progressData.weeklyProgress || 0)} more videos to reach your goal!`}
        </p>
      </motion.div>
    </div>
  );

  const AchievementsTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <TrophySolid className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Achievements</h2>
        <p className="text-gray-600">
          {achievements.filter(a => a.earned).length} of {achievements.length} badges earned!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => (
          <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
        ))}
      </div>
    </div>
  );

  const LearningPathTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <BookOpenIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Learning Journey</h2>
        <p className="text-gray-600">Follow your personalized path to success!</p>
      </div>

      <div className="space-y-4">
        {learningPath.map((item, index) => (
          <LearningPathItem key={item.id} item={item} index={index} />
        ))}
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Learning Progress</h1>
        <p className="text-gray-600">Track your amazing learning journey!</p>
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
          {activeTab === 'achievements' && <AchievementsTab />}
          {activeTab === 'path' && <LearningPathTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProgressTracker;