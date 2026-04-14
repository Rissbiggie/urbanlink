import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../api';
import { FileText, ChevronRight, Shield } from 'lucide-react';

export default function ServiceListingPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Assuming your API has a listServices endpoint
                const res = await applicationAPI.listServices();
                setServices(res.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch services");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse font-black text-[10px] uppercase">Accessing Registry...</div>;

    return (
        <div className="w-full">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 mb-12 shadow-sm">
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">National Digital Registry</span>
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">Services.</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map(service => (
                    <Link 
                        key={service.id} 
                        to={`/services/apply/${service.id}`}
                        className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:shadow-xl transition-all group"
                    >
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{service.name}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed mb-6">
                            {service.description || 'Standard digital filing and processing.'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            Initialize Application <ChevronRight size={14} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}