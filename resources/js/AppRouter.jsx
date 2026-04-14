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
import EarningsPage from './pages/EarningsPage';
import VehicleProfilePage from './pages/VehicleProfilePage';
import RequestRidePage from './pages/RequestRidePage';
import RidesPage from './pages/RidesPage';
import PaymentsPage from './pages/PaymentsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import UsersManagementPage from './pages/UsersManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import RideDetailPage from './pages/RideDetailPage';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingPulse />;
    if (!user) return <Navigate to="/login" replace />;
    
    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) return <Navigate to="/" replace />;
    }
    
    return <MainLayout>{children}</MainLayout>;
};

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Main Switcher (Root Dashboard) */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <DashboardSwitcher />
                    </ProtectedRoute>
                } />

              <Route path="/rides/:id" element={
                    <ProtectedRoute>
                        <RideDetailPage />
                    </ProtectedRoute>
                } />
                
                {/* Driver Specific Sub-Routes */}
                <Route path="/driver/earnings" element={
                    <ProtectedRoute requiredRole="driver">
                        <EarningsPage />
                    </ProtectedRoute>
                } />
                <Route path="/driver/vehicle" element={
                    <ProtectedRoute requiredRole="driver">
                        <VehicleProfilePage />
                    </ProtectedRoute>
                } />

                {/* Citizen & Shared Routes */}
                <Route path="/rides/request" element={
                    <ProtectedRoute requiredRole="citizen">
                        <RequestRidePage />
                    </ProtectedRoute>
                } />
                <Route path="/rides" element={
                    <ProtectedRoute>
                        <RidesPage />
                    </ProtectedRoute>
                } />
                <Route path="/payments" element={
                    <ProtectedRoute>
                        <PaymentsPage />
                    </ProtectedRoute>
                } />
                <Route path="/applications" element={
                    <ProtectedRoute>
                        <ApplicationsPage />
                    </ProtectedRoute>
                } />

                {/* Admin Specific */}
                <Route path="/admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                        <UsersManagementPage />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
};

const DashboardSwitcher = () => {
    const { user } = useAuth();
    switch (user?.role) {
        case 'admin': return <AdminDashboard />;
        case 'driver': return <DriverDashboard />;
        case 'government_officer': return <OfficerDashboard />;
        default: return <CitizenDashboard />;
    }
};

export default AppRouter;