import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api'; // This is your apiClient
import toast, { Toaster } from 'react-hot-toast'; // Missing import

const ProfilePage = () => {
    const { user, token, updateProfile: updateLocalUser } = useAuth(); // Renamed context function
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        national_id: '',
        kra_pin: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                national_id: user.national_id || '',
                kra_pin: user.kra_pin || ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKRAChange = (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (val.length > 11) val = val.substring(0, 11);
        setFormData(prev => ({ ...prev, kra_pin: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Syncing with Central Registry...');

        try {
            // 1. Send data to backend using the authAPI put('/auth/profile')
            const response = await authAPI.updateProfile(formData);
            
            // 2. Update Global Auth Context so the Dashboard/Header updates name immediately
            if (updateLocalUser) {
                // response.data usually contains the updated user object from Laravel
                updateLocalUser(response.data.user || response.data); 
            }

            toast.success('Identity Updated Successfully', { id: toastId });
            setEditMode(false);
        } catch (error) {
            // Standardize Laravel validation error messages
            const errorMsg = error.response?.data?.errors 
                ? Object.values(error.response.data.errors)[0][0] 
                : (error.response?.data?.message || 'Update Rejected');
                
            toast.error(errorMsg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6 text-left">
                    <div>
                        <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-2 block">Citizen Identity</span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">My Profile.</h1>
                    </div>
                    {!editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                        >
                            Edit Credentials
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-10 space-y-8">
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Details</h3>
                                    <ProfileField label="Full Legal Name" name="name" value={formData.name} onChange={handleInputChange} disabled={!editMode} placeholder="As it appears on ID" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileField label="Mobile Number" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!editMode} placeholder="07XX XXX XXX" />
                                        <ProfileField label="National ID" name="national_id" value={formData.national_id} onChange={handleInputChange} disabled={!editMode} placeholder="8-digit number" maxLength="8" />
                                    </div>
                                </section>

                                <section className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Tax Compliance</h3>
                                    <ProfileField label="KRA PIN Number" name="kra_pin" value={formData.kra_pin} onChange={handleKRAChange} disabled={!editMode} placeholder="AXXXXXXXXXA" className="font-mono uppercase tracking-widest" />
                                </section>

                                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                                    <div className="flex gap-4">
                                        <span className="text-xl">🛡️</span>
                                        <p className="text-[11px] font-medium text-indigo-900 leading-relaxed">
                                            Your data is encrypted using AES-256. Changes to National ID or KRA PIN will trigger a re-verification with government registries.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {editMode && (
                                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4">
                                    <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                                        {loading ? 'Transmitting...' : 'Commit Changes'}
                                    </button>
                                    <button type="button" onClick={() => setEditMode(false)} className="px-10 bg-white border border-slate-200 text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification Radar</h3>
                            <div className="space-y-4">
                                <ComplianceBadge label="NTSA Registry" status={user?.national_id ? 'Verified' : 'Pending'} />
                                <ComplianceBadge label="KRA iTax" status={user?.kra_pin ? 'Verified' : 'Required'} />
                                <ComplianceBadge label="NSSF Status" status="Active" />
                                <ComplianceBadge label="SHA / NHIF" status="Verified" />
                            </div>
                            <button className="w-full mt-8 py-4 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                                View Full Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---
const ProfileField = ({ label, className = "", disabled, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input disabled={disabled} className={`w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-30 transition-all placeholder:text-slate-300 ${className}`} {...props} />
    </div>
);

const ComplianceBadge = ({ label, status }) => {
    const isVerified = status === 'Verified' || status === 'Active';
    return (
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{label}</span>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {status}
            </span>
        </div>
    );
};

export default ProfilePage;