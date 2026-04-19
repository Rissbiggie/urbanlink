import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const RideDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    
    // Core Data States
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Payment & Polling States
    const [isPolling, setIsPolling] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchRide = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/rides/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setRide(response.data);
            
            // Set defaults for payment
            setPaymentPhone(user?.phone || '0115056323');
            setPaymentAmount(Math.round(response.data.final_fare || response.data.estimated_fare || 0).toString());
        } catch (err) {
            toast.error('Failed to retrieve ride manifest');
        } finally {
            setLoading(false);
        }
    }, [id, token, user]);

    useEffect(() => {
        fetchRide();
    }, [fetchRide]);

    /**
     * IMPROVED WATCHDOG: Polls every 3 seconds
     */
    const startStatusWatchdog = useCallback((paymentId) => {
        if (!paymentId) {
            console.error("❌ Watchdog called without paymentId");
            return;
        }

        setIsPolling(true);
        let attempts = 0;
        const maxAttempts = 40; // ~2 minutes

        const interval = setInterval(async () => {
            attempts++;
            console.log(`🔍 Polling payment #${paymentId} → Attempt ${attempts}/${maxAttempts}`);

            try {
                const res = await axios.get(`/api/payments/${paymentId}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log(`📡 Status Response:`, res.data);

                const { status, result_desc } = res.data;

                if (status === 'completed' || status === 'paid') {
                    clearInterval(interval);
                    setIsPolling(false);
                    toast.success(result_desc || 'Payment Confirmed Successfully!');
                    fetchRide();
                } 
                else if (status === 'failed' || status === 'cancelled') {
                    clearInterval(interval);
                    setIsPolling(false);
                    toast.error(result_desc || 'Payment Failed');
                }
            } catch (err) {
                console.error(`Polling attempt ${attempts} failed:`, err.response?.data || err.message);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setIsPolling(false);
                toast.error('Verification timed out. Please check your M-Pesa manually.');
            }
        }, 3000);

        // Cleanup function (good practice)
        return () => clearInterval(interval);
    }, [token, fetchRide]);

    /**
     * IMPROVED PAYMENT INITIATION
     */
    const handlePaymentInitiation = async () => {
        const toastId = toast.loading("Requesting STK Push...");

        try {
            setActionLoading(true);

            const paymentPayload = {
                payable_type: "ride",
                payable_id: parseInt(ride.id),
                phone: paymentPhone,
                amount: Math.round(parseFloat(paymentAmount)),
            };

            const res = await axios.post('/api/payments/initiate', paymentPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("🔥 FULL PAYMENT RESPONSE:", res.data);

            const newPaymentId = res.data?.id;

            if (!newPaymentId) {
                toast.error("Payment created but ID not returned", { id: toastId });
                console.error("No ID found in response:", res.data);
                return;
            }

            toast.success('STK Push Sent! Check your phone', { id: toastId });
            setShowPaymentModal(false);

            console.log(`🚀 Starting Watchdog for Payment ID: ${newPaymentId}`);
            startStatusWatchdog(newPaymentId);

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to initiate payment';
            toast.error(errorMsg, { id: toastId });
            console.error("Payment Initiation Error:", err.response?.data || err);
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * RIDE STATUS ACTIONS
     */
    const handleAction = async (action, payload = {}) => {
        const toastId = toast.loading(`Executing ${action}...`);
        setActionLoading(true);
        try {
            await axios.post(`/api/rides/${id}/${action}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('System Updated', { id: toastId });
            fetchRide();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Command failed', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingPulse />;
    if (!ride) return <NotFound navigate={navigate} />;

    const isDriver = user?.role === 'driver';
    const isCitizen = user?.role === 'citizen';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans">
            <Toaster position="top-right" />
            
            {/* PAYMENT OVERLAY MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-black text-slate-900 italic mb-6">Payment Registry.</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                                <input 
                                    type="text"
                                    value={paymentPhone}
                                    onChange={(e) => setPaymentPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (KES)</label>
                                <input 
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button 
                                onClick={() => setShowPaymentModal(false)} 
                                className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handlePaymentInitiation} 
                                disabled={actionLoading} 
                                className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-70"
                            >
                                Send STK Push
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TECH HEADER */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <button onClick={() => navigate('/rides')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2 hover:translate-x-[-4px] transition-transform">← Registry</button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Manifest Ref: {ride.ride_reference}</span>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">Ride Manifest.</h1>
                        </div>
                        <StatusBadge status={ride.status} />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <div className="lg:col-span-8 space-y-8">
                        {/* Transaction Controls */}
                        {(ride.status !== 'completed' && ride.status !== 'cancelled') && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl shadow-slate-200">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Command</p>
                                    <p className="font-bold text-sm">System transition required</p>
                                </div>
                                <div className="flex gap-4">
                                    {ride.status === 'pending' && isCitizen && <ActionButton onClick={() => handleAction('cancel')} color="bg-rose-600">Terminate</ActionButton>}
                                    {ride.status === 'accepted' && isDriver && <ActionButton onClick={() => handleAction('start')} color="bg-indigo-500">Initialize</ActionButton>}
                                    {ride.status === 'in_progress' && isDriver && <ActionButton onClick={() => handleAction('complete')} color="bg-emerald-500">Log Completion</ActionButton>}
                                </div>
                            </div>
                        )}

                        {/* Navigation Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Navigation Data</h3>
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 before:border-l-2 before:border-dotted before:border-slate-200">
                                <LocationPoint label="Origin" address={ride.pickup_address} iconColor="bg-indigo-600" />
                                <LocationPoint label="Destination" address={ride.dropoff_address} iconColor="bg-slate-900" />
                            </div>
                        </div>

                        {/* Personnel Identification */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-3xl shadow-inner italic font-black text-slate-400">
                                    {isCitizen 
                                        ? (ride.driver_profile?.user?.name?.charAt(0) || 'S') 
                                        : (ride.user?.name?.charAt(0) || 'C')}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {isCitizen ? 'Assigned Operator' : 'Citizen Manifest'}
                                    </p>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">
                                        {isCitizen 
                                            ? (ride.driver_profile?.user?.name || 'Searching for Operator...') 
                                            : (ride.user?.name || 'Loading Manifest...')}
                                    </h4>
                                    {isCitizen && ride.driver_profile?.vehicle && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-tighter">
                                                {ride.driver_profile.vehicle.plate_number}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">
                                                {ride.driver_profile.vehicle.make} {ride.driver_profile.vehicle.model}
                                            </span>
                                        </div>
                                    )}
                                    {isDriver && (
                                        <p className="text-xs font-bold text-indigo-600 uppercase mt-1">Contact: {ride.user?.phone || 'Private'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Financial Settlement Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Financials</h3>
                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Fare Due</span>
                                    <p className="text-4xl font-black italic text-slate-900 leading-none">
                                        <span className="text-xs not-italic text-slate-400 mr-1.5">KES</span>
                                        {ride.final_fare || ride.estimated_fare}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    {isCitizen && ride.status === 'completed' && ride.payment_status !== 'paid' && !isPolling && (
                                        <button 
                                            onClick={() => setShowPaymentModal(true)} 
                                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all"
                                        >
                                            Process Payment 📱
                                        </button>
                                    )}
                                    {isPolling && (
                                        <div className="bg-slate-900 p-6 rounded-2xl text-center animate-pulse border border-indigo-500/30">
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Verifying M-Pesa...</p>
                                        </div>
                                    )}
                                    {ride.payment_status === 'paid' && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Transaction Settled</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Atomic Layout Components (unchanged) ---
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
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-bold text-slate-900 tracking-tight leading-tight max-w-sm">{address}</p>
        </div>
    </div>
);

const ActionButton = ({ children, color, onClick }) => (
    <button onClick={onClick} className={`${color} text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md`}>
        {children}
    </button>
);

const LoadingPulse = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Reading Registry</p>
    </div>
);

const NotFound = ({ navigate }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-center p-10">
        <h2 className="text-2xl font-black italic mb-4">Record Missing.</h2>
        <button onClick={() => navigate('/rides')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Return to Fleet</button>
    </div>
);

export default RideDetailPage;