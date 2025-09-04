import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, parentOnly = false }) => {
  const { isAuthenticated, isParent, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (parentOnly && !isParent) {
    return (
      <div className="text-center py-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Parent Access Only</h2>
          <p className="text-gray-600">
            This feature is only available to parent accounts for child safety.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;