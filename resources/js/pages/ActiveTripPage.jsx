import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Styling for Leaflet
import 'leaflet/dist/leaflet.css';

const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
    iconSize: [45, 45],
    iconAnchor: [22, 22],
});

const destinationIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

const ActiveTrip = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    
    const [ride, setRide] = useState(null);
    const [driverCoords, setDriverCoords] = useState([-1.286389, 36.817223]); // Default Nairobi
    const [tripStatus, setTripStatus] = useState('en_route'); // en_route, arrived, in_progress
    const [fare, setFare] = useState(0);

    useEffect(() => {
        fetchRideDetails();
        // Start GPS tracking simulation/broadcast
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newCoords = [pos.coords.latitude, pos.coords.longitude];
                setDriverCoords(newCoords);
                updateDriverLocation(newCoords);
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [id]);

    const fetchRideDetails = async () => {
        const res = await axios.get(`/api/driver/rides/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setRide(res.data.data);
        setFare(res.data.data.estimated_fare);
        setTripStatus(res.data.data.status);
    };

    const updateDriverLocation = async (coords) => {
        // Broadcast to Laravel Reverb via API
        axios.post(`/api/driver/update-location`, { 
            ride_id: id, 
            lat: coords[0], 
            lng: coords[1] 
        }, { headers: { 'Authorization': `Bearer ${token}` } });
    };

    const handleStatusUpdate = async (nextStatus) => {
        try {
            await axios.patch(`/api/driver/rides/${id}/status`, { status: nextStatus }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTripStatus(nextStatus);
            toast.success(`Trip status: ${nextStatus.replace('_', ' ')}`, {
                style: { background: '#0F172A', color: '#fff', fontWeight: 'bold' }
            });
            if (nextStatus === 'completed') navigate('/dashboard');
        } catch (err) {
            toast.error('Sync failed. Check connection.');
        }
    };

    if (!ride) return null;

    return (
        <div className="h-screen w-full bg-slate-900 relative overflow-hidden flex flex-col">
            
            {/* 1. Dynamic Header */}
            <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl pointer-events-auto border border-white">
                    <span className="text-indigo-600 font-black text-[9px] uppercase tracking-widest block mb-1">Destination</span>
                    <p className="text-slate-900 font-black text-sm max-w-[200px] truncate">{ride.dropoff_address}</p>
                </div>
                
                <div className="bg-emerald-600 p-4 rounded-3xl shadow-2xl pointer-events-auto text-white text-center min-w-[100px]">
                    <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-80">Est. Fare</span>
                    <p className="text-xl font-black tracking-tighter">KES {fare}</p>
                </div>
            </div>

            {/* 2. Full Screen Map */}
            <div className="flex-1 z-0">
                <MapContainer center={driverCoords} zoom={16} zoomControl={false} className="h-full w-full grayscale-[0.2]">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* Driver Marker */}
                    <Marker position={driverCoords} icon={carIcon} />
                    
                    {/* Destination Marker */}
                    <Marker position={[-1.2921, 36.8219]} icon={destinationIcon} /> 
                    
                    <RecenterMap position={driverCoords} />
                </MapContainer>
            </div>

            {/* 3. Driver Control Sheet */}
            <div className="bg-white rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-[1000]">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger</p>
                            <h4 className="text-lg font-black text-slate-900">{ride.citizen?.name || 'UrbanLink Citizen'}</h4>
                        </div>
                    </div>
                    <a href={`tel:${ride.citizen?.phone}`} className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl">
                        📞
                    </a>
                </div>

                {/* Progressive Action Buttons */}
                <div className="space-y-4">
                    {tripStatus === 'accepted' && (
                        <ActionButton 
                            onClick={() => handleStatusUpdate('arrived')} 
                            label="I Have Arrived" 
                            color="bg-indigo-600" 
                        />
                    )}
                    
                    {tripStatus === 'arrived' && (
                        <ActionButton 
                            onClick={() => handleStatusUpdate('in_progress')} 
                            label="Start Journey" 
                            color="bg-emerald-600" 
                        />
                    )}

                    {tripStatus === 'in_progress' && (
                        <ActionButton 
                            onClick={() => handleStatusUpdate('completed')} 
                            label="Complete Ride" 
                            color="bg-slate-900" 
                        />
                    )}

                    <button className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        Emergency / SOS
                    </button>
                </div>
            </div>
        </div>
    );
};

// Map Recenter Logic
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => { if (position) map.panTo(position); }, [position]);
    return null;
}

// Reusable Action Button
const ActionButton = ({ onClick, label, color }) => (
    <button 
        onClick={onClick}
        className={`w-full ${color} text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all`}
    >
        {label}
    </button>
);

export default ActiveTrip;