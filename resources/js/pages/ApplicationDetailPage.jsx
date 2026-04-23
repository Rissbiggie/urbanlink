import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/applications/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // The backend returns the application object directly or inside a data key
      setApplication(response.data.data ? response.data.data[0] : response.data);
    } catch (err) {
      setError('System could not retrieve application records.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'under_review': return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'draft': return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10';
      default: return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Records</p>
    </div>
  );

  if (error || !application) return <div className="p-20 text-center font-bold text-slate-400">{error || 'Record not found'}</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/applications')}
            className="group flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all"
          >
            <span className="p-2 rounded-xl group-hover:bg-indigo-50 transition-colors">←</span>
            <span className="font-black text-[10px] uppercase tracking-[0.15em]">Back to Gallery</span>
          </button>
          <div className="flex items-center gap-4">
             <span className="h-8 w-[1px] bg-slate-200 mx-2"></span>
           
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12">
        {/* Main Title Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
                <span className="w-8 h-[2px] bg-indigo-600"></span>
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">Official Filing</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                {application.service?.name || 'Service Application'}
            </h1>
            <div className="flex items-center gap-4 font-mono text-xs text-slate-400">
                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold">
                    REF: {application?.application_reference}
                </span>
                <span>•</span>
                <span>Submitted {new Date(application.created_at).toLocaleDateString('en-KE')}</span>
            </div>
          </div>
          
          <div className={`px-8 py-4 rounded-[2rem] border-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/5 ${getStatusStyles(application.status)}`}>
            {application.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Detailed Content */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Documentation Section (The Uploaded Files) */}
            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-sm p-12">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Verified Documents</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        {Object.keys(application.documents || {}).length} Attachments
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {application.documents ? Object.entries(application.documents).map(([name, path]) => (
                        <div key={name} className="group relative bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:bg-indigo-600 transition-all duration-500 overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest transition-colors">File Name</p>
                                    <p className="font-bold text-slate-900 group-hover:text-white transition-colors truncate">{name}</p>
                                </div>
                                <a 
                                    href={`/storage/${path}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-6 flex items-center justify-center gap-2 bg-white text-slate-900 group-hover:bg-indigo-500 group-hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-100 group-hover:border-indigo-400"
                                >
                                    View Digital Copy
                                </a>
                            </div>
                            <div className="absolute -right-4 -bottom-4 text-slate-200/50 group-hover:text-white/10 transition-colors">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                            </div>
                        </div>
                    )) : (
                        <p className="text-slate-400 text-sm italic">No documents attached to this record.</p>
                    )}
                </div>
            </div>

            {/* Application Data visualization */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500 mb-10">Application Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Agency Assignee</label>
                        <p className="text-sm font-medium text-slate-300">{application.agency_reference || 'Awaiting Reviewer Assignment'}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">System Timestamp</label>
                        <p className="text-sm font-medium text-slate-300">{new Date(application.created_at).toLocaleString('en-KE')}</p>
                    </div>
                    <div className="md:col-span-2 pt-8 border-t border-slate-800">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Processing Notes</label>
                        <p className="mt-4 text-slate-400 leading-relaxed italic text-sm">
                            {application.processing_notes || "Submission received. Currently under initial integrity check by the department's digital filing system."}
                        </p>
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8">Service Category</h4>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">
                        {application.government_service?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{application.government_service?.service_category?.name || 'General'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Government Branch</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requirement Summary</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {application.government_service?.requirements || 'Standard verification protocols are in effect for this application type.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky Actions */}
            <div className="sticky top-28 space-y-4">
                <button 
                  onClick={() => navigate('/applications')}
                  className="w-full bg-white border border-slate-200 text-slate-500 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                >
                  Return to Dashboard
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;