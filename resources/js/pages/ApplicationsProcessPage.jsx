import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { ShieldCheck, Upload, Send } from 'lucide-react';

export default function ApplicationProcessPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        const toastId = toast.loading("Submitting to Registry...");

        try {
            const payload = {
                government_service_id: serviceId
            };

            const response = await applicationAPI.create(payload);
            
            // Extracting ID based on your provided JSON structure
            const appId = response.data?.id || response.data?.data?.id;

            toast.success("Application Registered Successfully", { id: toastId });
            navigate(`/applications/${appId}`);
        } catch (err) {
            toast.error("Filing failed. Please check registry status.", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Toaster />
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white mb-12 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Filing Initiation</span>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-4">Confirm Application.</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase leading-relaxed max-w-md">
                        By proceeding, you are submitting an official digital request to the National Registry.
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 font-black italic">FILE</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
                <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">Identity Verified</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Your biometrics and profile are synced with this request.</p>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Terms of Service</p>
                    <div className="bg-slate-50 p-6 rounded-2xl text-[11px] font-bold text-slate-600 leading-loose uppercase">
                        I hereby declare that the information provided is true and I understand that digital filing is subject to administrative review.
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                    {submitting ? 'Processing...' : 'Submit to Registry'}
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}