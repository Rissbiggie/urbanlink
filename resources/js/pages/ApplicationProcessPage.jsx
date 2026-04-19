import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { ShieldCheck, Send, FileUp, CheckCircle, Clock, Paperclip } from 'lucide-react';

export default function ApplicationProcessPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Binds Requirement Names (e.g., "KRA PIN") to actual File Binaries
    const [uploads, setUploads] = useState({}); 

    useEffect(() => {
        const fetchRequirements = async () => {
            try {
                // Fetch service details to get the 'required_documents' array from the DB
                const response = await applicationAPI.getServiceDetails(serviceId);
                setService(response.data);
            } catch (err) {
                toast.error("Registry connection failed.");
            } finally {
                setLoading(false);
            }
        };
        fetchRequirements();
    }, [serviceId]);

    const handleFileChange = (reqName, file) => {
        if (file) {
            setUploads(prev => ({ ...prev, [reqName]: file }));
            toast.success(`${reqName} attached`, { 
                icon: '📎',
                style: { borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' } 
            });
        }
    };

    const handleSubmit = async () => {
        // 1. Client-side validation: Check if every requirement has a file
        const missing = service.required_documents.filter(doc => !uploads[doc]);
        if (missing.length > 0) {
            return toast.error(`Incomplete: Please upload ${missing.join(', ')}`);
        }

        setSubmitting(true);
        const toastId = toast.loading("Syncing with National Vault...");

        try {
            // 2. Prepare Multipart Form Data for binary transmission
            const formData = new FormData();
            formData.append('government_service_id', serviceId);
            
            // Map our 'uploads' state into the FormData
            Object.keys(uploads).forEach((docName) => {
                formData.append(`documents[${docName}]`, uploads[docName]);
            });

            const response = await applicationAPI.submit(formData);
            
            // Handle Laravel response structure
            const appId = response.data?.id || response.data?.data?.id;
            toast.success("Application Digitally Archived", { id: toastId });
            navigate(`/applications/${appId}`);

        } catch (err) {
            const msg = err.response?.data?.message || "Filing failed. Check connection.";
            toast.error(msg, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Requirements</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-6">
            <Toaster position="top-center" />
            <div className="max-w-3xl mx-auto">
                
                {/* Header Section */}
                <div className="bg-slate-900 rounded-[3.5rem] p-16 text-white mb-12 relative overflow-hidden shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                        <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-6 block">Filing Initiation</span>
                        <h1 className="text-5xl font-black italic tracking-tighter mb-4 leading-tight">
                            {service?.name}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="text-white">ID: #{serviceId}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className="flex items-center gap-2"><Clock size={12}/> {service?.processing_time || '48-72h'}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white border-2 border-slate-50 rounded-[3.5rem] p-12 shadow-sm space-y-10">
                    
                    {/* Security Note */}
                    <div className="flex items-start gap-8 p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50">
                        <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight mb-2 italic">Identity Verified</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                Documents will be encrypted and stored in the National Data Vault.
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Upload Slots */}
                    <div className="space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Required Documentation</p>
                        <div className="grid gap-4">
                            {service?.required_documents?.map((req) => (
                                <div key={req}>
                                    <input 
                                        type="file" 
                                        id={`file-${req}`}
                                        className="hidden" 
                                        onChange={(e) => handleFileChange(req, e.target.files[0])}
                                    />
                                    <label 
                                        htmlFor={`file-${req}`}
                                        className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                                            uploads[req] 
                                            ? 'bg-indigo-50/50 border-indigo-200' 
                                            : 'bg-slate-50 border-transparent hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                uploads[req] ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300'
                                            }`}>
                                                {uploads[req] ? <CheckCircle size={20} /> : <FileUp size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-slate-900 uppercase">{req}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[200px]">
                                                    {uploads[req] ? uploads[req].name : 'Click to select file'}
                                                </p>
                                            </div>
                                        </div>
                                        {uploads[req] && <span className="text-[9px] font-black text-indigo-600 uppercase bg-white px-3 py-1 rounded-lg border border-indigo-100">Attached</span>}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                        <button 
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-6 hover:bg-slate-900 transition-all shadow-xl disabled:opacity-50"
                        >
                            {submitting ? 'Transmitting...' : 'Finalize Submission'}
                            <Send size={20} />
                        </button>
                        
                        <button 
                            onClick={() => navigate('/services')}
                            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                            Cancel and Return
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}