import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../api'; 
import toast, { Toaster } from 'react-hot-toast';

const PaymentsPage = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [meta, setMeta] = useState(null);

   const fetchPayments = useCallback(async (page = 1) => {
    try {
        setLoading(true);
        const params = { page };
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;

        const response = await paymentAPI.getHistory(params);
        
        // 1. Axios puts the JSON body in .data
        // 2. Laravel Pagination puts the list in .data
        const payload = response.data; 

        if (payload && payload.data) {
            setPayments(payload.data); // This is the array of 6 items
            setMeta({
                current_page: payload.current_page,
                last_page: payload.last_page,
                total: payload.total
            });
        } else {
            // Handle case where response might not be paginated
            setPayments(Array.isArray(payload) ? payload : []);
        }
    } catch (err) {
        console.error("API Error:", err);
        toast.error('Financial ledger synchronization failed');
    } finally {
        setLoading(false);
    }
}, [statusFilter, typeFilter]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const stats = {
        total: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        count: meta?.total || 0
    };

    if (loading && payments.length === 0) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="top-right" />
            
            <div className="bg-white border-b border-slate-200 pt-20 pb-16 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">UrbanLink Financial Services</span>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">Ledger.</h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Account: {user?.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Verification Status">
                            <option value="all">All Status</option>
                            <option value="completed">Settled</option>
                            <option value="pending">In-Flight</option>
                            <option value="failed">Reverted</option>
                        </FilterSelect>
                        <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Billing Group">
                            <option value="all">All Groups</option>
                            <option value="ride">Mobility</option>
                            <option value="application">Civic Services</option>
                        </FilterSelect>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <BalanceCard label="Settled Capital" value={stats.total} icon="💎" color="text-emerald-600" />
                    <BalanceCard label="Pending Clearing" value={stats.pending} icon="⏳" color="text-amber-500" />
                    <BalanceCard label="System Ops" value={stats.count} icon="📊" color="text-indigo-600" suffix="Items" />
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Transaction Audit Log</h3>
                        <button onClick={() => fetchPayments()} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors border-b-2 border-indigo-100 hover:border-indigo-800 pb-1">
                            Request Sync
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {payments.length > 0 ? payments.map(payment => (
                            <TransactionRow key={payment.id} payment={payment} />
                        )) : (
                            <div className="py-32 text-center">
                                <span className="text-5xl mb-6 block grayscale opacity-20">📂</span>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Recorded Financial Activity</p>
                            </div>
                        )}
                    </div>

                    {meta && meta.last_page > 1 && (
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {meta.current_page} of {meta.last_page}</p>
                            <div className="flex gap-3">
                                <button disabled={meta.current_page === 1} onClick={() => fetchPayments(meta.current_page - 1)} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30">Previous</button>
                                <button disabled={meta.current_page === meta.last_page} onClick={() => fetchPayments(meta.current_page + 1)} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionRow = ({ payment }) => {
    const isRide = payment.payable_type?.toLowerCase().includes('ride');
    const isFailed = payment.status === 'failed';

    const statusMap = {
        completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        failed: "bg-rose-50 text-rose-600 border-rose-100",
        cancelled: "bg-slate-100 text-slate-400 border-slate-200"
    };

    return (
        <div className="p-10 hover:bg-slate-50/80 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl transition-transform group-hover:scale-110 ${isFailed ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                        {isRide ? '🚗' : '📋'}
                    </div>
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase italic leading-none">
                                {isRide ? 'Transit Settlement' : 'Civic Filing Fee'}
                            </h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${statusMap[payment.status]}`}>
                                {payment.status}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            REF: {payment.mpesa_transaction_id || payment.receipt_number || 'STK_ERR'}
                        </p>
                        
                        {isFailed && payment.result_desc && (
                             <div className="mt-2 p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                                <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Response Data:</p>
                                <p className="text-[10px] font-bold text-slate-500 italic leading-snug">
                                    {payment.result_desc.split('\n')[0]}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-right">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                            <span className="text-xs font-bold text-slate-400 mr-2 italic">{payment.currency || 'KES'}</span>
                            {Number(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">M-Pesa Gateway</p>
                    </div>
                    <div className="hidden md:block text-right border-l-2 border-slate-100 pl-12">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                            {new Date(payment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BalanceCard = ({ label, value, icon, color, suffix = "KES" }) => (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
        <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">{label}</p>
            <h3 className={`text-4xl font-black tracking-tighter italic ${color}`}>
                <span className="text-sm mr-2 not-italic text-slate-400">{suffix}</span>
                {Number(value).toLocaleString()}
            </h3>
        </div>
        <span className="absolute -right-6 -bottom-6 text-8xl opacity-5 grayscale group-hover:grayscale-0 transition-all select-none">{icon}</span>
    </div>
);

const FilterSelect = ({ label, value, onChange, children }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-[11px] font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none pr-10 cursor-pointer hover:bg-white transition-colors uppercase tracking-widest">
            {children}
        </select>
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Establishing Secure Stream</p>
    </div>
);

export default PaymentsPage;