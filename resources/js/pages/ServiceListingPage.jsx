import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { applicationAPI } from '../api'; 
import toast, { Toaster } from 'react-hot-toast';
import { FileText, Clock, ChevronRight, Search } from 'lucide-react';

const ServiceListingPage = () => {
    const navigate = useNavigate();
    // CHANGED: State is now a flat array of services instead of categories
    const [services, setServices] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Calls: apiClient.get('/services') -> now returns [service1, service2...]
                const response = await applicationAPI.getServices();
                setServices(response.data || []);
            } catch (err) {
                console.error("Registry Error:", err);
                toast.error("Registry connection interrupted.");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // UPDATED: Simple filtering on the flat array
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.code && service.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing National Registry</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Toaster position="top-center" />
            
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-20 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Official Gateway</span>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-10 italic">Government <span className="not-italic text-indigo-600">Services.</span></h1>
                    
                    <div className="relative max-w-2xl group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
                        <input 
                            type="text"
                            placeholder="Search by service name, code, or description..."
                            className="w-full bg-slate-50 border-2 border-slate-100 py-6 pl-16 pr-8 rounded-[2.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600/20 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-6 mt-16">
                {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredServices.map(service => (
                            <Link 
                                key={service.id} 
                                to={`/services/apply/${service.id}`} 
                                className="bg-white border-2 border-slate-50 p-10 rounded-[3.5rem] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden flex flex-col justify-between min-h-[320px]"
                            >
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white mb-8 transition-all duration-500">
                                        <FileText size={28} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3 uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose line-clamp-3">
                                        {service.description || "Official government processing for digital records and compliance."}
                                    </p>
                                </div>

                                <div className="relative z-10 pt-8 mt-8 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-indigo-600" />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                                            {service.processing_time || "48-72 Hours"}
                                        </span>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" />
                                </div>

                                {/* Decorative background text */}
                                <span className="absolute -bottom-4 -right-4 text-8xl font-black text-slate-900/[0.02] italic pointer-events-none uppercase select-none">
                                    {service.code || "SRV"}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white border-2 border-dashed border-slate-100 rounded-[4rem]">
                        <p className="font-black text-slate-300 uppercase tracking-[0.5em] text-sm">No Matching Records in Registry</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceListingPage;