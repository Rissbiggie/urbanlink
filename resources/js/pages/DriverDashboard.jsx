import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEcho } from '../services/broadcast';
import DriverMap from '../components/DriverMap';
import toast, { Toaster } from 'react-hot-toast';
import { driverAPI } from '../api'; 

export default function DriverDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    
    const [profile, setProfile] = useState(null);
    const [allRides, setAllRides] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [vehicles, setVehicles] = useState(null);
    const [payouts, setPayouts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [activeRide, setActiveRide] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const locationSentRef = useRef(0);

    // Category Counts
    const [rideStats, setRideStats] = useState({
        pending: 0,
        accepted: 0,
        in_progress: 0,
        completed: 0,
        paid: 0,
        unpaid: 0,
    });

    const loadDriverData = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, ridesRes, earningsRes, payoutRes] = await Promise.all([
                driverAPI.getProfile(),
                driverAPI.getRides({}),           // Fetch all rides
                driverAPI.getEarnings(),
                driverAPI.getPayouts()
            ]);

            const pData = profileRes.data?.data;
            setProfile(pData);
            setVehicles(pData?.vehicle || null);

            const ridesData = ridesRes.data?.data || ridesRes.data || [];
            setAllRides(ridesData);

            setEarnings(earningsRes.data?.data || earningsRes.data || null);
            setPayouts(payoutRes.data?.data || payoutRes.data || []);

            // Calculate Category Stats
            const stats = {
                pending: ridesData.filter(r => r.status === 'pending').length,
                accepted: ridesData.filter(r => r.status === 'accepted').length,
                in_progress: ridesData.filter(r => r.status === 'in_progress').length,
                completed: ridesData.filter(r => r.status === 'completed').length,
                paid: ridesData.filter(r => r.payment_status === 'paid').length,
                unpaid: ridesData.filter(r => r.payment_status === 'unpaid').length,
            };
            setRideStats(stats);

        } catch (err) {
            console.error("Dashboard Load Error:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'driver') loadDriverData();
    }, [user, loadDriverData]);

    // Real-time Location
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

    const toggleAvailability = async () => {
        setSaving(true);
        try {
            const { data } = await driverAPI.toggleAvailability();
            const isAvailable = data?.data?.is_available ?? data?.is_available;
            setProfile(prev => ({ ...prev, is_available: isAvailable }));
            toast(isAvailable ? '🟢 SYSTEM ONLINE' : '🔴 SYSTEM OFFLINE', {
                style: { borderRadius: '9999px', background: '#0f172a', color: '#fff' }
            });
        } catch (err) {
            toast.error("Status update failed");
        } finally {
            setSaving(false);
        }
    };

    const runRideAction = async (rideId, action) => {
        setSaving(true);
        try {
            if (action === 'accept') await driverAPI.acceptRide(rideId);
            if (action === 'start') await driverAPI.startRide(rideId);
            if (action === 'complete') await driverAPI.completeRide(rideId);
            
            toast.success(`Ride ${action}ed successfully`);
            loadDriverData(); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) return <LoadingState />;

    if (user?.role !== 'driver') return <NonDriverState />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="bottom-center" />
            
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em]">PILOT COMMAND CENTER</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Shift Active.</h1>
                    </div>
                    <button 
                        onClick={toggleAvailability}
                        disabled={saving}
                        className={`px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${
                            profile?.is_available ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                        }`}
                    >
                        {profile?.is_available ? '📡 GO OFFLINE' : '🔌 GO ONLINE'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10">
                
                {/* Status Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                    <StatusCard label="Pending" count={rideStats.pending} color="amber" icon="⏳" />
                    <StatusCard label="Accepted" count={rideStats.accepted} color="blue" icon="✅" />
                    <StatusCard label="In Progress" count={rideStats.in_progress} color="indigo" icon="🚗" />
                    <StatusCard label="Completed" count={rideStats.completed} color="emerald" icon="🏁" />
                    <StatusCard label="Paid" count={rideStats.paid} color="green" icon="💰" />
                    <StatusCard label="Unpaid" count={rideStats.unpaid} color="rose" icon="⚠️" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[3rem] p-4 shadow-sm h-[500px] relative overflow-hidden">
                            <DriverMap driverLocation={driverLocation} assignedRide={activeRide} />
                        </div>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">Recent Jobs</h2>
                            <div className="space-y-4">
                                {allRides.length > 0 ? (
                                    allRides.slice(0, 8).map(ride => (
                                        <RideActionCard 
                                            key={ride.id} 
                                            ride={ride} 
                                            onAction={runRideAction} 
                                            onShowMap={() => setActiveRide(ride)} 
                                        />
                                    ))
                                ) : (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] py-16 text-center">
                                        <p className="text-slate-400 font-bold text-sm">No rides found</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Vehicle Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">ACTIVE VEHICLE</span>
                            <h3 className="text-2xl font-black mt-2">
                                {vehicles?.make} {vehicles?.model}
                            </h3>
                            <p className="font-mono text-slate-400 mt-1">{vehicles?.plate_number}</p>
                            <div className="absolute -right-8 -bottom-8 text-9xl opacity-10">🚗</div>
                        </div>

                       
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===================== STATUS SUMMARY CARD ===================== */
const StatusCard = ({ label, count, color, icon }) => {
    const colorMap = {
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        green: "bg-green-50 text-green-600 border-green-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
    };

    return (
        <div className={`rounded-3xl p-6 border ${colorMap[color] || colorMap.emerald}`}>
            <div className="flex items-center justify-between">
                <span className="text-3xl">{icon}</span>
                <span className="text-4xl font-black tabular-nums">{count}</span>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest">{label}</p>
        </div>
    );
};

/* ===================== RIDE CARD ===================== */
const RideActionCard = ({ ride, onAction, onShowMap }) => (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs font-mono text-slate-500">#{ride.ride_reference}</p>
                <p className="font-semibold text-slate-900 mt-1 line-clamp-1">
                    {ride.pickup_address} → {ride.dropoff_address}
                </p>
            </div>
            <div className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                ride.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                ride.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                ride.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 
                'bg-amber-100 text-amber-700'
            }`}>
                {ride.status}
            </div>
        </div>

        <div className="flex gap-3 mt-6">
            <button 
                onClick={onShowMap}
                className="flex-1 py-4 border border-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50"
            >
                VIEW MAP
            </button>
            
            {ride.status === 'pending' && (
                <button onClick={() => onAction(ride.id, 'accept')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    ACCEPT JOB
                </button>
            )}
            {ride.status === 'accepted' && (
                <button onClick={() => onAction(ride.id, 'start')} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    START RIDE
                </button>
            )}
            {ride.status === 'in_progress' && (
                <button onClick={() => onAction(ride.id, 'complete')} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    COMPLETE
                </button>
            )}
        </div>

        {ride.payment_status && (
            <div className="mt-4 text-right">
                <span className={`text-xs font-bold ${ride.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ride.payment_status.toUpperCase()}
                </span>
            </div>
        )}
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-[5px] border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const NonDriverState = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <h2 className="text-3xl font-black italic">Driver Access Only</h2>
            <p className="text-slate-500 mt-2">This dashboard is restricted to verified pilots.</p>
        </div>
    </div>
);