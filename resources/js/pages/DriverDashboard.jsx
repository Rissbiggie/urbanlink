import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEcho } from '../services/broadcast';
import DriverMap from '../components/DriverMap';
import toast, { Toaster } from 'react-hot-toast';
import { driverAPI } from '../api'; 

/**
 * MAIN PAGE COMPONENT
 */
export default function DriverDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    
    // State Management
    const [profile, setProfile] = useState(null);
    const [rides, setRides] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [vehicles, setVehicles] = useState(null);
    const [payouts, setPayouts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    
    const [activeRide, setActiveRide] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const locationSentRef = useRef(0);

    /**
     * Fetch all driver-related data
     * FIX: Corrected the nesting to match your JSON response
     */
    const loadDriverData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { 
                status: statusFilter !== 'all' ? statusFilter : undefined 
            };
            
            const [profileRes, ridesRes, earningsRes, payoutRes] = await Promise.all([
                driverAPI.getProfile(),
                driverAPI.getRides(params),
                driverAPI.getEarnings(),
                driverAPI.getPayouts()
            ]);

            // According to your log: the data is directly in profileRes.data.data
            const pData = profileRes.data?.data;
            
            setProfile(pData);
            setVehicles(pData?.vehicle || null);
            
            // Defensive mapping for other endpoints
            setRides(ridesRes.data?.data || ridesRes.data || []);
            setEarnings(earningsRes.data?.data || earningsRes.data || null);
            setPayouts(payoutRes.data?.data || payoutRes.data || []);

        } catch (err) {
            console.error("Dashboard Load Error:", err);
            toast.error("Fleet sync failed. Check connection.");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    /**
     * Initial Load
     */
    useEffect(() => {
        if (user?.role === 'driver') {
            loadDriverData();
        }
    }, [user, loadDriverData]);

    /**
     * Real-time Location Watcher
     */
    useEffect(() => {
        if (user?.role !== 'driver' || !navigator.geolocation) return;
        
        const watchId = navigator.geolocation.watchPosition((pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setDriverLocation({ lat, lng });

            if (Date.now() - locationSentRef.current > 20000) {
                locationSentRef.current = Date.now();
                driverAPI.updateLocation({ lat, lng }).catch(() => {});
            }
        }, null, { enableHighAccuracy: true });
        
        return () => navigator.geolocation.clearWatch(watchId);
    }, [user]);

    /**
     * Toggle Online/Offline Status
     */
    const toggleAvailability = async () => {
        setSaving(true);
        try {
            const { data } = await driverAPI.toggleAvailability();
            const isAvailable = data?.data?.is_available ?? data?.is_available;
            setProfile(prev => ({ ...prev, is_available: isAvailable }));
            
            toast(isAvailable ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE', {
                icon: isAvailable ? '📡' : '💤',
                style: { borderRadius: '1rem', background: '#0f172a', color: '#fff', fontWeight: 'bold' }
            });
        } catch (err) {
            toast.error("Status update failed");
        } finally {
            setSaving(false);
        }
    };

    /**
     * Process Ride Lifecycle
     */
    const runRideAction = async (rideId, action) => {
        setSaving(true);
        try {
            if (action === 'accept') await driverAPI.acceptRide(rideId);
            if (action === 'start') await driverAPI.startRide(rideId);
            if (action === 'complete') await driverAPI.completeRide(rideId);
            
            toast.success(`Job updated: ${action}ed`);
            loadDriverData(); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Action denied");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) return <LoadingState />;

    if (user?.role !== 'driver') {
        return <NonDriverState />;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="bottom-center" />
            
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Pilot Command</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Shift Active.</h1>
                    </div>
                    <button 
                        onClick={toggleAvailability}
                        disabled={saving}
                        className={`px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${
                            profile?.is_available 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-900 text-white'
                        }`}
                    >
                        {profile?.is_available ? '📡 Go Offline' : '🔌 Go Online'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <MetricTile label="Today" value={earnings?.today} icon="💰" />
                    <MetricTile label="Weekly" value={earnings?.week} icon="📊" />
                    <MetricTile label="Rating" value={profile?.average_rating || '5.0'} unit="/ 5.0" icon="⭐" />
                    <MetricTile label="Balance" value={earnings?.total} icon="🏦" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[3rem] p-4 shadow-sm h-[500px] relative">
                            <DriverMap driverLocation={driverLocation} assignedRide={activeRide} />
                        </div>

                        <section>
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Assigned Jobs</h2>
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none font-black text-[10px] uppercase text-indigo-600"
                                >
                                    <option value="all">View All</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="in_progress">Active</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                {rides.length > 0 ? (
                                    rides.map(ride => (
                                        <RideActionCard 
                                            key={ride.id} 
                                            ride={ride} 
                                            onAction={runRideAction} 
                                            onShowMap={() => setActiveRide(ride)} 
                                        />
                                    ))
                                ) : (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] py-12 text-center">
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">No Active Deployments</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Active Asset</span>
                            <h3 className="text-2xl font-black tracking-tight mb-1">
                                {vehicles?.make || 'Toyota'} {vehicles?.model || 'Corolla'}
                            </h3>
                            <p className="text-slate-400 font-mono text-sm uppercase mb-8">
                                {vehicles?.plate_number || 'KAA 000X'}
                            </p>
                            <div className="absolute -right-6 -bottom-6 text-8xl opacity-10">🚗</div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">Settlements</h3>
                            <div className="space-y-4">
                                {payouts.length > 0 ? payouts.map(pay => (
                                    <div key={pay.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                        <span className="text-xs font-black text-slate-900 uppercase">#{pay.ride_reference || 'REF'}</span>
                                        <span className="text-xs font-black text-slate-900">KES {pay.amount}</span>
                                    </div>
                                )) : <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">No history</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MetricTile = ({ label, value, unit = "KES", icon }) => (
    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-xl">{icon}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase">{unit}</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                {Number(value || 0).toLocaleString()}
            </h2>
        </div>
    </div>
);

const RideActionCard = ({ ride, onAction, onShowMap }) => (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <p className="text-xs font-bold text-slate-800 italic mb-6">{ride.pickup_address} → {ride.dropoff_address}</p>
        <div className="flex gap-2">
            <button onClick={onShowMap} className="flex-1 border py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Map</button>
            {ride.status === 'pending' && (
                <button onClick={() => onAction(ride.id, 'accept')} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-[9px] uppercase">Accept</button>
            )}
            {ride.status === 'accepted' && (
                <button onClick={() => onAction(ride.id, 'start')} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-[9px] uppercase">Start</button>
            )}
            {ride.status === 'in_progress' && (
                <button onClick={() => onAction(ride.id, 'complete')} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[9px] uppercase">Finish</button>
            )}
        </div>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-[5px] border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const NonDriverState = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center">
            <h2 className="text-2xl font-black italic">Pilot Access Required.</h2>
        </div>
    </div>
);