import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const RideDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchRide = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/rides/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setRide(response.data);
        } catch (err) {
            toast.error('Failed to retrieve ride manifest');
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        fetchRide();
    }, [fetchRide]);

    const handleAction = async (action, payload = {}) => {
        const toastId = toast.loading(`Executing ${action} protocol...`);
        setActionLoading(true);
        try {
            await axios.post(`/api/rides/${id}/${action}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('System Updated', { id: toastId });
            fetchRide();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingPulse />;
    if (!ride) return <NotFound navigate={navigate} />;

    const isDriver = user?.role === 'driver';
    const isCitizen = user?.role === 'citizen';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            {/* Header: Navigation & Identity */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <button 
                        onClick={() => navigate('/rides')}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
                    >
                        ← Back to Registry
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">
                                Trip Reference: {ride.ride_reference}
                            </span>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Ride Manifest.</h1>
                        </div>
                        <StatusBadge status={ride.status} />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Route & Identity */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. Protocol Actions (Contextual) */}
                        {(ride.status !== 'completed' && ride.status !== 'cancelled') && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl shadow-slate-200">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Command</p>
                                    <p className="font-bold text-sm tracking-tight">Required: System status transition</p>
                                </div>
                                <div className="flex gap-4">
                                    {ride.status === 'pending' && isCitizen && (
                                        <ActionButton onClick={() => handleAction('cancel')} color="bg-rose-600">Terminate Trip</ActionButton>
                                    )}
                                    {ride.status === 'accepted' && isDriver && (
                                        <ActionButton onClick={() => handleAction('start')} color="bg-indigo-500">Initialize Transit</ActionButton>
                                    )}
                                    {ride.status === 'in_progress' && isDriver && (
                                        <ActionButton onClick={() => handleAction('complete')} color="bg-emerald-500">Log Completion</ActionButton>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. Route Manifest */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Navigation Data</h3>
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 before:border-l-2 before:border-dotted before:border-slate-200">
                                <LocationPoint label="Pickup Point" address={ride.pickup_address} iconColor="bg-indigo-600" />
                                <LocationPoint label="Dropoff Point" address={ride.dropoff_address} iconColor="bg-slate-900" />
                            </div>
                            
                            {ride.estimated_distance && (
                                <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-2 gap-8">
                                    <DataPoint label="Total Distance" value={`${ride.estimated_distance} KM`} />
                                    <DataPoint label="Estimated Time" value={`${ride.estimated_duration} MIN`} />
                                </div>
                            )}
                        </div>

                        {/* 3. Driver/Citizen Identity */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-3xl shadow-inner italic font-black">
                                    {ride.driver?.name?.charAt(0) || ride.user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Personnel</p>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{ride.driver?.name || 'Searching...'}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase">{ride.driver?.vehicle?.plate_number} • {ride.driver?.vehicle?.model}</p>
                                </div>
                            </div>
                            {ride.driver?.average_rating && (
                                <div className="text-right">
                                    <p className="text-lg font-black text-slate-900 tracking-tighter italic">⭐ {ride.driver.average_rating.toFixed(1)}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator Rating</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settlement & Feedback */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* 1. Settlement Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Settlement</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Fare Amount</span>
                                    <p className="text-3xl font-black tracking-tighter italic text-slate-900">
                                        <span className="text-xs not-italic text-slate-400 mr-1">KES</span>
                                        {ride.payment?.amount || '---'}
                                    </p>
                                </div>
                                <div className="flex justify-between py-3 border-y border-slate-50">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${ride.payment?.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {ride.payment?.status || 'Unprocessed'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Method</span>
                                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">M-Pesa Express</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Rating Section */}
                        {ride.status === 'completed' && isCitizen && (
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
                                <h3 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-6">Operator Feedback</h3>
                                {!ride.rating ? (
                                    <div className="space-y-6">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star} 
                                                    onClick={() => setRating(star)}
                                                    className={`text-2xl transition-all ${star <= rating ? 'opacity-100 scale-110' : 'opacity-30'}`}
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Notes on operator conduct..."
                                            className="w-full bg-white/10 border-none rounded-xl p-4 text-xs font-medium text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-white/50"
                                            rows="3"
                                        />
                                        <button 
                                            onClick={() => handleAction('rate', { rating, comment })}
                                            className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 italic opacity-90">
                                        <p className="text-xl font-black italic tracking-tighter">⭐ {ride.rating.rating}.0</p>
                                        <p className="text-xs font-medium leading-relaxed">"{ride.rating.comment || 'No additional notes logged.'}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Atomic Components ---

const StatusBadge = ({ status }) => {
    const config = {
        pending: "text-amber-500 bg-amber-50 border-amber-100",
        accepted: "text-blue-500 bg-blue-50 border-blue-100",
        in_progress: "text-indigo-500 bg-indigo-50 border-indigo-100",
        completed: "text-emerald-500 bg-emerald-50 border-emerald-100",
        cancelled: "text-rose-500 bg-rose-50 border-rose-100",
    };
    return (
        <div className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${config[status] || config.pending}`}>
            {status.replace('_', ' ')}
        </div>
    );
};

const LocationPoint = ({ label, address, iconColor }) => (
    <div className="relative z-10 flex items-start gap-6">
        <div className={`w-6 h-6 rounded-lg ${iconColor} flex items-center justify-center shadow-lg shadow-slate-200`}>
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div>
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="font-bold text-slate-900 tracking-tight leading-tight max-w-sm">{address}</p>
        </div>
    </div>
);

const DataPoint = ({ label, value }) => (
    <div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 italic tracking-tighter">{value}</p>
    </div>
);

const ActionButton = ({ children, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`${color} text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all active:opacity-80`}
    >
        {children}
    </button>
);

const LoadingPulse = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Querying Trip Manifest</p>
    </div>
);

const NotFound = ({ navigate }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-10 text-center">
        <span className="text-6xl mb-6">🚨</span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic mb-2">Registry Access Denied.</h2>
        <p className="text-slate-400 text-sm font-medium mb-8 max-w-xs">This trip reference does not exist or your clearance level is insufficient.</p>
        <button onClick={() => navigate('/rides')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Return to Base</button>
    </div>
);

export default RideDetailPage;