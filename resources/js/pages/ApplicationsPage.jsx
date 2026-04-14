import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../api';
import toast from 'react-hot-toast';

const ApplicationsPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await applicationAPI.list();
                setApplications(response.data.data || []);
            } catch (err) {
                toast.error("Failed to sync application registry.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400">Syncing Records...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-8 uppercase">Application Vault</h1>
            
            <div className="grid gap-4">
                {applications.length > 0 ? applications.map(app => (
                    <Link 
                        key={app.id} 
                        to={`/applications/${app.id}`}
                        className="bg-white border border-slate-200 p-6 rounded-[2rem] flex items-center justify-between hover:shadow-xl transition-all"
                    >
                        <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">#{app.reference_number || app.id}</span>
                            <h3 className="font-black text-slate-900 uppercase">{app.government_service?.name || 'Filing'}</h3>
                        </div>
                        <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600">
                            {app.status}
                        </span>
                    </Link>
                )) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-[3rem] py-20 text-center text-slate-400 font-black uppercase text-xs">
                        No digital records found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationsPage;