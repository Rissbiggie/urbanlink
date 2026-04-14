import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationAPI, adminAPI } from '../api'; // ✅ Using Registry
import toast, { Toaster } from 'react-hot-toast';

const OfficerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [pendingApps, setPendingApps] = useState([]);
    const [processedApps, setProcessedApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    /**
     * Fetch all command center data via API Registry
     */
    const fetchDashboardData = useCallback(async () => {
        try {
            const [pendingRes, processedRes, statsRes] = await Promise.all([
                applicationAPI.list({ status: 'pending', limit: 10 }),
                applicationAPI.list({ status: 'approved,rejected', limit: 5 }),
                adminAPI.getDashboardStats()
            ]);

            setPendingApps(pendingRes.data.data || []);
            setProcessedApps(processedRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (err) {
            toast.error('Command center synchronization failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        // Polling every 60 seconds to keep queue fresh
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    /**
     * Handle Application Approval/Rejection
     */
    const handleProcess = async (id, action) => {
        setActionLoading(true);
        const toastId = toast.loading(`Committing ${action}...`);
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            
            // Using the update method from registry
            await applicationAPI.updateStatus(id, { status });
            
            toast.success(`Deployment ${status}`, { id: toastId });
            setSelectedApp(null);
            fetchDashboardData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Processing error', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="top-right" />
            
            {/* Header: High-Contrast Command Center Style */}
            <div className="bg-slate-900 pt-20 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-500/5 -skew-x-12 translate-x-1/4"></div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                    <div>
                        <span className="text-orange-400 font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Central Registry Management</span>
                        <h1 className="text-6xl font-black text-white tracking-tighter italic">Command Center.</h1>
                        <p className="text-slate-400 text-[11px] mt-4 font-black uppercase tracking-widest">
                            Authorized: <span className="text-white">Officer {user?.name}</span> | Jurisdiction: <span className="text-white">Nairobi HQ</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-12">
                {/* 1. Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    <StatCard label="Review Queue" value={pendingApps.length} icon="📥" color="border-orange-500" />
                    <StatCard label="Approved (24h)" value={stats?.approved_today || 0} icon="✅" color="border-emerald-500" />
                    <StatCard label="Rejected (24h)" value={stats?.rejected_today || 0} icon="❌" color="border-rose-500" />
                    <StatCard label="Live Citizens" value={stats?.verified_users || 0} icon="👥" color="border-blue-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* 2. Main Review Panel */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Queue: Verification Requests</h2>
                                <span className="bg-slate-900 px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                                    {pendingApps.length} Pending
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {pendingApps.length > 0 ? pendingApps.map(app => (
                                    <div 
                                        key={app.id} 
                                        className={`p-8 transition-all cursor-pointer ${selectedApp?.id === app.id ? 'bg-orange-50/30' : 'hover:bg-slate-50/80'}`} 
                                        onClick={() => setSelectedApp(app)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-6">
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                    {app.government_service?.icon || '📄'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg tracking-tight uppercase italic">{app.reference_number}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{app.user?.name || 'Anonymous Applicant'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1 rounded-md">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Detailed View on Selection */}
                                        {selectedApp?.id === app.id && (
                                            <div className="mt-10 bg-white rounded-[2.5rem] border border-orange-200 p-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Encrypted Form Data</h4>
                                                        <pre className="text-[11px] bg-slate-900 p-6 rounded-3xl font-mono text-emerald-400 overflow-x-auto shadow-inner">
                                                            {JSON.stringify(app.form_data, null, 2)}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Verification Assets</h4>
                                                        <div className="space-y-3">
                                                            {app.documents?.length > 0 ? app.documents.map((doc, i) => (
                                                                <a key={i} href={doc.path} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">
                                                                    <span>📎 View Attachment {i + 1}</span>
                                                                    <span className="opacity-50">→</span>
                                                                </a>
                                                            )) : (
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase italic">No documents attached</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleProcess(app.id, 'approve'); }} 
                                                        disabled={actionLoading} 
                                                        className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                                                    >
                                                        Finalize Approval
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleProcess(app.id, 'reject'); }} 
                                                        disabled={actionLoading} 
                                                        className="flex-1 bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                    >
                                                        Deny Entry
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-24 text-center">
                                        <div className="text-4xl mb-4 opacity-20">🕊️</div>
                                        <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">Grid Clean. No Pending Actions.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Audit Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-6 relative z-10">Audit History</h2>
                            <div className="space-y-6 relative z-10">
                                {processedApps.length > 0 ? processedApps.map(app => (
                                    <div key={app.id} className="flex justify-between items-center group transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">#{app.reference_number?.slice(-8)}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{app.user?.name}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-md border ${
                                            app.status === 'approved' 
                                            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' 
                                            : 'border-rose-500/50 text-rose-400 bg-rose-500/5'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest text-center py-10">No recent logs</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const StatCard = ({ label, value, icon, color }) => (
    <div className={`bg-white rounded-[2.5rem] p-8 border-l-8 shadow-sm transition-all hover:translate-y-[-4px] ${color}`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter italic">
                    {Number(value).toLocaleString()}
                </p>
            </div>
            <span className="text-4xl opacity-20">{icon}</span>
        </div>
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-14 h-14 border-[6px] border-slate-900 border-t-orange-500 rounded-full animate-spin mb-8"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Establishing Command Uplink</p>
    </div>
);

export default OfficerDashboard;