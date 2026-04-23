import React, { useEffect, useState } from 'react';
import { driverAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';

export default function VehicleProfilePage() {
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await driverAPI.getProfile();
                setVehicle(res.data?.data?.vehicle);
            } catch (err) {
                toast.error("Unable to retrieve asset profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchVehicle();
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse">ACCESSING ASSET VAULT...</div>;

    return (
        <div className="w-full">
            <Toaster />
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 mb-12 shadow-sm">
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Asset Management</span>
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">The Asset.</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Vehicle Card */}
                <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <span className="bg-emerald-500 text-slate-900 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 inline-block">Deployed Asset</span>
                        <h2 className="text-5xl font-black italic tracking-tighter mb-2">{vehicle?.make} {vehicle?.model}</h2>
                        <p className="text-slate-400 font-mono text-2xl uppercase tracking-widest mb-12">{vehicle?.plate_number}</p>
                        
                        <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-800">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Color</p>
                                <p className="font-bold uppercase text-sm">{vehicle?.color || 'Midnight Black'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Class</p>
                                <p className="font-bold uppercase text-sm">{vehicle?.vehicle_type}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 text-[25rem] opacity-5 font-black italic select-none">ASSET</div>
                </div>

                {/* Maintenance/Status Info */}
                <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6 px-2">Operational Status</h3>
                        <div className="space-y-4">
                            <StatusRow label="Engine Health" value="Optimal" color="text-emerald-500" />
                            <StatusRow label="System Sync" value="Connected" color="text-emerald-500" />
                            <StatusRow label="Last Inspection" value={new Date().toLocaleDateString()} color="text-slate-900" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

const StatusRow = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-4 px-2 border-b border-slate-50 last:border-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
        <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{value}</span>
    </div>
);