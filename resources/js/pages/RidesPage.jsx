import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import realtimeService from '../services/realtimeService';
import toast, { Toaster } from 'react-hot-toast';

const RidesPage = () => {
    const { user, token } = useAuth();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [todayOnly, setTodayOnly] = useState(false);

    const fetchRides = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (todayOnly) params.today = true;

            const response = await axios.get('/api/rides', {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setRides(response.data.data || []);
        } catch (err) {
            toast.error('Could not sync ride history');
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter, todayOnly]);

    useEffect(() => {
        fetchRides();
    }, [fetchRides]);

    useEffect(() => {
        if (user?.id) {
            const rideUpdateListener = realtimeService.listenForRideUpdates(user.id, (event) => {
                const messages = {
                    accepted: '🎉 Driver is on the way!',
                    in_progress: '🚗 Trip started. Stay safe!',
                    completed: '✅ Arrived at destination.',
                    cancelled: '❌ Trip cancelled.'
                };
                if (messages[event.status]) toast.success(messages[event.status]);
                fetchRides();
            });
            return () => realtimeService.stopListeningRideUpdates(user.id);
        }
    }, [user?.id, fetchRides]);

    const handleCancelRide = async (rideId) => {
        const toastId = toast.loading('Processing cancellation...');
        try {
            await axios.patch(`/api/rides/${rideId}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Ride Terminalized', { id: toastId });
            fetchRides();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cancellation failed', { id: toastId });
        }
    };

    if (loading && rides.length === 0) return <LoadingPulse />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            {/* Header: Movement Aesthetic */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Transit Log</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">My Rides.</h1>
                    </div>
                    <Link
                        to="/rides/request"
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                    >
                        Request New Trip
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-10">
                {/* Filters Command Bar */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 mb-10 flex flex-wrap gap-8 items-center">
                    <FilterGroup label="Status Filter">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent font-black text-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option value="all">All Trips</option>
                            <option value="pending">Awaiting Driver</option>
                            <option value="accepted">Accepted</option>
                            <option value="in_progress">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                    </FilterGroup>

                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="today" 
                            checked={todayOnly} 
                            onChange={(e) => setTodayOnly(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="today" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                            Today's Log Only
                        </label>
                    </div>
                </div>

                {/* Rides Manifest */}
                <div className="space-y-6">
                    {rides.length > 0 ? rides.map(ride => (
                        <RideCard key={ride.id} ride={ride} onCancel={handleCancelRide} />
                    )) : (
                        <div className="bg-white rounded-[2.5rem] p-24 border border-dashed border-slate-300 text-center">
                            <span className="text-5xl mb-4 block">🚕</span>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No trip history recorded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Atomic Components ---
const RideCard = ({ ride, onCancel }) => {
    const statusConfig = {
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        accepted: "bg-blue-50 text-blue-600 border-blue-100",
        in_progress: "bg-indigo-50 text-indigo-600 border-indigo-100",
        completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
        cancelled: "bg-slate-100 text-slate-400 border-slate-200"
    };

    // Correctly mapping driver data from the profile structure
    const driverName = ride.driver_profile?.user?.name || ride.driver?.name;
    const vehicle = ride.driver_profile?.vehicle;
    // Ensuring settlement amount shows the fare even before payment
    const displayFare = ride.payment?.amount || ride.final_fare || ride.estimated_fare;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-500">
            <div className="p-8">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                    {/* Destination Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusConfig[ride.status]}`}>
                                {ride.status.replace('_', ' ')}
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref: {ride.ride_reference}</p>
                        </div>
                        
                        <div className="relative pl-6 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Pickup</p>
                                <p className="font-bold text-slate-900 tracking-tight">{ride.pickup_address}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Destination</p>
                                <p className="font-bold text-slate-900 tracking-tight">{ride.dropoff_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver & Fare Context - UPDATED */}
                    <div className="w-full lg:w-72 space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
                        {driverName ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl font-black italic text-slate-300 shadow-inner">
                                    {driverName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{driverName}</p>
                                    {vehicle && (
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {vehicle.plate_number} • {vehicle.make} {vehicle.model}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-2 flex items-center gap-3 text-amber-500">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Searching for Driver</span>
                            </div>
                        )}

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Settlement</p>
                                <p className="text-xl font-black text-slate-900 tracking-tighter">
                                    <span className="text-xs italic mr-1 text-slate-400">KES</span>
                                    {displayFare ? Number(displayFare).toLocaleString() : '---'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                    {new Date(ride.created_at).toLocaleDateString('en-GB')}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex lg:flex-col gap-3">
                        <Link 
                            to={`/rides/${ride.id}`}
                            className="flex-1 lg:flex-none text-center bg-slate-900 text-white hover:bg-indigo-600 py-3 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                        >
                            Log Data
                        </Link>
                        {ride.status === 'pending' && (
                            <button 
                                onClick={() => onCancel(ride.id)}
                                className="flex-1 lg:flex-none bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                                Terminate
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

};

const FilterGroup = ({ label, children }) => (
    <div className="flex flex-col gap-1 border-r border-slate-100 pr-8 last:border-none">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
        {children}
    </div>
);

const LoadingPulse = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Querying Transit Manifest</p>
    </div>
);

export default RidesPage;