import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// If using Lucide or Heroicons, you can replace emojis with icons here
import { Users, Car, MapPin, DollarSign, Clock, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, usersRes, appsRes, paymentsRes] = await Promise.all([
        axios.get('/api/admin/dashboard', { headers }),
        axios.get('/api/admin/users?limit=8', { headers }),
        axios.get('/api/applications?limit=6', { headers }),
        axios.get('/api/payments?limit=6', { headers })
      ]);

      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
      setApplications(appsRes.data.data || []);
      setRecentPayments(paymentsRes.data.data || []);
      setError(null);
    } catch (err) {
      setError('System sync failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 uppercase">Syncing</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar (Optional/Simplified) */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
         <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">⚙️</div>
            <span className="font-black text-xl tracking-tight text-slate-900">URBAN<span className="text-indigo-600">LINK</span> ADMIN</span>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-500 font-medium">System Superuser</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} alt="Admin" />
            </div>
         </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Platform Users', value: stats?.total_users, sub: 'Total registered', icon: '👥', color: 'blue' },
            { label: 'Active Drivers', value: stats?.active_drivers, sub: 'On duty now', icon: '🚗', color: 'emerald' },
            { label: 'Revenue (Total)', value: `KES ${stats?.total_revenue?.toLocaleString()}`, sub: 'All-time earnings', icon: '💰', color: 'indigo' },
            { label: 'Pending Verification', value: stats?.pending_applications, sub: 'Needs review', icon: '📋', color: 'orange' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${item.color}-50 text-xl`}>{item.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Live</span>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{item.label}</h3>
              <p className="text-2xl font-black text-slate-900 mt-1">{item.value || 0}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Activity Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* User Management Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">User Management</h2>
                <Link to="/admin/users" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Manage All</Link>
              </div>
              <div className="overflow-x-auto px-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-4 py-4">Identity</th>
                      <th className="px-4 py-4">Permission</th>
                      <th className="px-4 py-4">Auth Status</th>
                      <th className="px-4 py-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{u.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${
                                u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                            }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${u.email_verified_at ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                <span className="text-[11px] font-bold text-slate-600">{u.email_verified_at ? 'Verified' : 'Pending'}</span>
                            </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link to={`/admin/users/${u.id}`} className="p-2 hover:bg-white rounded-lg inline-block border border-transparent hover:border-slate-200 transition-all">
                             🔍
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Applications & Payments Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <SectionCard title="New Applications" link="/admin/applications">
                  {applications.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">📋</div>
                            <div>
                                <p className="text-xs font-black text-slate-900 leading-none mb-1">{app.reference_number}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{app.user?.name}</p>
                            </div>
                        </div>
                        <Link to={`/admin/applications/${app.id}`} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Review</Link>
                    </div>
                  ))}
               </SectionCard>

               <SectionCard title="Recent Ledger" link="/admin/payments">
                  {recentPayments.map(pay => (
                    <div key={pay.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">💰</div>
                            <div>
                                <p className="text-xs font-black text-emerald-700 leading-none mb-1">KES {pay.amount?.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{pay.status}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 italic">#{pay.id}</span>
                    </div>
                  ))}
               </SectionCard>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-black text-xl mb-2 tracking-tight">System Integrity</h3>
                    <p className="text-slate-400 text-sm mb-6 font-medium">Platform heart-beat monitoring.</p>
                    
                    <div className="space-y-4">
                        <StatusLine label="Backend API" status="online" />
                        <StatusLine label="M-Pesa Gateway" status="online" />
                        <StatusLine label="Database Cluster" status="stable" />
                        <StatusLine label="Worker Queues" status="processing" />
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                        <button className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-xs font-black uppercase transition-colors">Settings</button>
                        <button className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-xs font-black uppercase transition-colors">View Logs</button>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/20 blur-3xl rounded-full"></div>
            </div>

            <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100">
                <h3 className="font-black text-indigo-900 text-lg mb-4">Quick Insights</h3>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Revenue Velocity</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-3/4"></div>
                    </div>
                    <p className="text-xs font-bold text-slate-600 mt-3">75% of daily target reached</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components to keep code clean ---

const SectionCard = ({ title, link, children }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-slate-900 text-sm uppercase tracking-tighter">{title}</h2>
            <Link to={link} className="text-indigo-600 font-bold text-xs">All →</Link>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const StatusLine = ({ label, status }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
            status === 'online' || status === 'stable' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
        }`}>{status}</span>
    </div>
);

export default AdminDashboard;