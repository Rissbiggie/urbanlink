import React, { useEffect, useState } from 'react';
import { driverAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';

export default function EarningsPage() {
    const [earnings, setEarnings] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const [eRes, pRes] = await Promise.all([
                    driverAPI.getEarnings(),
                    driverAPI.getPayouts()
                ]);
                setEarnings(eRes.data?.data || eRes.data);
                setPayouts(pRes.data?.data || pRes.data || []);
            } catch (err) {
                toast.error("Failed to sync financial ledger.");
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse">SYNCING LEDGER...</div>;

    return (
        <div className="w-full">
            <Toaster />
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 mb-12 shadow-sm">
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Treasury</span>
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">Revenue.</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Balance</p>
                    <h2 className="text-4xl font-black italic">KES {earnings?.total_balance?.toLocaleString()}</h2>
                </div>
                <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">This Week</p>
                    <h2 className="text-4xl font-black text-slate-900 italic">KES {earnings?.weekly?.toLocaleString()}</h2>
                </div>
                <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Today</p>
                    <h2 className="text-4xl font-black text-slate-900 italic">KES {earnings?.today?.toLocaleString()}</h2>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-8">Payout History</h3>
                <div className="space-y-4">
                    {payouts.length > 0 ? payouts.map(pay => (
                        <div key={pay.id} className="flex justify-between items-center py-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-4 rounded-2xl transition-colors">
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">Ref: {pay.ride_reference || pay.id}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(pay.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="text-lg font-black text-emerald-600">+ KES {pay.amount}</span>
                        </div>
                    )) : (
                        <p className="text-slate-400 text-center py-10 font-black text-[10px] uppercase">No settlements found in registry.</p>
                    )}
                </div>
            </div>
        </div>
    );
}