import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { getEcho } from '../services/broadcast';
import { rideAPI, applicationAPI } from '../api'; // ✅ Using Registry
import toast, { Toaster } from 'react-hot-toast';

// Leaflet CSS and Icon Fix
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', 
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// --- SUB-COMPONENTS ---

const StatusTicker = ({ activeRide, applicationUpdate }) => {
    if (!activeRide && !applicationUpdate) return null;
    return (
        <div className="bg-slate-900 overflow-hidden border-b border-white/10 sticky top-0 z-[2000]">
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-6">
                <div className="bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded text-white animate-pulse shrink-0">
                    Live Update
                </div>
                <div className="flex-1 overflow-hidden whitespace-nowrap">
                    <p className="inline-block text-slate-300 text-[11px] font-bold uppercase tracking-widest animate-marquee">
                        {activeRide && (
                            <span className="mr-12">
                                🚕 Trip Update: {activeRide.status_message || `Driver is ${activeRide.eta || 'nearby'}`} • {activeRide.vehicle_plate}
                            </span>
                        )}
                        {applicationUpdate && (
                            <span>
                                📋 Filing Status: {applicationUpdate.service_name} is now "{applicationUpdate.status}"
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => { if (position) map.setView(position, 15); }, [map, position]);
    return null;
}

const MetricCard = ({ label, value, unit, icon }) => (
    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
            <div className="flex items-baseline gap-2 mt-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {typeof value === 'number' ? value.toLocaleString() : value || 0}
                </h2>
                <span className="text-xs font-bold text-slate-400">{unit}</span>
            </div>
        </div>
        <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:scale-110 transition-transform grayscale">{icon}</div>
    </div>
);

// --- MAIN PAGE ---

const CitizenDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0, totalApplications: 0 });
    const [recentRides, setRecentRides] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Real-time states
    const [activeRide, setActiveRide] = useState(null);
    const [latestUpdate, setLatestUpdate] = useState(null);

    /**
     * Data Fetching using API Registry
     */
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [ridesRes, appsRes] = await Promise.all([
                rideAPI.list({ limit: 5 }),
                applicationAPI.list({ limit: 3 })
            ]);

            const ridesData = ridesRes.data.data || [];
            const appsData = appsRes.data.data || [];

            setRecentRides(ridesData);
            setApplications(appsData);
            setStats({
                totalRides: ridesRes.data.meta?.total || ridesData.length,
                totalSpent: ridesData.reduce((sum, r) => sum + (Number(r.final_fare) || 0), 0),
                totalApplications: appsRes.data.meta?.total || appsData.length,
            });

            // Check if there's an ongoing ride in the list
            const ongoing = ridesData.find(r => ['accepted', 'in_progress'].includes(r.status));
            if (ongoing) {
                setActiveRide({
                    driver_name: ongoing.driver?.name || "Searching...",
                    vehicle_plate: ongoing.driver?.vehicle?.plate_number || "---",
                    coords: ongoing.driver?.lat ? [ongoing.driver.lat, ongoing.driver.lng] : [-1.286, 36.817],
                    eta: "Calculating..."
                });
            }
        } catch (err) {
            toast.error("Cloud synchronization failed.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    /**
     * Real-time Broadcast Listeners
     */
    useEffect(() => {
        const echo = getEcho();
        if (!echo || !user?.id) return;

        const channel = echo.private(`user.${user.id}`);

        // Listen for Ride Updates (Driver position, status change)
        channel.listen('.RideUpdated', (e) => {
            setActiveRide(prev => ({
                ...prev,
                status_message: e.status_text,
                coords: [e.lat, e.lng],
                eta: e.eta
            }));
            if (e.status === 'completed') {
                toast.success("Ride Completed! Hope you enjoyed the trip.");
                fetchDashboardData(); // Refresh history
            }
        });

        // Listen for Application Status Changes
        channel.listen('.ApplicationStatusChanged', (e) => {
            setLatestUpdate({
                service_name: e.service_name,
                status: e.status,
                ref: e.reference
            });
            toast.success(`Application #${e.reference} updated to ${e.status}`);
            fetchDashboardData();
        });

        return () => echo.leave(`user.${user.id}`);
    }, [user, fetchDashboardData]);

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Establishing Secure Uplink</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="bottom-right" />
            <StatusTicker activeRide={activeRide} applicationUpdate={latestUpdate} />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 block">Citizen Dashboard</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                            Habari, {user?.name?.split(' ')[0]}.
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-full">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ecosystem Connected</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <MetricCard label="Mobility" value={stats.totalRides} unit="Trips" icon="🚗" />
                    <MetricCard label="Payments" value={stats.totalSpent} unit="KES" icon="💳" />
                    <MetricCard label="Gov Filings" value={stats.totalApplications} unit="Records" icon="📂" />
                </div>

                {/* Active Trip Visualizer */}
                {activeRide && (
                    <div className="mb-12 bg-white border border-slate-200 rounded-[3rem] p-4 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 h-[450px] rounded-[2.5rem] overflow-hidden z-0 border border-slate-100">
                                <MapContainer center={activeRide.coords} zoom={15} className="h-full w-full" zoomControl={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={activeRide.coords} icon={carIcon} />
                                    <RecenterMap position={activeRide.coords} />
                                </MapContainer>
                            </div>
                            <div className="lg:col-span-4 p-10 flex flex-col justify-center bg-slate-50/50 rounded-[2.5rem]">
                                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-2 block">Live Tracking</span>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
                                    {activeRide.eta || 'Driver arriving'}
                                </h2>
                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between border-b border-slate-200 pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilot</span>
                                        <span className="text-xs font-black text-slate-900">{activeRide.driver_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</span>
                                        <span className="text-xs font-black text-slate-900">{activeRide.vehicle_plate}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                                        Call Pilot
                                    </button>
                                    <button className="bg-white border border-slate-200 text-slate-900 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                                        SOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: History */}
                    <div className="lg:col-span-7">
                        <div className="flex justify-between items-end mb-8 px-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Recent Mobility</h2>
                            <Link to="/rides" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-1">Archive →</Link>
                        </div>
                        <div className="space-y-4">
                            {recentRides.length > 0 ? recentRides.map(ride => (
                                <div key={ride.id} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">📍</div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[250px] uppercase italic">
                                                {ride.dropoff_address || 'End Point'}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1">
                                                {new Date(ride.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {ride.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">KES {ride.final_fare || ride.estimated_fare}</p>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase">Paid</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 text-center">
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No Mobility Data Sync'd</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Filings */}
                    <div className="lg:col-span-5">
                        <div className="flex justify-between items-end mb-8 px-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Service Filings</h2>
                            <Link to="/applications" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-1">Vault →</Link>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                {applications.length > 0 ? applications.map(app => (
                                    <Link key={app.id} to={`/applications/${app.id}`} className="block p-8 hover:bg-slate-50 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">#{app.reference_number?.slice(-6) || 'N/A'}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                                app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {app.government_service?.name || 'Standard Filing'}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Processed by National Digital Registry</p>
                                    </Link>
                                )) : (
                                    <div className="p-12 text-center">
                                         <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No Active Records</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
            `}</style>
        </div>
    );
};

export default CitizenDashboard;