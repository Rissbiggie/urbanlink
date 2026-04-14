import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const NewApplicationPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [selectedService, setSelectedService] = useState(null);
    const [formData, setFormData] = useState({
        application_data: {},
        documents: []
    });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('/api/services', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setServices(response.data.data || []);
            } catch (err) {
                toast.error('Failed to load service registry');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [token]);

    const handleServiceSelect = (service) => {
        setSelectedService(service);
        // Reset dynamic data when switching services
        setFormData({ application_data: {}, documents: [] });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            application_data: { ...prev.application_data, [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const submitData = new FormData();
        submitData.append('service_category_id', selectedService.id);
        
        // Append nested application data for Laravel's handling
        Object.entries(formData.application_data).forEach(([key, value]) => {
            submitData.append(`application_data[${key}]`, value);
        });

        // Append multiple documents
        formData.documents.forEach((file) => {
            submitData.append('documents[]', file);
        });

        try {
            await axios.post('/api/applications', submitData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            toast.success('Application transmitted successfully');
            setTimeout(() => navigate('/applications'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <Toaster position="top-right" />
            
            {/* 1. Header Section */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Citizen Services</span>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">New Submission.</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* 2. Left Side: Service Catalog */}
                    <div className="lg:col-span-5 space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Available Registries</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className={`text-left p-6 rounded-[2rem] border-2 transition-all group ${
                                        selectedService?.id === service.id
                                            ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]'
                                            : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <span className={`text-3xl p-3 rounded-2xl ${
                                            selectedService?.id === service.id ? 'bg-white/20' : 'bg-slate-50'
                                        }`}>
                                            {service.icon || '📄'}
                                        </span>
                                        <div>
                                            <h3 className={`font-black tracking-tight ${selectedService?.id === service.id ? 'text-white' : 'text-slate-900'}`}>
                                                {service.name}
                                            </h3>
                                            <p className={`text-xs mt-1 leading-relaxed ${selectedService?.id === service.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {service.description}
                                            </p>
                                            {service.fee > 0 && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest mt-3 block ${selectedService?.id === service.id ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                                    Fee: KES {service.fee}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Right Side: Dynamic Form */}
                    <div className="lg:col-span-7">
                        {selectedService ? (
                            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-10 space-y-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Required Information</h2>
                                        <p className="text-slate-400 text-sm">Please fill out all mandatory fields for the <span className="text-blue-600 font-bold">{selectedService.name}</span>.</p>
                                    </div>

                                    <div className="space-y-6">
                                        {selectedService.required_fields?.map((field, idx) => (
                                            <DynamicField 
                                                key={idx} 
                                                field={field} 
                                                value={formData.application_data[field.name]}
                                                onChange={handleInputChange}
                                            />
                                        ))}

                                        {selectedService.requires_documents && (
                                            <div className="space-y-4 pt-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Support Documents (PDF/JPG)</label>
                                                <div className="relative group">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => setFormData(prev => ({ ...prev, documents: Array.from(e.target.files) }))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                                                        <span className="text-3xl mb-2">📤</span>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                            {formData.documents.length > 0 
                                                                ? `${formData.documents.length} Files Selected` 
                                                                : 'Click or Drag Documents'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Transmitting Data...' : 'Submit Final Application'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
                                <span className="text-5xl mb-4 grayscale opacity-20">📂</span>
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">No Service Selected</h3>
                                <p className="text-slate-400 text-sm max-w-xs mt-2">Select a government registry from the catalog on the left to begin your application.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const DynamicField = ({ field, value = '', onChange }) => {
    const baseClass = "w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300";
    
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'select' ? (
                <select
                    required={field.required}
                    value={value}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className={baseClass}
                >
                    <option value="">Choose Option</option>
                    {field.options?.map((opt, i) => (
                        <option key={i} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : field.type === 'textarea' ? (
                <textarea
                    required={field.required}
                    value={value}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    rows={4}
                    className={baseClass}
                    placeholder={field.placeholder}
                />
            ) : (
                <input
                    type={field.type}
                    required={field.required}
                    value={value}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className={baseClass}
                    placeholder={field.placeholder}
                />
            )}
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Accessing Service Registry</p>
    </div>
);

export default NewApplicationPage;