import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ now valid
import { ToastProvider } from '../context/ToastContext';

export default function MainLayout({ children }) {
    const { user, logout } = useAuth(); // ✅ works

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="font-bold text-lg">UrbanLink</div>
                        {user?.name && <span className="text-sm text-gray-500 dark:text-gray-400">Hello, {user.name}</span>}
                    </div>
                    <nav className="flex items-center gap-3">
                        <Link to="/" className="text-sm hover:underline">
                            Dashboard
                        </Link>
                        <Link to="/request" className="text-sm hover:underline">
                            Request Ride
                        </Link>
                        <Link to="/rides" className="text-sm hover:underline">
                            My Rides
                        </Link>
                        <Link to="/payments" className="text-sm hover:underline">
                            Payments
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Logout
                        </button>
                    </nav>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </ToastProvider>
    );
}