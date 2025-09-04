import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-400'
      } ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle track */}
      <div className="absolute inset-0 rounded-full shadow-inner"></div>
      
      {/* Toggle thumb */}
      <div
        className={`relative w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center ${
          isDarkMode ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {isDarkMode ? (
          <MoonIcon className="w-3 h-3 text-purple-600 animate-pulse" />
        ) : (
          <SunIcon className="w-3 h-3 text-yellow-600 animate-spin" />
        )}
      </div>
      
      {/* Background icons */}
      <SunIcon className={`absolute left-1 w-3 h-3 text-white transition-opacity duration-300 ${
        isDarkMode ? 'opacity-50' : 'opacity-100'
      }`} />
      <MoonIcon className={`absolute right-1 w-3 h-3 text-white transition-opacity duration-300 ${
        isDarkMode ? 'opacity-100' : 'opacity-50'
      }`} />
    </button>
  );
};

export default ThemeToggle;