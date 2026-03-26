import React from 'react';
import axios from 'axios';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
axios.defaults.baseURL = API_BASE;

import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RequestRidePage from './pages/RequestRidePage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import RidesPage from './pages/RidesPage';
import RideDetailPage from './pages/RideDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Routes>
                                        <Route path="/" element={<DashboardPage />} />
                                        <Route path="/request" element={<RequestRidePage />} />
                                        <Route path="/driver" element={<DriverDashboardPage />} />
                                        <Route path="/rides/:id" element={<RideDetailPage />} />
                                        <Route path="/rides" element={<RidesPage />} />
                                        <Route path="/payments" element={<PaymentsPage />} />
                                        <Route path="*" element={<NotFoundPage />} />
                                    </Routes>
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

const container = document.getElementById('app');

if (container) {
    // Check if we already have a root instance attached to the window
    if (!window.reactRoot) {
        window.reactRoot = createRoot(container);
    }
    
    window.reactRoot.render(<App />);
}