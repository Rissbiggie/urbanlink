import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CompliancePage = () => {
  const { user, token } = useAuth();
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/compliance/snapshot', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCompliance(response.data);
    } catch (err) {
      setError('System vault unreachable. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const refreshCompliance = async () => {
    try {
      setRefreshing(true);
      setError('');
      const response = await axios.get('/api/compliance/refresh', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCompliance(response.data);
    } catch (err) {
      setError('Agency sync interrupted. Retry in 60 seconds.');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    if (['compliant', 'active', 'valid'].includes(s)) 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
    if (['non-compliant', 'inactive', 'expired', 'suspended'].includes(s)) 
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
    return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unsynced';
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Auditing Records</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Official Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-12 mb-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Compliance Audit</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Government Verification</h1>
            <p className="text-slate-500 font-medium mt-1 italic leading-relaxed">Cross-agency status synchronization for UrbanLink services.</p>
          </div>
          <button
            onClick={refreshCompliance}
            disabled={refreshing}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 ${
              refreshing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl shadow-slate-200'
            }`}
          >
            {refreshing ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></span>
            ) : '🔄'}
            {refreshing ? 'Syncing...' : 'Force Global Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {error && (
          <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl font-bold text-sm">
            {error}
          </div>
        )}

        {/* Global Compliance Bar */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 mb-12 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" strokeDashoffset="91.1" className="text-indigo-600" />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900 leading-none">75%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Trust Verification Score</h3>
                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                    Most of your government integrations are valid. Please address the <span className="text-rose-500 font-black">NTSA</span> record to maintain full eligibility for ride-sharing services.
                </p>
            </div>
        </div>

        {/* Agency Detail Grid */}
        <div className="space-y-6">
          <AgencyCard 
            title="Kenya Revenue Authority" 
            subtitle="Tax & PIN Compliance" 
            status={compliance?.kra_status} 
            lastChecked={compliance?.kra_last_checked}
            meta={{ label: 'PIN', value: user?.kra_pin }}
            icon="🏛️"
            styles={getStatusStyles(compliance?.kra_status)}
            formatDate={formatDate}
          />
          
          <AgencyCard 
            title="NTSA" 
            subtitle="Licensing & Safety" 
            status={compliance?.ntsa_status} 
            lastChecked={compliance?.ntsa_last_checked}
            meta={{ label: 'License Expiry', value: formatDate(compliance?.ntsa_expiry) }}
            icon="🚗"
            styles={getStatusStyles(compliance?.ntsa_status)}
            formatDate={formatDate}
          />

          <AgencyCard 
            title="NHIF Status" 
            subtitle="National Health Coverage" 
            status={compliance?.nhif_status} 
            lastChecked={compliance?.nhif_last_checked}
            meta={{ label: 'Coverage', value: compliance?.nhif_coverage }}
            icon="🏥"
            styles={getStatusStyles(compliance?.nhif_status)}
            formatDate={formatDate}
          />

          <AgencyCard 
            title="NSSF Status" 
            subtitle="Social Security Records" 
            status={compliance?.nssf_status} 
            lastChecked={compliance?.nssf_last_checked}
            meta={{ label: 'Contributions', value: compliance?.nssf_contributions }}
            icon="📂"
            styles={getStatusStyles(compliance?.nssf_status)}
            formatDate={formatDate}
          />
        </div>

        {/* Security Notice */}
        <div className="mt-16 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
                <h3 className="text-2xl font-black tracking-tighter mb-4">Encryption & Privacy Notice</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    All government agency synchronization is handled via secure API gateways. UrbanLink does not store your raw credentials, only the verification tokens provided by the respective authorities.
                </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-600/10 blur-3xl rounded-full translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

// Agency Component for cleaner code
const AgencyCard = ({ title, subtitle, status, lastChecked, meta, icon, styles, formatDate }) => (
  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">{icon}</div>
      <div>
        <h4 className="font-black text-slate-900 tracking-tight uppercase text-sm">{title}</h4>
        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-0.5">{subtitle}</p>
        <p className="text-[10px] text-slate-300 font-medium mt-2">LAST SYNC: {formatDate(lastChecked)}</p>
      </div>
    </div>
    
    <div className="flex flex-col md:items-end gap-3">
        <div className={`px-4 py-1.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest ring-4 ${styles}`}>
            {status || 'Unknown'}
        </div>
        {meta && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-right">
                {meta.label}: <span className="text-slate-900 font-black">{meta.value || 'N/A'}</span>
            </div>
        )}
    </div>
  </div>
);

export default CompliancePage;