import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { isAuthenticated, isParent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-xl">
              <PlayIcon className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              KidsStream
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Link>

            {isAuthenticated ? (
              <>
                {isParent && (
                  <Link 
                    to="/upload" 
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span className="font-medium">Upload</span>
                  </Link>
                )}
                
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-primary-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;