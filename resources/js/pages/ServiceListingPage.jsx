import React, { useState, useEffect } from 'react'; // Added useEffect
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationAPI } from '../api'; // Your registry is imported here
import toast from 'react-hot-toast';
import { ShieldCheck, Send, FileText, Clock, ChevronRight, Search } from 'lucide-react';

const ServiceListingPage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    
    // --- ADDED MISSING STATES ---
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // --- ADDED API CALL TO FETCH SERVICES ---
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // This calls: getServices: () => apiClient.get('/services')
                const response = await applicationAPI.getServices();
                setCategories(response.data || []);
            } catch (err) {
                console.error("Fetch Error:", err);
                toast.error("Registry connection interrupted.");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleRegistrySubmission = async () => {
        setSubmitting(true);
        const loadToast = toast.loading("Syncing with National Registry...");
        
        try {
            // This calls: (payload) => apiClient.post('/applications', payload)
            // Passing the serviceId as the payload
            const response = await applicationAPI.submit({
                government_service_id: serviceId
            });
            
            toast.success("Application Registered Successfully", { id: loadToast });
            
            // Redirect to the detail view using the ID returned by Laravel
            navigate(`/applications/${response.data.id}`);
        } catch (err) {
            console.error("API Error:", err);
            toast.error("Filing failed. Check registry connection.", { id: loadToast });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCategories = categories.map(category => ({
        ...category,
        government_services: (category.government_services || []).filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.government_services.length > 0);

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Digital Catalog</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 block">National Registry</span>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-8">Government Services</h1>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text"
                            placeholder="Search for KRA, NTSA, or specific permits..."
                            className="w-full bg-slate-50 border border-slate-200 py-5 pl-16 pr-8 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900"
                            onChange={(e) => setSearchTerm(e.target.value)} // Added onChange handler
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12">
                {filteredCategories.length > 0 ? filteredCategories.map(category => (
                    <div key={category.id} className="mb-16">
                        {/* Category Heading */}
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{category.name}</h2>
                            <div className="h-px flex-1 bg-slate-200"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{(category.government_services || []).length} Services</span>
                        </div>

                        {/* Services Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(category.government_services || []).map(service => (
                                <Link 
                                    key={service.id} 
                                    to={`/services/apply/${service.id}`}
                                    className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:shadow-2xl transition-all group relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <FileText size={24} />
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                        
                                        <h3 className="text-lg font-black text-slate-900 mb-2 uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                                            {service.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-2">
                                            {service.description}
                                        </p>

                                        <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{service.processing_time}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Available</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Decorative subtle background text */}
                                    <span className="absolute -bottom-2 -right-2 text-6xl font-black text-slate-900/[0.03] italic pointer-events-none uppercase">
                                        {service.code}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-[3rem]">
                        <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No services matched your query</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceListingPage;