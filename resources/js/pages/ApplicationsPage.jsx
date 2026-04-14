import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function NewApplicationPage() {
    const { token } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    
    // Selection State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const res = await axios.get('/api/service-categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data.data || []);
        } catch (err) {
            console.error("Failed to load categories");
        } finally {
            setFetching(false);
        }
    };

    const handleCategorySelect = async (category) => {
        setSelectedCategory(category);
        setSelectedService(null);
        setFetching(true);
        try {
            const res = await axios.get(`/api/services?category_id=${category.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(res.data.data || []);
        } catch (err) {
            console.error("Failed to load services");
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/applications', {
                government_service_id: selectedService.id,
                form_data: formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/applications');
        } catch (err) {
            alert("Submission failed. Check your details.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching && categories.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse font-black text-indigo-600 uppercase tracking-widest text-xs">Initializing Portal</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-4xl mx-auto px-6 pt-16">
                
                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-12">
                    <div className={`h-2 flex-1 rounded-full ${selectedCategory ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${selectedService ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${loading ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                </div>

                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">New Service Request</h1>
                    <p className="text-slate-500 font-medium mt-2">Follow the steps below to initiate your application.</p>
                </header>

                {/* STEP 1: Category Selection */}
                {!selectedCategory && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-left hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-100 transition-all group"
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">📁</div>
                                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{cat.name}</h3>
                                <p className="text-slate-400 text-sm mt-2 font-medium">{cat.description || 'Access various public services in this category.'}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 2: Service Selection within Category */}
                {selectedCategory && !selectedService && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <button onClick={() => setSelectedCategory(null)} className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            ← Change Category
                        </button>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">{selectedCategory.name} Services</h2>
                        {services.map(svc => (
                            <button 
                                key={svc.id}
                                onClick={() => setSelectedService(svc)}
                                className="w-full bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center hover:border-indigo-600 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">{svc.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{svc.requirements || 'Standard requirements'}</p>
                                </div>
                                <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 3: Dynamic Form Submission */}
                {selectedService && (
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <h2 className="font-black text-slate-900 uppercase tracking-tighter">{selectedService.name}</h2>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{selectedCategory.name}</p>
                            </div>
                            <button onClick={() => setSelectedService(null)} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest">Cancel</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* DYNAMIC FIELDS LOGIC */}
                                {/* In a real app, 'form_schema' would come from your DB. For now, we use a standard professional layout */}
                                <FormField label="Identification Number" placeholder="ID No / Passport" onChange={(v) => handleInputChange('id_number', v)} />
                                <FormField label="Contact Number" placeholder="254..." onChange={(v) => handleInputChange('phone', v)} />
                                <div className="md:col-span-2">
                                    <FormField label="Reason for Application" placeholder="Provide a brief context..." isTextArea onChange={(v) => handleInputChange('reason', v)} />
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                                <p className="text-amber-800 text-xs font-bold leading-relaxed">
                                    <span className="mr-2">⚠️</span>
                                    By submitting, you agree that the information provided is accurate and you consent to the processing of this application as per UrbanLink's privacy policy.
                                </p>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Processing Transaction...' : 'Confirm and Submit'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

// Reusable Professional Field Component
function FormField({ label, placeholder, isTextArea = false, onChange }) {
    const baseClasses = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400";
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
            {isTextArea ? (
                <textarea rows="4" placeholder={placeholder} className={baseClasses} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <input type="text" placeholder={placeholder} className={baseClasses} onChange={(e) => onChange(e.target.value)} />
            )}
        </div>
    );
}