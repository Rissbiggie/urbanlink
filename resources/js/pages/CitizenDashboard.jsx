import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CitizenDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableServices, setAvailableServices] = useState([]); // ← Added
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent rides
      const ridesRes = await axios.get('/api/rides?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecentRides(ridesRes.data.data || []);

      // Fetch applications
      const appsRes = await axios.get('/api/applications?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplications(appsRes.data.data || []);

      // Fetch available services for dashboard preview
      const servicesRes = await axios.get('/api/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAvailableServices(servicesRes.data.data || servicesRes.data || []);

      //Calculate stats from data
      setStats({
        totalRides: ridesRes.data.total || 0,
        totalSpent: ridesRes.data.data?.reduce((sum, ride) => sum + (ride.final_fare || 0), 0) || 0,
        totalApplications: appsRes.data.total || 0,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Your gateway to seamless transportation and government services
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">🏙️</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Rides */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Rides</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">{stats?.totalRides || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Your journeys</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Spent</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">KES {stats?.totalSpent?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500 mt-1">On transportation</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Government Applications */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Applications</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">{stats?.totalApplications || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Government services</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Unchanged */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Get started</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/rides/request"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Request Ride</h3>
              <p className="text-blue-100 text-sm">Book transportation</p>
            </Link>
            <Link
              to="/services"
              className="group bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Apply Services</h3>
              <p className="text-orange-100 text-sm">View service listing</p>
            </Link>
            <Link
              to="/applications"
              className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Check Status</h3>
              <p className="text-purple-100 text-sm">Review your filings</p>
            </Link>
            <Link
              to="/profile"
              className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">My Profile</h3>
              <p className="text-green-100 text-sm">Manage account</p>
            </Link>
          </div>
        </div>

        {/* NEW: Available Services Preview */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Services</h2>
            <Link to="/services" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center">
              View All Services →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableServices.length > 0 ? (
              availableServices.slice(0, 6).map(service => (
                <Link
                  key={service.id}
                  to={`/services/apply/${service.id}`}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {service.description || "Official government service application"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-3 bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <p className="text-gray-400">No services available at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Grid - Unchanged */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Rides */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Recent Rides</h2>
              <Link
                to="/rides"
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center"
              >
                View All
                <span className="ml-1">→</span>
              </Link>
            </div>
            {recentRides.length > 0 ? (
              <div className="space-y-4">
                {recentRides.map(ride => (
                  <Link
                    key={ride.id}
                    to={`/rides/${ride.id}`}
                    className="group flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-lg">🚗</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {ride.pickup_address} → {ride.dropoff_address}
                      </p>
                      <p className="text-sm text-gray-600">{new Date(ride.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">KES {ride.final_fare || ride.estimated_fare}</p>
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                        ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                        ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚗</span>
                </div>
                <p className="text-gray-500 mb-4">No rides yet</p>
                <Link
                  to="/rides/request"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <span className="mr-2">🚀</span>
                  Request Your First Ride
                </Link>
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
              <Link
                to="/applications"
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center"
              >
                View All
                <span className="ml-1">→</span>
              </Link>
            </div>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map(app => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="group flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-lg">📋</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {app.application_reference || `REF-${app.id}`}
                      </p>
                      <p className="text-sm text-gray-600">{new Date(app.submitted_at || app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-gray-500 mb-4">No applications yet</p>
                <Link
                  to="/services"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <span className="mr-2">🚀</span>
                  Start Your First Application
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;