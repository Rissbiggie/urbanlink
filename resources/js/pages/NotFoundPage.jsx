import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';

    switch (user.role) {
      case 'citizen':
        return '/dashboard';
      case 'driver':
        return '/driver/dashboard';
      case 'government_officer':
        return '/officer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl mb-4">😵</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to={getDashboardLink()}
            className="block w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
