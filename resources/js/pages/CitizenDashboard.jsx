import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CitizenDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [ridesRes, appsRes, servicesRes] = await Promise.all([
        axios.get('/api/rides?limit=5', { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get('/api/applications?limit=3', { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get('/api/services', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      setRecentRides(ridesRes.data.data || []);
      setApplications(appsRes.data.data || []);
      setAvailableServices(servicesRes.data.data || servicesRes.data || []);

      setStats({
        totalRides: ridesRes.data.total || ridesRes.data.data?.length || 0,
        totalApplications: appsRes.data.total || appsRes.data.data?.length || 0,
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
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center text-4xl shadow-inner">
                🏙️
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* ==================== PROFESSIONAL STATS SECTION ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Total Rides Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-10 border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🚗
                  </div>
                  <p className="text-blue-600 font-semibold uppercase tracking-widest text-sm">Mobility</p>
                </div>
                <p className="text-6xl font-black text-gray-900 mt-6 tracking-tighter">
                  {stats?.totalRides || 0}
                </p>
                <p className="text-xl text-gray-600 mt-1">Total Rides</p>
              </div>
              
              <div className="text-right">
                <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium">
                  <span>↑</span>
                  <span>12%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">This month</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100">
              <Link
                to="/rides"
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
              >
                View All Rides →
              </Link>
            </div>
          </div>

          {/* Applications Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 p-10 border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <p className="text-orange-600 font-semibold uppercase tracking-widest text-sm">Services</p>
                </div>
                <p className="text-6xl font-black text-gray-900 mt-6 tracking-tighter">
                  {stats?.totalApplications || 0}
                </p>
                <p className="text-xl text-gray-600 mt-1">Applications Filed</p>
              </div>
              
              <div className="text-right">
                <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium">
                  <span>↑</span>
                  <span>8%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">This month</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100">
              <Link
                to="/applications"
                className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
              >
                View All Applications →
              </Link>
            </div>
          </div>
        </div>

        {/* Rest of your components remain the same */}
        {/* Quick Actions, Available Services, Recent Activity... */}

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-lg p-10 mb-12 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-2xl">Get started</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Your existing Quick Action cards... */}
            <Link to="/rides/request" className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">🚗</div>
              <h3 className="font-semibold text-xl mb-1">Request Ride</h3>
              <p className="text-blue-100 text-sm">Book transportation</p>
            </Link>

            <Link to="/services" className="group bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">📋</div>
              <h3 className="font-semibold text-xl mb-1">Apply Services</h3>
              <p className="text-orange-100 text-sm">Government services</p>
            </Link>

            <Link to="/applications" className="group bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">✓</div>
              <h3 className="font-semibold text-xl mb-1">Check Status</h3>
              <p className="text-purple-100 text-sm">Review filings</p>
            </Link>

            <Link to="/profile" className="group bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">👤</div>
              <h3 className="font-semibold text-xl mb-1">My Profile</h3>
              <p className="text-green-100 text-sm">Manage account</p>
            </Link>
          </div>
        </div>

        {/* Available Services & Recent Activity sections remain unchanged */}
        {/* ... (your existing code for services and recent rides/applications) */}

      </div>
    </div>
  );
};

export default CitizenDashboard;