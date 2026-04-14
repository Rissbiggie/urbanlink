import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const UsersManagementPage = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ role: '', status: '', search: '' });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/users', {
                params: filters,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data.data || response.data);
        } catch (err) {
            toast.error('Registry access denied or server offline');
        } finally {
            setLoading(false);
        }
    }, [filters, token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusUpdate = async (userId, newStatus) => {
        const toastId = toast.loading('Updating user status...');
        try {
            await axios.patch(`/api/admin/users/${userId}/status`, 
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` }}
            );
            toast.success('Registry updated', { id: toastId });
            fetchUsers();
        } catch (err) {
            toast.error('Protocol override failed', { id: toastId });
        }
    };

    if (loading && users.length === 0) return <LoadingPulse />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            {/* Header: Administrative Aesthetic */}
            <div className="bg-slate-900 pt-16 pb-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">System Administration</span>
                        <h1 className="text-5xl font-black text-white tracking-tighter italic">User Registry.</h1>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Global access control and identity management</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-rose-600/10 border border-rose-500/20 text-rose-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                            ⚠️ System Lockdown
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10">
                {/* 1. Filter Command Bar */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 mb-10 flex flex-wrap gap-6 items-end">
                    <FilterInput 
                        label="Identity Search" 
                        placeholder="Name, Email or National ID..." 
                        value={filters.search}
                        onChange={(val) => setFilters(f => ({...f, search: val}))}
                        className="flex-1 min-w-[300px]"
                    />
                    <FilterDropdown 
                        label="Assigned Role"
                        value={filters.role}
                        onChange={(val) => setFilters(f => ({...f, role: val}))}
                        options={[
                            {label: 'All Roles', value: ''},
                            {label: 'Citizen', value: 'citizen'},
                            {label: 'Driver', value: 'driver'},
                            {label: 'Officer', value: 'government_officer'},
                            {label: 'Admin', value: 'admin'},
                        ]}
                    />
                    <FilterDropdown 
                        label="Lifecycle Status"
                        value={filters.status}
                        onChange={(val) => setFilters(f => ({...f, status: val}))}
                        options={[
                            {label: 'All Status', value: ''},
                            {label: 'Active', value: 'active'},
                            {label: 'Suspended', value: 'suspended'},
                        ]}
                    />
                </div>

                {/* 2. Registry Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map((u) => (
                                <tr key={u.id} className="group hover:bg-blue-50/30 transition-all">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-white group-hover:shadow-md transition-all">
                                                {u.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 tracking-tight">{u.name}</p>
                                                <p className="text-xs font-medium text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <RoleBadge role={u.role} />
                                    </td>
                                    <td className="p-8">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ActivityPulse date={u.last_login_at} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                                                    {u.last_login_at ? 'Live Status' : 'Offline'}
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                {u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-GB') : 'No recent login'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(u.created_at).toLocaleDateString('en-GB')}
                                        </p>
                                    </td>
                                    <td className="p-8 text-right">
                                        <select
                                            value={u.status || 'active'}
                                            onChange={(e) => handleStatusUpdate(u.id, e.target.value)}
                                            className="bg-slate-100 border-none rounded-xl px-4 py-2 text-[10px] font-black text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none outline-none"
                                        >
                                            <option value="active">Activate</option>
                                            <option value="inactive">Deactivate</option>
                                            <option value="suspended">Suspend Access</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {users.length === 0 && !loading && (
                        <div className="p-24 text-center">
                            <span className="text-5xl mb-4 block">🔍</span>
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">No Identities Found</h3>
                            <p className="text-slate-400 text-sm mt-2">Adjust your search parameters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Atomic Components ---

const ActivityPulse = ({ date }) => {
    if (!date) return <div className="w-2 h-2 rounded-full bg-slate-200" />;

    const lastSeen = new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now - lastSeen) / 36e5;

    const pulseColor = diffInHours < 1 ? 'bg-emerald-500' : 
                      diffInHours < 24 ? 'bg-blue-500' : 'bg-slate-300';

    return (
        <div className="relative flex h-2 w-2">
            {diffInHours < 1 && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`}></span>
        </div>
    );
};

const RoleBadge = ({ role }) => {
    const colors = {
        admin: "bg-rose-100 text-rose-600 border-rose-200",
        government_officer: "bg-orange-100 text-orange-600 border-orange-200",
        driver: "bg-emerald-100 text-emerald-600 border-emerald-200",
        citizen: "bg-blue-100 text-blue-600 border-blue-200"
    };
    return (
        <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${colors[role] || colors.citizen}`}>
            {role?.replace('_', ' ')}
        </span>
    );
};

const FilterInput = ({ label, className, onChange, ...props }) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input 
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
            onChange={(e) => onChange(e.target.value)}
            {...props} 
        />
    </div>
);

const FilterDropdown = ({ label, options, value, onChange }) => (
    <div className="space-y-2 min-w-[180px]">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const LoadingPulse = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Querying Master Registry</p>
    </div>
);

export default UsersManagementPage;