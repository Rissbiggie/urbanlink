import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../api'; 
import toast, { Toaster } from 'react-hot-toast';

const PaymentsPage = () => {
    const { user } = useAuth();
    
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [statusFilter, setStatusFilter] = useState('completed');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchPayments = async (page = 1, overrides = {}) => {
        try {
            setLoading(true);

            const filters = {
                statusFilter,
                typeFilter,
                searchQuery,
                dateFrom,
                dateTo,
                ...overrides,
            };

            const params = {
                page,
                status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
                type: filters.typeFilter !== 'all' ? filters.typeFilter : undefined,
                search: filters.searchQuery.trim() || undefined,
                date_from: filters.dateFrom || undefined,
                date_to: filters.dateTo || undefined,
            };

            const response = await paymentAPI.getHistory(params);
            const payload = response.data;

            if (payload?.data) {
                setPayments(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    total: payload.total,
                });
                setCurrentPage(payload.current_page);
            } else {
                setPayments(Array.isArray(payload) ? payload : []);
                setMeta(null);
            }
        } catch (err) {
            console.error("API Error:", err);
            toast.error('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        fetchPayments(1);
    };

    const clearFilters = () => {
        const defaults = {
            statusFilter: 'completed',
            typeFilter: 'all',
            searchQuery: '',
            dateFrom: '',
            dateTo: '',
        };
        setStatusFilter(defaults.statusFilter);
        setTypeFilter(defaults.typeFilter);
        setSearchQuery(defaults.searchQuery);
        setDateFrom(defaults.dateFrom);
        setDateTo(defaults.dateTo);
        fetchPayments(1, defaults);
    };

    const goToPage = (page) => {
        if (page < 1) return;
        if (meta && page > meta.last_page) return;
        setCurrentPage(page);
        fetchPayments(page);
    };

    const stats = {
        settled: payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        pending: payments
            .filter(p => ['pending', 'processing'].includes(p.status))
            .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        totalItems: meta?.total || payments.length,
    };

    if (loading && payments.length === 0) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-20 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10">
                        <div>
                            <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">
                                UrbanLink Financial Services
                            </span>
                            <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">Ledger.</h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                                Account: {user?.name}
                            </p>
                        </div>
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <FilterSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            label="Verification Status"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </FilterSelect>

                        <FilterSelect
                            value={typeFilter}
                            onChange={setTypeFilter}
                            label="Transaction Type"
                        >
                            <option value="all">All Types</option>
                            <option value="ride">Ride</option>
                            <option value="application">Application Fee</option>
                        </FilterSelect>

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                Search Reference
                            </span>
                            <input
                                type="text"
                                placeholder="MPesa ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                From Date
                            </span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                To Date
                            </span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="flex items-end gap-3">
                            <button
                                onClick={handleApplyFilters}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex-1 py-3.5 border border-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <BalanceCard
                        label="Settled Capital"
                        value={stats.settled}
                        icon="💎"
                        color="text-emerald-600"
                    />
                    <BalanceCard
                        label="Pending Clearing"
                        value={stats.pending}
                        icon="⏳"
                        color="text-amber-500"
                    />
                    <BalanceCard
                        label="Total Records"
                        value={stats.totalItems}
                        icon="📊"
                        color="text-indigo-600"
                        suffix="Items"
                    />
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Transaction Audit Log
                        </h3>
                        <button
                            onClick={() => fetchPayments(currentPage)}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100 min-h-[400px]">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Loading...
                                </p>
                            </div>
                        ) : payments.length > 0 ? (
                            payments.map(payment => (
                                <TransactionRow key={payment.id} payment={payment} />
                            ))
                        ) : (
                            <div className="py-32 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                                    No Records Found
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {meta.current_page} of {meta.last_page}
                                <span className="ml-4 text-slate-300">({meta.total} records)</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === meta.last_page || loading}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
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
    const statusMap = {
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100',
        processing: 'bg-blue-50 text-blue-600 border-blue-100',
        failed: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className="p-10 hover:bg-slate-50/80 transition-all">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl border bg-white flex items-center justify-center text-2xl">
                        {isRide ? '🚗' : '📋'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-900 uppercase italic">
                                {isRide ? 'Ride Settlement' : 'Application Fee'}
                            </h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${statusMap[payment.status] || statusMap.pending}`}>
                                {payment.status}
                            </span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            REF: {payment.mpesa_transaction_id || payment.id}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                        <span className="text-xs mr-1 text-slate-400">KES</span>
                        {Number(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                        {new Date(payment.created_at).toLocaleDateString('en-GB')}
                    </p>
                </div>
            </div>
        </div>
    );
};

const BalanceCard = ({ label, value, icon, color, suffix = 'KES' }) => (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">{label}</p>
        <h3 className={`text-4xl font-black tracking-tighter italic ${color}`}>
            <span className="text-sm mr-2 not-italic text-slate-400">{suffix}</span>
            {Number(value).toLocaleString()}
        </h3>
        <span className="absolute -right-4 -bottom-4 text-7xl opacity-5 grayscale group-hover:grayscale-0 transition-all">
            {icon}
        </span>
    </div>
);

const FilterSelect = ({ label, value, onChange, children }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</span>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-[11px] font-black uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
        >
            {children}
        </select>
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Syncing Ledger...</p>
    </div>
);

export default PaymentsPage;