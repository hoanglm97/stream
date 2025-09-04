import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isParent } = useAuth();

  const toggleFAB = () => setIsOpen(!isOpen);

  const fabItems = [
    {
      icon: CloudArrowUpIcon,
      label: 'Upload Video',
      path: '/upload',
      color: 'bg-blue-500 hover:bg-blue-600',
      show: isAuthenticated && isParent
    },
    {
      icon: HeartIcon,
      label: 'Favorites',
      path: '/favorites',
      color: 'bg-red-500 hover:bg-red-600',
      show: isAuthenticated
    },
    {
      icon: MagnifyingGlassIcon,
      label: 'Search',
      path: '/search',
      color: 'bg-green-500 hover:bg-green-600',
      show: true
    },
    {
      icon: UserIcon,
      label: 'Profile',
      path: '/profile',
      color: 'bg-purple-500 hover:bg-purple-600',
      show: isAuthenticated
    }
  ];

  const visibleItems = fabItems.filter(item => item.show);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
      {/* FAB Items */}
      <div className={`flex flex-col space-y-3 mb-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center ${item.color} text-white p-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110 animate-float`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Icon className="h-6 w-6" />
              <span className="ml-3 whitespace-nowrap bg-gray-800 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-full mr-3">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={toggleFAB}
        className={`bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white p-4 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        } animate-float`}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <PlusIcon className="h-6 w-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;