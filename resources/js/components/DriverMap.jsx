import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. Fix default icon paths for Leaflet in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/**
 * HELPER: Simple distance calculation for initial sorting
 */
function haversineDistance([lat1, lng1], [lat2, lng2]) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * COMPONENT: Auto-adjust map zoom to see all markers
 */
function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (!bounds || bounds.length === 0) return;
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [map, bounds]);
    return null;
}

/**
 * MAIN MAP COMPONENT
 */
export default function DriverMap({
    driverLocation,
    requests = [],
    otherDrivers = [],
    activeRides = [],
    activeRequest,
    assignedRide,
    height = '100%', // Changed to 100% to fill container
}) {
    const [routeGeo, setRouteGeo] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);

    // --- 1. Markers Logic ---
    const markers = useMemo(() => {
        const items = [];

        // Driver's current position
        if (driverLocation) {
            items.push({
                key: 'driver',
                label: 'YOUR LOCATION',
                position: [driverLocation.lat, driverLocation.lng],
                isDriver: true
            });
        }

        // Assigned Job: Pickup and Dropoff
        if (assignedRide) {
            const pLat = Number(assignedRide.pickup_lat);
            const pLng = Number(assignedRide.pickup_lng);
            const dLat = Number(assignedRide.dropoff_lat);
            const dLng = Number(assignedRide.dropoff_lng);

            if (pLat && pLng) {
                items.push({
                    key: `pickup-${assignedRide.id}`,
                    label: `PICKUP: ${assignedRide.ride_reference}`,
                    position: [pLat, pLng],
                    address: assignedRide.pickup_address,
                    type: 'pickup'
                });
            }
            if (dLat && dLng) {
                items.push({
                    key: `dropoff-${assignedRide.id}`,
                    label: `DROPOFF: ${assignedRide.ride_reference}`,
                    position: [dLat, dLng],
                    address: assignedRide.dropoff_address,
                    type: 'dropoff'
                });
            }
        }

        // Generic Requests
        requests.forEach((req) => {
            if (req?.pickup?.lat && req?.pickup?.lng) {
                items.push({
                    key: `req-${req.ride_id}`,
                    label: `REQUEST: ${req.ride_reference}`,
                    position: [req.pickup.lat, req.pickup.lng],
                    address: req.pickup.address,
                    type: 'request'
                });
            }
        });

        return items;
    }, [driverLocation, requests, assignedRide]);

    // --- 2. Routing Logic (OSRM API) ---
    useEffect(() => {
        if (!assignedRide) {
            setRouteGeo(null);
            setRouteInfo(null);
            return;
        }

        const pLat = Number(assignedRide.pickup_lat);
        const pLng = Number(assignedRide.pickup_lng);
        const dLat = Number(assignedRide.dropoff_lat);
        const dLng = Number(assignedRide.dropoff_lng);

        if (!pLat || !pLng || !dLat || !dLng) return;

        const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.routes?.[0]) {
                    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                    setRouteGeo(coords);
                    setRouteInfo({
                        distance: data.routes[0].distance / 1000, // to KM
                        duration: Math.round(data.routes[0].duration / 60) // to Min
                    });
                }
            })
            .catch(() => console.error("Routing error"));
    }, [assignedRide]);

    // Bounds for FitBounds
    const bounds = useMemo(() => markers.map(m => m.position), [markers]);

    return (
        <div className="relative w-full h-full">
            <MapContainer 
                center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [0, 0]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.map((m) => (
                    <Marker key={m.key} position={m.position}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-black text-[10px] uppercase tracking-widest text-emerald-600 mb-1">{m.label}</p>
                                {m.address && <p className="text-[11px] font-bold text-slate-700 leading-tight">{m.address}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {routeGeo && (
                    <Polyline 
                        positions={routeGeo} 
                        pathOptions={{ color: '#10b981', weight: 5, opacity: 0.7, lineJoin: 'round' }} 
                    />
                )}

                <FitBounds bounds={bounds} />
            </MapContainer>

            {/* Floating Info Card */}
            {routeInfo && (
                <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex gap-6 border border-slate-700">
                    <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Distance</p>
                        <p className="font-black text-sm italic">{routeInfo.distance.toFixed(1)} KM</p>
                    </div>
                    <div className="w-px h-8 bg-slate-700"></div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Travel Time</p>
                        <p className="font-black text-sm italic">{routeInfo.duration} MIN</p>
                    </div>
                </div>
            )}
        </div>
    );
}