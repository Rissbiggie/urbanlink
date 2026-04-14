import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { rideAPI } from '../api';
import { Navigation, ChevronRight, Car, MapPin, CreditCard } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RequestRidePage = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('pickup'); // 'pickup' | 'dropoff' | 'confirm'
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState(null);

    const [formData, setFormData] = useState({
        pickup_lat: -1.286389,
        pickup_lng: 36.817223,
        pickup_address: 'Identifying location...',
        dropoff_lat: -1.3191,
        dropoff_lng: 36.8365,
        dropoff_address: 'Slide map to set destination',
        vehicle_type: 'xl', // Defaulting to XL based on your sample
        payment_method: 'mpesa'
    });

    /**
     * Map Interaction - Updates coordinates as user drags the map
     */
    const MapTracker = () => {
        useMapEvents({
            moveend: (e) => {
                const center = e.target.getCenter();
                handleLocationSync(center.lat, center.lng);
            },
        });
        return null;
    };

    const handleLocationSync = async (lat, lng) => {
        if (viewMode === 'confirm') return;

        const field = viewMode;
        setFormData(prev => ({
            ...prev,
            [`${field}_lat`]: lat,
            [`${field}_lng`]: lng,
            [`${field}_address`]: 'Scanning area...'
        }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            // Get a cleaner address (Street, Suburb)
            const parts = data.display_name.split(',');
            const shortName = parts.length > 2 ? `${parts[0]}, ${parts[1]}` : data.display_name;
            
            setFormData(prev => ({
                ...prev,
                [`${field}_address`]: shortName
            }));
        } catch (err) {
            console.error("Geocoding failed");
        }
    };

    /**
     * Step 1: Initialize Fleet Search (Get Quote)
     */
    const getFareQuote = async () => {
        setLoading(true);
        const toastId = toast.loading('Syncing with Dispatcher...');
        
        try {
            // MATCHING YOUR API PAYLOAD EXACTLY
            const payload = {
                distance_km: "1",
                duration_minutes: "55",
                vehicle_type: formData.vehicle_type
            };

            const response = await rideAPI.estimate(payload);

            if (response.data && response.data.fare) {
                setQuote(response.data); 
                setViewMode('confirm');
                toast.success('Route Optimized', { id: toastId });
            }
        } catch (err) {
            console.error("API Error:", err.response?.data);
            toast.error(err.response?.data?.message || 'Service currently unavailable', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 2: Confirm Ride Request
     */
   const handleFinalRequest = async () => {
    setLoading(true);
    const toastId = toast.loading('Broadcasting signal to nearby drivers...');

    try {
        const payload = {
            pickup_lat: formData.pickup_lat,
            pickup_lng: formData.pickup_lng,
            pickup_address: formData.pickup_address,
            dropoff_lat: formData.dropoff_lat,
            dropoff_lng: formData.dropoff_lng,
            dropoff_address: formData.dropoff_address,
            vehicle_type: formData.vehicle_type,
            payment_method: formData.payment_method
        };

        const response = await rideAPI.request(payload);

        /**
         * FIX: Safely extract the ID. 
         * Most Laravel/Node APIs wrap data in a 'data' key.
         * We check: response.data.id OR response.data.data.id
         */
        const rideId = response.data?.id || response.data?.data?.id;

        if (rideId) {
            toast.success('Signal Received', { id: toastId });
            // Ensure this navigate string exactly matches your AppRouter path
            navigate(`/rides/${rideId}`);
        } else {
            console.error("API Response structure mismatch:", response.data);
            throw new Error("No ride ID found in response");
        }

    } catch (err) {
        console.error("Dispatch transmission error:", err);
        // Display the specific error message from the backend if available
        const errorMsg = err.response?.data?.message || 'Dispatch transmission failed';
        toast.error(errorMsg, { id: toastId });
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="h-screen w-full relative bg-slate-900 overflow-hidden font-sans">
            <Toaster position="top-center" reverseOrder={false} />

            {/* FULL SCREEN MAP LAYER */}
            <MapContainer 
                center={[formData.pickup_lat, formData.pickup_lng]} 
                zoom={16} 
                className="h-full w-full z-0 grayscale-[0.2] contrast-[1.1]"
                zoomControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapTracker />
            </MapContainer>

            {/* FIXED CENTER PIN */}
            {viewMode !== 'confirm' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] z-[10] pointer-events-none flex flex-col items-center">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl mb-2 animate-bounce">
                        SET {viewMode}
                    </div>
                    <div className="w-10 h-10 bg-indigo-600 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center text-white">
                        <MapPin size={20} />
                    </div>
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-b-full shadow-xl" />
                </div>
            )}

            {/* INTERFACE OVERLAY */}
            <div className="absolute bottom-0 left-0 right-0 z-[20] p-6 pointer-events-none">
                <div className="max-w-xl mx-auto pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white p-8 space-y-6">
                        
                        {viewMode !== 'confirm' ? (
                            <>
                                {/* Step Selection Toggle */}
                                <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem]">
                                    <button 
                                        onClick={() => setViewMode('pickup')}
                                        className={`flex-1 py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'pickup' ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-400'}`}
                                    >
                                        1. Pick Up
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('dropoff')}
                                        className={`flex-1 py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'dropoff' ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-400'}`}
                                    >
                                        2. Drop Off
                                    </button>
                                </div>

                                {/* Address Details */}
                                <div className="space-y-4">
                                    <AddressCard 
                                        label="Origin" 
                                        address={formData.pickup_address} 
                                        active={viewMode === 'pickup'} 
                                        icon="A"
                                    />
                                    <AddressCard 
                                        label="Destination" 
                                        address={formData.dropoff_address} 
                                        active={viewMode === 'dropoff'} 
                                        icon="B"
                                    />
                                </div>

                                <button 
                                    onClick={viewMode === 'pickup' ? () => setViewMode('dropoff') : getFareQuote}
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
                                >
                                    {viewMode === 'pickup' ? 'Continue' : 'Initialize Fleet Search'}
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        ) : (
                            /* CONFIRMATION UI */
                            <div className="space-y-8 animate-in slide-in-from-bottom-8">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Fare</p>
                                        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">
                                            <span className="text-xs mr-2 text-indigo-600 font-medium not-italic">KES</span>
                                            {quote?.fare}
                                        </h2>
                                    </div>
                                    <button onClick={() => setViewMode('pickup')} className="text-[10px] font-black text-indigo-600 underline underline-offset-4">RESET</button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {['economy', 'comfort', 'xl'].map((tier) => (
                                        <button 
                                            key={tier}
                                            onClick={() => setFormData({...formData, vehicle_type: tier})}
                                            className={`p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${formData.vehicle_type === tier ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-slate-50 grayscale hover:grayscale-0'}`}
                                        >
                                            <span className="text-2xl">{tier === 'economy' ? '🚲' : tier === 'comfort' ? '🚗' : '🚐'}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-900">{tier}</span>
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    onClick={handleFinalRequest}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
                                >
                                    {loading ? 'Transmitting...' : 'Confirm Dispatch'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddressCard = ({ label, address, active, icon }) => (
    <div className={`p-5 rounded-[1.8rem] border-2 transition-all flex items-center gap-5 ${active ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 opacity-60'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg ${active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            {icon}
        </div>
        <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{address}</p>
        </div>
    </div>
);

export default RequestRidePage;