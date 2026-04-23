import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, ChevronRight, Archive, Clock, Search } from 'lucide-react';

const ApplicationsPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await applicationAPI.list();
                
                /**
                 * DATA STRUCTURE SYNC:
                 * Your JSON confirmed the nested structure. 
                 * We extract 'data' from the Laravel response.
                 */
                const data = response.data.data?.data || response.data.data || response.data || [];
                setApplications(Array.isArray(data) ? data : [data]);
            } catch (err) {
                toast.error("Failed to sync application registry.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    // Filter logic for quick searching by name or reference
    const filteredApps = applications.filter(app => 
        app.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Archive</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8FAFC]">
            <Toaster position="top-right" />
            
            {/* HEADER & SEARCH SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Records Division</p>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Application Vault</h1>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text"
                        placeholder="SEARCH RECORDS..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* APPLICATIONS GRID */}
            <div className="grid gap-4">
                {filteredApps.length > 0 ? filteredApps.map(app => (
                    <Link 
                        key={app.id} 
                        to={`/applications/${app.id}`}
                        className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-300"
                    >
                        <div className="flex items-center gap-6">
                            {/* DYNAMIC ICON BOX */}
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                <FileText size={24} />
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                        {/* Reference from JSON: application_reference */}
                                        {app.application_reference}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-200">/</span>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Clock size={10} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* SUCCESSFUL MAPPING: 
                                    Pulls from the eager-loaded service object.
                                */}
                                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                    {app.service?.name || 'Standard Filing'}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <StatusBadge status={app.status} />
                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="border-4 border-dotted border-slate-100 rounded-[4rem] py-32 flex flex-col items-center justify-center bg-white/50">
                        <Archive size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">
                            {searchTerm ? "No matches found in archive" : "Vault currently empty"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/* THEMED STATUS BADGE */
const StatusBadge = ({ status }) => {
    const styles = {
        submitted: "bg-blue-50 text-blue-600 border-blue-100",
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        processed: "bg-emerald-50 text-emerald-600 border-emerald-100",
        completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
        failed: "bg-rose-50 text-rose-600 border-rose-100",
        default: "bg-slate-50 text-slate-600 border-slate-100"
    };

    return (
        <span className={`px-5 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest ${styles[status] || styles.default}`}>
            {status}
        </span>
    );
};

export default ApplicationsPage;