import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import FloatingActionButton from './components/FloatingActionButton';
import ParticleBackground from './components/ParticleBackground';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoPlayer from './pages/VideoPlayer';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import ProtectedRoute from './components/ProtectedRoute';

// New enhanced pages/components
import ParentalDashboard from './components/ParentalControls/ParentalDashboard';
import ContentModerationPanel from './components/Safety/ContentModerationPanel';
import ProgressTracker from './components/Learning/ProgressTracker';
import AvatarCustomizer from './components/Personalization/AvatarCustomizer';
import SmartRecommendations from './components/Personalization/SmartRecommendations';
import OfflineManager from './components/Advanced/OfflineManager';
import EnhancedVideoPlayer from './components/Enhanced/EnhancedVideoPlayer';

import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-500 relative">
            <ParticleBackground />
            <Navbar />
          <main className="container mx-auto px-4 py-8 pb-20 md:pb-8 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/video/:id" element={<VideoPlayer />} />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute parentOnly>
                    <Upload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/favorites" 
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                } 
              />
              
              {/* Enhanced Features Routes */}
              <Route 
                path="/parental-dashboard" 
                element={
                  <ProtectedRoute parentOnly>
                    <ParentalDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/moderation" 
                element={
                  <ProtectedRoute adminOnly>
                    <ContentModerationPanel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute>
                    <ProgressTracker />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avatar" 
                element={
                  <ProtectedRoute>
                    <AvatarCustomizer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recommendations" 
                element={
                  <ProtectedRoute>
                    <SmartRecommendations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/offline" 
                element={
                  <ProtectedRoute>
                    <OfflineManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/enhanced-video/:id" 
                element={
                  <ProtectedRoute>
                    <EnhancedVideoPlayer />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <BottomTabBar />
          <FloatingActionButton />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderRadius: '16px',
                fontSize: '14px',
                fontFamily: 'Comic Neue, cursive',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '16px 20px'
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                }
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                }
              }
            }}
          />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;