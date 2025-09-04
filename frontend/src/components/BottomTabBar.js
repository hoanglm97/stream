import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  UserIcon, 
  PlusCircleIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';

const BottomTabBar = () => {
  const { isAuthenticated, isParent } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const tabs = [
    {
      name: 'Home',
      path: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      show: true
    },
    {
      name: 'Search',
      path: '/search',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      show: true
    },
    {
      name: 'Upload',
      path: '/upload',
      icon: PlusCircleIcon,
      iconSolid: PlusCircleIconSolid,
      show: isAuthenticated && isParent
    },
    {
      name: 'Favorites',
      path: '/favorites',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
      show: isAuthenticated
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
      show: isAuthenticated
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.show);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = active ? tab.iconSolid : tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                active 
                  ? 'text-primary-600 bg-primary-50 scale-110' 
                  : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${active ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;