import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './components/MainLayout';
import LoadingPulse from './components/LoadingPulse';

// Page Imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import RequestRidePage from './pages/RequestRidePage';
import RidesPage from './pages/RidesPage';
import RideDetailPage from './pages/RideDetailPage';
import ActiveTripPage from './pages/ActiveTripPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import NewApplicationPage from './pages/NewApplicationPage';
import CompliancePage from './pages/CompliancePage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import DriverProfilePage from './pages/DriverProfilePage';
import UsersManagementPage from './pages/UsersManagementPage';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingPulse />;
    if (!user) return <Navigate to="/login" replace />;

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const userRole = user.role?.toLowerCase();
        if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return <MainLayout>{children}</MainLayout>;
};

const DashboardResolver = () => {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingPulse />;
    if (!user) return <Navigate to="/login" replace />;

    const role = user.role?.toLowerCase();
    console.log("UrbanLink Resolver - Active Role:", role);

    switch (role) {
        case 'admin': return <AdminDashboard />;
        case 'driver': return <DriverDashboard />;
        case 'government_officer':
        case 'officer': return <OfficerDashboard />;
        default: return <CitizenDashboard />;
    }
};

const AppRouter = () => {
    const { user, loading } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!loading && user ? <Navigate to="/" replace /> : <LoginPage />} />
                <Route path="/register" element={!loading && user ? <Navigate to="/" replace /> : <RegisterPage />} />

                <Route path="/" element={<ProtectedRoute><DashboardResolver /></ProtectedRoute>} />

                {/* Transit */}
                <Route path="/rides" element={<ProtectedRoute requiredRole={['citizen', 'driver', 'admin']}><RidesPage /></ProtectedRoute>} />
                <Route path="/rides/request" element={<ProtectedRoute requiredRole="citizen"><RequestRidePage /></ProtectedRoute>} />
                <Route path="/rides/:id" element={<ProtectedRoute><RideDetailPage /></ProtectedRoute>} />
                <Route path="/rides/:id/active" element={<ProtectedRoute requiredRole={['citizen', 'driver']}><ActiveTripPage /></ProtectedRoute>} />

                {/* Governance */}
                <Route path="/applications" element={<ProtectedRoute requiredRole={['citizen', 'government_officer', 'admin']}><ApplicationsPage /></ProtectedRoute>} />
                <Route path="/applications/new" element={<ProtectedRoute requiredRole="citizen"><NewApplicationPage /></ProtectedRoute>} />
                <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />
                <Route path="/compliance" element={<ProtectedRoute requiredRole="citizen"><CompliancePage /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute requiredRole="citizen"><PaymentsPage /></ProtectedRoute>} />

                {/* Account */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/driver/profile" element={<ProtectedRoute requiredRole="driver"><DriverProfilePage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersManagementPage /></ProtectedRoute>} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;