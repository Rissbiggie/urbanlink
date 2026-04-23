import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

/**
 * MAIN LAYOUT COMPONENT
 * Implements a high-contrast white theme and full-width fluid layout.
 */
export default function MainLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    // 1. Navigation Configuration
    // Paths are explicitly set to match the routes in AppRouter.jsx
    const navConfig = {
        citizen: [
            { label: 'Dashboard', path: '/' },
            { label: 'Book a Ride', path: '/rides/request' },
            { label: 'My Ride  History', path: '/rides' },
            { label: 'Payments', path: '/payments' },
            { label: 'services', path: '/services' },
            { label: 'My Applications', path: '/applications' },
            
        ],
        driver: [
            { label: 'Dashboard', path: '/' },
          //  { label: 'Earnings', path: '/driver/earnings' },
            { label: 'Vehicle Profile', path: '/driver/vehicle' },
        ],
        government_officer: [
            { label: 'Compliances', path: '/' },
            { label: 'Applications', path: '/applications' },
            { label: 'services', path: '/services' },
        ],
        admin: [
            { label: 'System Stats', path: '/' },
            { label: 'User Management', path: '/admin/users' },
             { label: 'services', path: '/services' },
              //{ label: ' Applications', path: '/applications' },
            { label: 'Global Rides', path: '/globalrides' },
        ],
    };

    const role = user?.role?.toLowerCase() || 'citizen';
    const menuItems = navConfig[role] || navConfig.citizen;

    return (
        <ToastProvider>
            {/* The Main Container: Switched to a premium off-white background */}
            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
                
                {/* HEADER: Pure white with a subtle shadow and full-width padding */}
                <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-8 md:px-16 py-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="font-black italic text-xl tracking-tighter text-slate-900">URBANLINK.</h1>
                        <div className="hidden md:block h-6 w-[1px] bg-slate-200 mx-2"></div>
                        
                        {/* Dynamic Role Badge */}
                        <span className="hidden md:inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {role.replace('_', ' ')}
                        </span>
                    </div>

                    <nav className="flex items-center gap-6">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                                    location.pathname === item.path 
                                    ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        
                        {/* Logout Section */}
                        <button
                            type="button"
                            onClick={logout}
                            className="text-[11px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors pl-4 border-l border-slate-200"
                        >
                            Logout
                        </button>
                    </nav>
                </header>

                {/* MAIN CONTENT AREA: 
                    - Removed max-width constraints to allow edge-to-edge growth.
                    - Standardized padding ensures content is balanced on white background.
                */}
                <main className="flex-1 w-full px-8 md:px-16 lg:px-20 py-10">
                    
                    {/* Greeting Header */}
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Registry Session: <span className="text-slate-900 font-black tracking-tight">{user?.name}</span>
                        </h2>
                    </div>
                    
                    {/* Page Content Injection */}
                    <div className="w-full">
                        {children}
                    </div>
                </main>

                {/* FOOTER: Fixed to white background and standardized padding */}
                <footer className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 bg-white">
                    UrbanLink Infrastructure &copy; 2026 • National Digital Registry
                </footer>
            </div>
        </ToastProvider>
    );
}