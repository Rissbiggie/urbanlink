import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/applications/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplication(response.data);
      if (response.data.status_logs) setStatusHistory(response.data.status_logs);
    } catch (err) {
      setError('System could not retrieve application records.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Retrieving Records</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Top Header / Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/applications')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-tight transition-colors"
          >
            <span>←</span> Back to Gallery
          </button>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">🖨️</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Title Block */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">Application Record</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
                {application?.government_service?.name || 'Service Details'}
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">REF: {application.reference_number}</p>
          </div>
          <div className={`px-6 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest ring-4 ${getStatusStyles(application.status)}`}>
            {application.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (left) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Form Data Visualization */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Submission Data</h3>
               </div>
               <div className="p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    {application.form_data && typeof application.form_data === 'object' ? (
                      Object.entries(application.form_data).map(([key, value]) => (
                        <div key={key} className="border-b border-slate-50 pb-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</label>
                          <p className="text-slate-900 font-bold">{String(value)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs">
                         {JSON.stringify(application.form_data, null, 2)}
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Timeline / Status History */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
               <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm mb-10">Status Timeline</h3>
               <div className="relative border-l-2 border-slate-100 ml-4 space-y-12">
                  {statusHistory.map((log, idx) => (
                    <div key={idx} className="relative pl-10">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 ${
                            log.status === 'approved' ? 'bg-emerald-500 ring-emerald-100' : 
                            log.status === 'rejected' ? 'bg-rose-500 ring-rose-100' : 'bg-indigo-500 ring-indigo-100'
                        }`}></div>
                        <div>
                           <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{log.status}</p>
                           <p className="text-xs text-slate-400 font-bold mb-3">{formatDate(log.created_at)}</p>
                           {log.notes && (
                             <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-sm font-medium border border-slate-100 italic">
                                "{log.notes}"
                             </div>
                           )}
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar (right) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Meta Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-6">Service Overview</h4>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-500 font-bold">Category</p>
                            <p className="text-sm font-bold text-indigo-400 uppercase tracking-tight">{application.government_service?.service_category?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold">Requirements Check</p>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{application.government_service?.requirements || 'Standard verification applies.'}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full"></div>
            </div>

            {/* Financial Status */}
            {application.payments?.length > 0 && (
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-lg shadow-indigo-200">
                <h4 className="font-black uppercase tracking-widest text-[10px] text-indigo-200 mb-6">Financial Reconciliation</h4>
                {application.payments.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-indigo-700/50 p-4 rounded-2xl border border-indigo-400/30">
                        <div>
                            <p className="text-xs font-black uppercase tracking-tighter">KES {p.amount}</p>
                            <p className="text-[10px] text-indigo-300 font-bold">{formatDate(p.created_at)}</p>
                        </div>
                        <span className="bg-white text-indigo-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">{p.status}</span>
                    </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3">
                {application.status === 'draft' && (
                  <button className="w-full bg-white border border-slate-200 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                    Resume Draft
                  </button>
                )}
                {application.status === 'rejected' && (
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Resubmit for Review
                  </button>
                )}
                <button 
                  onClick={() => navigate('/applications')}
                  className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
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