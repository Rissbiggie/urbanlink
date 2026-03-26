import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. Import the actual image files so Vite knows where they are
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// 2. Fix default icon paths for Leaflet using the imported variables
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
function haversineDistance([lat1, lng1], [lat2, lng2]) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function FitBounds({ bounds }) {
    const map = useMap();

    useEffect(() => {
        if (!bounds || bounds.length === 0) return;
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [map, bounds]);

    return null;
}

export default function DriverMap({
    driverLocation,
    requests = [],
    otherDrivers = [],
    activeRides = [],
    activeRequest,
    assignedRide,
    height = 400,
}) {
    const [routeGeo, setRouteGeo] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);

    const routeDistanceKm = useMemo(() => {
        if (routeInfo?.distance != null) {
            return routeInfo.distance / 1000;
        }

        if (!assignedRide) return null;
        const pickupLat = Number(assignedRide.pickup_lat);
        const pickupLng = Number(assignedRide.pickup_lng);
        const dropoffLat = Number(assignedRide.dropoff_lat);
        const dropoffLng = Number(assignedRide.dropoff_lng);
        if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) return null;
        return haversineDistance([pickupLat, pickupLng], [dropoffLat, dropoffLng]);
    }, [assignedRide, routeInfo]);

    const markers = useMemo(() => {
        const items = [];

        if (driverLocation) {
            items.push({
                key: 'driver',
                label: 'You (driver)',
                position: [driverLocation.lat, driverLocation.lng],
                color: 'blue',
            });
        }

        otherDrivers.forEach((driver) => {
            if (!driver.current_lat || !driver.current_lng) return;
            items.push({
                key: `driver-${driver.id}`,
                label: `Driver: ${driver.user_name || driver.user?.name || driver.id}`,
                position: [Number(driver.current_lat), Number(driver.current_lng)],
                color: 'gray',
            });
        });

        activeRides.forEach((ride) => {
            if (!ride.pickup_lat || !ride.pickup_lng) return;
            items.push({
                key: `active-ride-${ride.id}`,
                label: `Active ride: ${ride.ride_reference}`,
                position: [Number(ride.pickup_lat), Number(ride.pickup_lng)],
                color: 'teal',
                request: {
                    address: ride.pickup_address,
                },
            });
        });

        if (assignedRide) {
            const pickupLat = Number(assignedRide.pickup_lat);
            const pickupLng = Number(assignedRide.pickup_lng);
            const dropoffLat = Number(assignedRide.dropoff_lat);
            const dropoffLng = Number(assignedRide.dropoff_lng);

            if (pickupLat && pickupLng) {
                items.push({
                    key: `assigned-pickup-${assignedRide.id}`,
                    label: `Assigned ride (${assignedRide.ride_reference}) pickup`,
                    position: [pickupLat, pickupLng],
                    color: 'orange',
                    request: {
                        address: assignedRide.pickup_address,
                    },
                });
            }

            if (dropoffLat && dropoffLng) {
                items.push({
                    key: `assigned-dropoff-${assignedRide.id}`,
                    label: `Assigned ride (${assignedRide.ride_reference}) dropoff`,
                    position: [dropoffLat, dropoffLng],
                    color: 'purple',
                    request: {
                        address: assignedRide.dropoff_address,
                    },
                });
            }
        }

        const requestWithScore = (req) => {
            const distance =
                driverLocation && req?.pickup?.lat && req?.pickup?.lng
                    ? haversineDistance([driverLocation.lat, driverLocation.lng], [req.pickup.lat, req.pickup.lng])
                    : null;
            const fare = Number(req.estimated_fare || 0);
            const score = distance ? fare / distance : fare;
            return { req, distance, score };
        };

        const sortedRequests = requests
            .map(requestWithScore)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map(({ req }) => req);

        sortedRequests.forEach((req) => {
            if (req?.pickup?.lat && req?.pickup?.lng) {
                items.push({
                    key: `request-${req.ride_id}`,
                    label: `Ride ${req.ride_reference} pickup`,
                    position: [req.pickup.lat, req.pickup.lng],
                    color: activeRequest?.ride_id === req.ride_id ? 'green' : 'red',
                    request: {
                        address: req.pickup.address,
                        score: req.estimated_fare ? `${req.estimated_fare} fare` : undefined,
                    },
                });
            }
        });

        if (activeRequest && activeRequest.pickup?.lat && activeRequest.pickup?.lng) {
            const exists = items.find((m) => m.key === `request-${activeRequest.ride_id}`);
            if (!exists) {
                items.push({
                    key: `request-${activeRequest.ride_id}`,
                    label: `Ride ${activeRequest.ride_reference} pickup`,
                    position: [activeRequest.pickup.lat, activeRequest.pickup.lng],
                    color: 'green',
                    request: {
                        address: activeRequest.pickup.address,
                        score: activeRequest.estimated_fare ? `${activeRequest.estimated_fare} fare` : undefined,
                    },
                });
            }
        }

        return items;
    }, [driverLocation, otherDrivers, requests, activeRequest, assignedRide]);

    const bounds = useMemo(() => markers.map((m) => m.position), [markers]);

    const center = driverLocation
        ? [driverLocation.lat, driverLocation.lng]
        : markers.length > 0
        ? markers[0].position
        : [0, 0];

    const routeLine = useMemo(() => {
        if (!routeGeo) return null;
        return routeGeo;
    }, [routeGeo]);

    useEffect(() => {
        if (!assignedRide) {
            setRouteGeo(null);
            setRouteInfo(null);
            return;
        }

        const pickupLat = Number(assignedRide.pickup_lat);
        const pickupLng = Number(assignedRide.pickup_lng);
        const dropoffLat = Number(assignedRide.dropoff_lat);
        const dropoffLng = Number(assignedRide.dropoff_lng);

        if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
            setRouteGeo(null);
            setRouteInfo(null);
            return;
        }

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?overview=full&geometries=geojson&steps=false`;

        fetch(osrmUrl)
            .then((res) => res.json())
            .then((data) => {
                if (data?.routes?.[0]?.geometry?.coordinates) {
                    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                    setRouteGeo(coords);
                    setRouteInfo({
                        distance: data.routes[0].distance,
                        duration: data.routes[0].duration,
                    });
                }
            })
            .catch(() => {
                setRouteGeo(null);
                setRouteInfo(null);
            });
    }, [assignedRide]);

    return (
        <div>
            <MapContainer center={center} zoom={13} style={{ height, width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker) => (
                    <Marker key={marker.key} position={marker.position}>
                        <Popup>
                            <div className="text-sm">
                                <div className="font-semibold">{marker.label}</div>
                                {marker.request?.address && (
                                    <div className="mt-1">{marker.request.address}</div>
                                )}
                                {marker.request?.score && (
                                    <div className="mt-1 text-xs text-gray-500">{marker.request.score}</div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
                {routeLine && <Polyline positions={routeLine} pathOptions={{ color: 'orange', weight: 4 }} />}
                <FitBounds bounds={bounds} />
            </MapContainer>
            {routeDistanceKm !== null && (
                <div className="mt-2 text-sm text-gray-600">
                    Route distance: <strong>{routeDistanceKm.toFixed(2)} km</strong>
                    {routeInfo?.duration != null && (
                        <> • ETA: <strong>{Math.round(routeInfo.duration / 60)} min</strong></>
                    )}
                </div>
            )}
        </div>
    );
}
