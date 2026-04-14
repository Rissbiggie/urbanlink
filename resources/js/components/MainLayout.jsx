import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

export default function MainLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    // 1. Define Navigation Config based on Roles
    const navConfig = {
        citizen: [
            { label: 'Dashboard', path: '/' },
            { label: 'Book a Ride', path: '/rides/request' },
            { label: 'My History', path: '/rides' },
            { label: 'Payments', path: '/payments' },
        ],
        driver: [
            { label: 'Active Jobs', path: '/' },
            { label: 'Earnings', path: '/payments' },
            { label: 'Vehicle Profile', path: '/driver/profile' },
        ],
        government_officer: [
            { label: 'Compliances', path: '/' },
            { label: 'Applications', path: '/applications' },
        ],
        admin: [
            { label: 'System Stats', path: '/' },
            { label: 'User Management', path: '/admin/users' },
            { label: 'Global Rides', path: '/rides' },
        ],
    };

    // Fallback to citizen links if role is missing or unrecognized
    const role = user?.role?.toLowerCase() || 'citizen';
    const menuItems = navConfig[role] || navConfig.citizen;

    return (
        <ToastProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
                {/* Dynamic Header */}
                <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="font-black italic text-xl tracking-tighter">URBANLINK.</h1>
                        <div className="hidden md:block h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        {/* Dynamic Role Badge */}
                        <span className="hidden md:inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {role.replace('_', ' ')}
                        </span>
                    </div>

                    <nav className="flex items-center gap-6">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    location.pathname === item.path 
                                    ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-1' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        
                        <button
                            type="button"
                            onClick={logout}
                            className="text-[11px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors pl-4 border-l border-slate-200 dark:border-slate-800"
                        >
                            Logout
                        </button>
                    </nav>
                </header>

                {/* Main Content Area */}
              <main className="flex-1 w-full p-4 md:p-6 lg:p-10">
    {/* Optional: Keep the greeting aligned but the container fluid */}
    <div className="mb-6">
        <h2 className="text-sm font-medium text-slate-500">
            Welcome back, <span className="text-slate-900 dark:text-white font-bold">{user?.name}</span>
        </h2>
    </div>
    
    {/* This will now span the full width of the viewport */}
    <div className="w-full">
        {children}
    </div>
</main>

                {/* Optional Footer */}
                <footer className="p-6 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest border-t border-slate-200 dark:border-slate-800">
                    UrbanLink Infrastructure &copy; 2026
                </footer>
            </div>
        </ToastProvider>
    );
}