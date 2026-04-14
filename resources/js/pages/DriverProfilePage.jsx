import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const DriverProfilePage = () => {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        license_number: '',
        license_expiry: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        vehicle_color: '',
        plate_number: '',
        seating_capacity: 4
    });

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/driver/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = response.data.data || response.data;
            setProfile(data);
            setFormData({
                license_number: data.license_number || '',
                license_expiry: data.license_expiry || '',
                vehicle_make: data.vehicle?.make || '',
                vehicle_model: data.vehicle?.model || '',
                vehicle_year: data.vehicle?.year || '',
                vehicle_color: data.vehicle?.color || '',
                plate_number: data.vehicle?.plate_number || '',
                seating_capacity: data.vehicle?.seating_capacity || 4
            });
        } catch (err) {
            toast.error('Identity sync failed');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const uploadFormData = new FormData();
            uploadFormData.append('document', file);
            uploadFormData.append('type', type);

            const loadingToast = toast.loading(`Uploading ${type.replace('_', ' ')}...`);
            try {
                await axios.post('/api/driver/documents', uploadFormData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data', 
                        'Authorization': `Bearer ${token}` 
                    }
                });
                toast.success('Document received for verification', { id: loadingToast });
                fetchProfile();
            } catch (err) {
                toast.error('Upload failed. Try again.', { id: loadingToast });
            }
        };
        input.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData = {
                license_number: formData.license_number,
                license_expiry: formData.license_expiry,
                vehicle: {
                    make: formData.vehicle_make,
                    model: formData.vehicle_model,
                    year: parseInt(formData.vehicle_year),
                    color: formData.vehicle_color,
                    plate_number: formData.plate_number,
                    seating_capacity: parseInt(formData.seating_capacity)
                }
            };

            await axios.put('/api/driver/profile', updateData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success('Credentials Updated');
            setEditMode(false);
            fetchProfile();
        } catch (err) {
            toast.error('Update rejected by server');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Personnel File</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Profile.</h1>
                    </div>
                    {!editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                        >
                            Modify Credentials
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Side: Forms */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-10 space-y-12">
                                
                                {/* 1. Personal & Licensing */}
                                <section>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">🪪</span>
                                        Identity & Licensing
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileInput label="Full Name" value={user?.name} disabled />
                                        <ProfileInput label="Email Address" value={user?.email} disabled />
                                        <ProfileInput 
                                            label="License Number" 
                                            name="license_number"
                                            value={formData.license_number} 
                                            onChange={handleInputChange} 
                                            disabled={!editMode} 
                                        />
                                        <ProfileInput 
                                            label="License Expiry" 
                                            name="license_expiry"
                                            type="date"
                                            value={formData.license_expiry} 
                                            onChange={handleInputChange} 
                                            disabled={!editMode} 
                                        />
                                    </div>
                                </section>

                                {/* 2. Vehicle Config */}
                                <section>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">🚗</span>
                                        Vehicle Configuration
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileInput label="Make" name="vehicle_make" value={formData.vehicle_make} onChange={handleInputChange} disabled={!editMode} />
                                        <ProfileInput label="Model" name="vehicle_model" value={formData.vehicle_model} onChange={handleInputChange} disabled={!editMode} />
                                        <ProfileInput label="Plate Number" name="plate_number" value={formData.plate_number} onChange={handleInputChange} disabled={!editMode} className="font-mono uppercase" />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seating Capacity</label>
                                            <select
                                                name="seating_capacity"
                                                value={formData.seating_capacity}
                                                onChange={handleInputChange}
                                                disabled={!editMode}
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 appearance-none"
                                            >
                                                {[4,5,6,7].map(n => <option key={n} value={n}>{n} Seats</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Document Vault */}
                                <section>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">📁</span>
                                        Compliance Documents
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DocumentUploadCard 
                                            label="National Driving License" 
                                            status={profile?.license_status || 'missing'} 
                                            onUpload={() => handleFileUpload('license')}
                                            disabled={!editMode}
                                        />
                                        <DocumentUploadCard 
                                            label="PSV Insurance" 
                                            status={profile?.insurance_status || 'missing'} 
                                            onUpload={() => handleFileUpload('insurance')}
                                            disabled={!editMode}
                                        />
                                    </div>
                                </section>
                            </div>

                            {editMode && (
                                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                                    >
                                        {saving ? 'Transmitting...' : 'Commit Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditMode(false); fetchProfile(); }}
                                        className="px-10 bg-white border border-slate-200 text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                                    >
                                        Abort
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Side: Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Verification Status */}
                        <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${
                            profile?.status === 'active' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                        }`}>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Account Status</span>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-4 h-4 rounded-full ${profile?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{profile?.status || 'Pending'}</h2>
                            </div>
                            <div className="space-y-4">
                                <StatRow label="Global Rating" value={`⭐ ${profile?.average_rating?.toFixed(1) || '5.0'}`} />
                                <StatRow label="Trips" value={profile?.total_rides || 0} />
                                <StatRow label="Joined" value={new Date(user.created_at).getFullYear()} />
                            </div>
                        </div>

                        {/* Revenue Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Lifetime Revenue</span>
                            <h2 className="text-4xl font-black tracking-tighter italic mb-8">KES {profile?.total_earnings?.toLocaleString() || 0}</h2>
                            <div className="absolute -right-4 -top-4 text-9xl opacity-10 group-hover:scale-110 transition-transform select-none">💰</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const ProfileInput = ({ label, disabled, className = "", ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            disabled={disabled}
            className={`w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all ${className}`}
            {...props}
        />
    </div>
);

const DocumentUploadCard = ({ label, status, onUpload, disabled }) => {
    const statusConfig = {
        verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: '✅' },
        pending: { bg: 'bg-amber-50', text: 'text-amber-600', icon: '⏳' },
        missing: { bg: 'bg-slate-50', text: 'text-slate-400', icon: '📤' },
        rejected: { bg: 'bg-red-50', text: 'text-red-600', icon: '❌' }
    };
    const current = statusConfig[status] || statusConfig.missing;

    return (
        <div className={`p-6 rounded-[2rem] border-2 border-dashed border-slate-200 transition-all flex flex-col items-center text-center ${!disabled && (status === 'missing' || status === 'rejected') ? 'hover:border-indigo-400 cursor-pointer' : ''}`} onClick={!disabled && (status === 'missing' || status === 'rejected') ? onUpload : null}>
            <div className="w-full flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${current.bg} ${current.text}`}>{status}</span>
            </div>
            <span className="text-3xl mb-2">{current.icon}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                {status === 'missing' ? 'Click to Upload' : status === 'pending' ? 'Reviewing' : status}
            </p>
        </div>
    );
};

const StatRow = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
);

const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Authenticating Payload</p>
    </div>
);

export default DriverProfilePage;