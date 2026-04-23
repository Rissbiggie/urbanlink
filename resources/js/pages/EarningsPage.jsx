import React, { useEffect, useState, useMemo } from 'react';
import { paymentAPI, rideAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';

export default function EarningsPage() {
    const [earnings, setEarnings] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [earningsRes, payoutsRes, paymentsRes] = await Promise.all([
                paymentAPI.getHistory(),   // or your earnings endpoint
                paymentAPI.getHistory(),
                paymentAPI.getHistory()    // ← Using your paymentAPI
            ]);

            setEarnings(earningsRes.data?.data || earningsRes.data);
            setPayouts(payoutsRes.data?.data || payoutsRes.data || []);
            setPayments(paymentsRes.data?.data || paymentsRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load earnings data");
        } finally {
            setLoading(false);
        }
    };

    // Total Paid (only completed payments)
    const totalPaid = useMemo(() => {
        return payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }, [payments]);

    // Filtered Payments
    const filteredPayments = useMemo(() => {
        let result = payments.filter(p => p.status === 'completed');

        if (dateFrom) {
            result = result.filter(p => new Date(p.created_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59);
            result = result.filter(p => new Date(p.created_at) <= toDate);
        }

        return result;
    }, [payments, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const applyFilters = () => setCurrentPage(1);
    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Syncing Revenue...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto px-6 pt-8">
                
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 mb-12 shadow-sm">
                    <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Treasury</span>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">Revenue.</h1>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Balance</p>
                        <h2 className="text-5xl font-black italic tracking-tighter">
                            KES {(earnings?.total_balance || earnings?.total || 0).toLocaleString()}
                        </h2>
                    </div>

                    <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem]">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">This Week</p>
                        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">
                            KES {(earnings?.weekly || 0).toLocaleString()}
                        </h2>
                    </div>

                    <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem]">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Today</p>
                        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">
                            KES {(earnings?.today || 0).toLocaleString()}
                        </h2>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-[2.5rem]">
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">Total Paid</p>
                        <h2 className="text-5xl font-black text-emerald-700 italic tracking-tighter">
                            KES {totalPaid.toLocaleString()}
                        </h2>
                    </div>
                </div>

                {/* Payout History */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm mb-12">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-8">Payout History</h3>
                    {payouts.length > 0 ? (
                        payouts.map(pay => (
                            <div key={pay.id} className="flex justify-between items-center py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-4 rounded-2xl transition-colors">
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase">Ref: {pay.ride_reference || pay.id}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                        {new Date(pay.created_at).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                                <span className="text-lg font-black text-emerald-600">
                                    + KES {Number(pay.amount).toLocaleString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-center py-16 font-black text-sm uppercase tracking-widest">No payout records found</p>
                    )}
                </div>

                {/* Paid Rides / Successful Payments Table */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Successful Payments</h3>
                        
                        <div className="flex gap-4">
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 rounded-2xl px-5 py-3 text-sm" />
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 rounded-2xl px-5 py-3 text-sm" />
                            <button onClick={applyFilters} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest">Apply</button>
                            <button onClick={clearFilters} className="border border-slate-300 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest">Clear</button>
                        </div>
                    </div>

                    {paginatedPayments.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Payment ID</th>
                                            <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                                            <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Ride ID</th>
                                            <th className="text-right py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="text-center py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedPayments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-6 px-6 font-mono text-sm font-bold">#{payment.id}</td>
                                                <td className="py-6 px-6 text-sm text-slate-500">
                                                    {new Date(payment.created_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="py-6 px-6 text-sm font-medium text-slate-700">
                                                    Ride #{payment.payable_id}
                                                </td>
                                                <td className="py-6 px-6 text-right font-bold text-emerald-600">
                                                    KES {Number(payment.amount).toLocaleString()}
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    <span className="inline-block px-5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase rounded-full">
                                                        PAID
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-8 text-sm">
                                <p className="text-slate-400 font-bold">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-6 py-3 border border-slate-200 rounded-2xl font-black text-xs uppercase disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-6 py-3 border border-slate-200 rounded-2xl font-black text-xs uppercase disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-400 font-black text-sm uppercase tracking-widest">
                            No successful payments found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}