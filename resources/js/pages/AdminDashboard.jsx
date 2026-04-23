import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Users, UserCheck, Shield, Car, X, Activity, Briefcase, Landmark } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Registration State
  const [newUser, setNewUser] = useState({
    name: '', email: '', phone: '', role: 'citizen',
    national_id: '', password: '', password_confirmation: '',
    license_number: '', license_class: '', license_expiry: '',
    vehicle: { make: '', model: '', plate_number: '', vehicle_type: '' }
  });

  // Service State
  const [newService, setNewService] = useState({
    name: '', code: '', description: '', processing_time: '',
    required_documents: [''], is_active: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to sync dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Create base payload
    const payload = {
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      national_id: newUser.national_id,
      password: newUser.password,
      password_confirmation: newUser.password_confirmation,
    };

    // Fix: Only include driver/vehicle data if the role is 'driver'
    // This prevents the "vehicle type required" error for citizens and officers
    if (newUser.role === 'driver') {
      payload.license_number = newUser.license_number;
      payload.license_class = newUser.license_class;
      payload.license_expiry = newUser.license_expiry;
      payload.vehicle = newUser.vehicle;
    }

    try {
      await axios.post('/api/auth/register', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success(`${newUser.role} record established`);
      setShowUserModal(false);
      resetUserForm();
      fetchDashboardData();
    } catch (err) {
      const errorData = err.response?.data?.errors;
      toast.error(errorData ? Object.values(errorData)[0][0] : 'Registration failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      // Clean up empty document strings before sending
      const payload = {
        ...newService,
        required_documents: newService.required_documents.filter(d => d.trim() !== '')
      };
      
      await axios.post('/api/services', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Service provisioned successfully');
      setShowServiceModal(false);
      setNewService({ name: '', code: '', description: '', processing_time: '', required_documents: [''], is_active: true });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create service');
    } finally {
      setProcessing(false);
    }
  };

  const resetUserForm = () => {
    setNewUser({
      name: '', email: '', phone: '', role: 'citizen',
      national_id: '', password: '', password_confirmation: '',
      license_number: '', license_class: '', license_expiry: '',
      vehicle: { make: '', model: '', plate_number: '', vehicle_type: '' }
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toaster position="top-right" />

      {/* HEADER NAVIGATION */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-indigo-600" size={24} />
          <span className="font-black text-xl tracking-tight text-slate-900 uppercase italic">UrbanLink <span className="text-indigo-600">Admin</span></span>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">
            <Briefcase size={16} /> New Service
          </button>
          <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
            <Plus size={16} /> Register User
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10 text-left">
        {/* STATS CARDS - Updated to 5 columns to accommodate Officers */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          <StatCard icon={<Users size={24}/>} label="Citizens" value={stats?.overview?.citizens || 0} color="blue" />
          <StatCard icon={<Car size={24}/>} label="Drivers" value={stats?.overview?.drivers || 0} color="emerald" />
          
          {/* Added Officer Stat Card */}
          <StatCard icon={<Shield size={24}/>} label="Officers" value={stats?.overview?.officers || 0} color="indigo" />
          
          <StatCard icon={<Landmark size={24}/>} label="Admin Users" value={stats?.overview?.admins || 0} color="violet" />
          <StatCard icon={<UserCheck size={24}/>} label="Total Registered" value={stats?.overview?.total_users || 0} color="slate" />
        </div>

        {/* RIDE OVERVIEW MINI-GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="p-6 bg-white border border-slate-100 rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Rides</p>
              <h4 className="text-3xl font-black text-slate-900 mt-1">{stats?.overview?.total_rides || 0}</h4>
           </div>
           <div className="p-6 bg-white border border-slate-100 rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed Rides</p>
              <h4 className="text-3xl font-black text-emerald-600 mt-1">{stats?.overview?.completed_rides || 0}</h4>
           </div>
           <div className="p-6 bg-white border border-slate-100 rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Apps</p>
              <h4 className="text-3xl font-black text-indigo-600 mt-1">{stats?.overview?.pending_applications || 0}</h4>
           </div>
        </div>
      </div>

      {/* MODAL: REGISTER USER */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl my-auto shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">System Provision.</h2>
                <button onClick={() => setShowUserModal(false)}><X className="text-slate-300" /></button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <InputGroup label="Email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="citizen">Citizen</option>
                    <option value="driver">Driver</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <InputGroup label="Phone" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              </div>

              <InputGroup label="National ID" value={newUser.national_id} onChange={e => setNewUser({...newUser, national_id: e.target.value})} />

              {newUser.role === 'driver' && (
                <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-3 gap-4">
                    <InputGroup label="License No." value={newUser.license_number} onChange={e => setNewUser({...newUser, license_number: e.target.value})} />
                    <InputGroup label="Class" value={newUser.license_class} onChange={e => setNewUser({...newUser, license_class: e.target.value})} />
                    <InputGroup label="Expiry" type="date" value={newUser.license_expiry} onChange={e => setNewUser({...newUser, license_expiry: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Plate No." value={newUser.vehicle.plate_number} onChange={e => setNewUser({...newUser, vehicle: {...newUser.vehicle, plate_number: e.target.value.toUpperCase()}})} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Type</label>
                      <select required value={newUser.vehicle.vehicle_type} onChange={e => setNewUser({...newUser, vehicle: {...newUser.vehicle, vehicle_type: e.target.value}})} className="w-full px-5 py-4 bg-white rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select Category</option>
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="comfort">Comfort</option>
                        <option value="xl">XL</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <InputGroup label="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <InputGroup label="Confirm" type="password" value={newUser.password_confirmation} onChange={e => setNewUser({...newUser, password_confirmation: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-400">Abort</button>
                <button type="submit" disabled={processing} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">
                  {processing ? 'Processing...' : 'Commit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SERVICE */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">New Service provision.</h2>
              <button onClick={() => setShowServiceModal(false)}><X className="text-slate-300" /></button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                <InputGroup label="Service Code" value={newService.code} onChange={e => setNewService({...newService, code: e.target.value.toUpperCase()})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                ></textarea>
              </div>

              <InputGroup label="Est. Processing Time" placeholder="e.g. 3-5 Working Days" value={newService.processing_time} onChange={e => setNewService({...newService, processing_time: e.target.value})} />

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Required Documents</label>
                {newService.required_documents.map((doc, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 px-5 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. National ID Copy"
                      value={doc}
                      onChange={(e) => {
                        const docs = [...newService.required_documents];
                        docs[index] = e.target.value;
                        setNewService({...newService, required_documents: docs});
                      }}
                    />
                    {index > 0 && (
                      <button type="button" onClick={() => {
                        const docs = newService.required_documents.filter((_, i) => i !== index);
                        setNewService({...newService, required_documents: docs});
                      }} className="p-3 text-rose-500 bg-rose-50 rounded-xl"><X size={16}/></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setNewService({...newService, required_documents: [...newService.required_documents, '']})} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ Add Document Requirement</button>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancel</button>
                <button type="submit" disabled={processing} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                  {processing ? 'Provisioning...' : 'Deploy Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, type = "text", ...props }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <input type={type} required className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" {...props} />
  </div>
);

const StatCard = ({ icon, label, value, color }) => {
  const themes = {
    blue: 'text-blue-600 bg-blue-50', 
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50', 
    slate: 'text-slate-600 bg-slate-50',
    indigo: 'text-indigo-600 bg-indigo-50'
  };
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
      <div className={`inline-flex p-4 rounded-xl mb-6 ${themes[color]}`}>{icon}</div>
      <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{value}</h3>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default AdminDashboard;