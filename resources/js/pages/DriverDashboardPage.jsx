import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getEcho } from '../services/broadcast';
import DriverMap from '../components/DriverMap';

export default function DriverDashboardPage() {
    const { user, fetchMe } = useAuth();
    const [profile, setProfile] = useState(null);
    const [rides, setRides] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [vehicles, setVehicles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [activeRequest, setActiveRequest] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [nearbyDrivers, setNearbyDrivers] = useState([]);
    const [activeRides, setActiveRides] = useState([]);
    const [geoError, setGeoError] = useState(null);
    const locationSentRef = useRef(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [todayOnly, setTodayOnly] = useState(false);
    const [payouts, setPayouts] = useState([]);

    const computeDistanceKm = (lat, lng) => {
        if (!driverLocation) return null;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat - driverLocation.lat);
        const dLng = toRad(lng - driverLocation.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(driverLocation.lat)) * Math.cos(toRad(lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const nearbyRequests = useMemo(
        () => notifications.filter((n) => n.type === 'ride.requested').map((n) => n.data),
        [notifications]
    );

    const scoredRequests = useMemo(() => {
        return nearbyRequests
            .map((req) => {
                const distance = req?.pickup?.lat && req?.pickup?.lng ? computeDistanceKm(req.pickup.lat, req.pickup.lng) : null;
                const fare = Number(req?.estimated_fare || 0);
                const score = distance ? fare / distance : fare;
                return { ...req, distance, score };
            })
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }, [nearbyRequests, computeDistanceKm]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    };

    const playBeep = () => {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 520;
        gain.gain.value = 0.12;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
            ctx.close();
        }, 120);
    };

    const [driverForm, setDriverForm] = useState({
        license_number: '',
        license_class: '',
        license_expiry: '',
        vehicle: {
            make: '',
            model: '',
            plate_number: '',
            vehicle_type: 'economy',
            year: '',
            color: '',
        },
    });
    const [driverFormError, setDriverFormError] = useState(null);

    const loadDriverData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {};

            const [profileRes, ridesRes, earningsRes, vehiclesRes, payoutsRes] = await Promise.all([
                axios.get('/driver/profile'),
                axios.get('/driver/rides', { params }),
                axios.get('/driver/earnings'),
                axios.get('/driver/vehicles'),
                axios.get('/driver/payouts', { params }),
            ]);

            setProfile(profileRes.data);
            setRides(ridesRes.data.data || []);
            setEarnings(earningsRes.data);
            setVehicles(vehiclesRes.data);
            setPayouts(payoutsRes.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'driver') {
            loadDriverDataWithFilters();
        }
    }, [user, loadDriverDataWithFilters, statusFilter, todayOnly]);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !user?.id) return;

        const channel = echo.private(`user.${user.id}`);

        const handleRideRequested = (event) => {
            setNotifications((prev) => [
                {
                    id: `ride-requested-${event.ride_id}-${Date.now()}`,
                    type: 'ride.requested',
                    message: `New ride requested: ${event.ride_reference}`,
                    data: event,
                    receivedAt: new Date(),
                },
                ...prev,
            ]);
            setActiveRequest(event);
            addToast(`New request: ${event.ride_reference}`, 'info');
            playBeep();
            // Reload assigned rides so driver sees it immediately.
            loadDriverData();
            fetchNearby();
        };

        const handleStatusUpdated = (event) => {
            setNotifications((prev) => {
                const filtered = prev.filter(
                    (n) => !(n.type === 'ride.requested' && n.data?.ride_id === event.ride_id)
                );

                return [
                    {
                        id: `ride-status-${event.ride_id}-${Date.now()}`,
                        type: 'ride.status.updated',
                        message: `Ride ${event.ride_id} updated: ${event.status}`,
                        data: event,
                        receivedAt: new Date(),
                    },
                    ...filtered,
                ];
            });
            addToast(`Ride ${event.ride_reference || event.ride_id} is now ${event.status}`, 'success');
            loadDriverData();
            fetchNearby();
        };

        channel.listen('ride.requested', handleRideRequested);
        channel.listen('ride.status.updated', handleStatusUpdated);

        return () => {
            channel.stopListening('ride.requested', handleRideRequested);
            channel.stopListening('ride.status.updated', handleStatusUpdated);
        };
    }, [user, loadDriverData]);

    const fetchNearby = async () => {
        if (!user?.role) return;

        try {
            const { data } = await axios.get('/driver/map');
            setNearbyDrivers(data.drivers || []);
            setActiveRides(data.active_rides || []);
        } catch (err) {
            // ignore best-effort
        }
    };

    useEffect(() => {
        if (user?.role !== 'driver' || !navigator.geolocation) {
            return;
        }

        const onPosition = async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setDriverLocation({ lat, lng });

            const now = Date.now();
            if (now - locationSentRef.current < 20_000) {
                return;
            }
            locationSentRef.current = now;

            try {
                await axios.post('/driver/location', { lat, lng });
            } catch (err) {
                // Ignore; location updates are best-effort.
            }

            fetchNearby();
        };

        const onError = (error) => {
            setGeoError(error.message || 'Unable to get location');
        };

        const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
            enableHighAccuracy: true,
            maximumAge: 10_000,
            timeout: 10_000,
        });

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [user]);

    useEffect(() => {
        if (user?.role === 'driver') {
            fetchNearby();
        }
    }, [user]);

    const toggleAvailability = async () => {
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.post('/driver/toggle-availability');
            setProfile((prev) => ({ ...prev, is_available: data.is_available }));
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    const loadDriverDataWithFilters = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (todayOnly) params.today = true;

            const [profileRes, ridesRes, earningsRes, vehiclesRes] = await Promise.all([
                axios.get('/driver/profile'),
                axios.get('/driver/rides', { params }),
                axios.get('/driver/earnings'),
                axios.get('/driver/vehicles'),
            ]);

            setProfile(profileRes.data);
            setRides(ridesRes.data.data || []);
            setEarnings(earningsRes.data);
            setVehicles(vehiclesRes.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const runRideAction = async (rideId, action) => {
        setSaving(true);
        setError(null);
        try {
            await axios.post(`/driver/rides/${rideId}/${action}`);
            await loadDriverDataWithFilters();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    const exportPayoutsCsv = () => {
        if (!payouts || payouts.length === 0) return;

        const headers = ['Ride Reference', 'Date', 'Status', 'Fare'];
        const rows = payouts.map((ride) => [
            ride.ride_reference,
            new Date(ride.created_at).toISOString(),
            ride.status,
            ride.final_fare,
        ]);

        const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payouts_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleBecomeDriver = async (payload) => {
        setSaving(true);
        setError(null);

        try {
            await axios.post('/driver/register', payload);
            await fetchMe();
            await loadDriverData();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateFormField = (key) => (event) => {
        setDriverForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const updateVehicleField = (key) => (event) => {
        setDriverForm((prev) => ({
            ...prev,
            vehicle: {
                ...prev.vehicle,
                [key]: event.target.value,
            },
        }));
    };

    const handleDriverFormSubmit = async (event) => {
        event.preventDefault();
        setDriverFormError(null);

        try {
            await handleBecomeDriver(driverForm);
        } catch (err) {
            setDriverFormError(err.response?.data?.message || err.message);
        }
    };

    if (user?.role !== 'driver') {
        return (
            <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-semibold mb-4">Become a driver</h1>
                <p className="text-gray-600 mb-4">
                    Fill out the form below to register as a driver. Once complete, you can manage rides from this dashboard.
                </p>

                <form onSubmit={handleDriverFormSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">License number</label>
                        <input
                            value={driverForm.license_number}
                            onChange={updateFormField('license_number')}
                            required
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">License class</label>
                        <input
                            value={driverForm.license_class}
                            onChange={updateFormField('license_class')}
                            required
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">License expiry</label>
                        <input
                            value={driverForm.license_expiry}
                            onChange={updateFormField('license_expiry')}
                            type="date"
                            required
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>

                    <h2 className="text-lg font-semibold mt-6">Vehicle information</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium">Make</label>
                            <input
                                value={driverForm.vehicle.make}
                                onChange={updateVehicleField('make')}
                                required
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Model</label>
                            <input
                                value={driverForm.vehicle.model}
                                onChange={updateVehicleField('model')}
                                required
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Plate number</label>
                            <input
                                value={driverForm.vehicle.plate_number}
                                onChange={updateVehicleField('plate_number')}
                                required
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Vehicle type</label>
                            <select
                                value={driverForm.vehicle.vehicle_type}
                                onChange={updateVehicleField('vehicle_type')}
                                required
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            >
                                <option value="economy">Economy</option>
                                <option value="comfort">Comfort</option>
                                <option value="xl">XL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Year</label>
                            <input
                                value={driverForm.vehicle.year}
                                onChange={updateVehicleField('year')}
                                type="number"
                                required
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Color</label>
                            <input
                                value={driverForm.vehicle.color}
                                onChange={updateVehicleField('color')}
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {driverFormError && <div className="text-sm text-red-600">{driverFormError}</div>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? 'Submitting…' : 'Become a driver'}
                    </button>
                </form>
            </div>
        );
    }

    if (loading) {
        return <div>Loading driver dashboard…</div>;
    }

    return (
        <div className="space-y-6">
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`max-w-sm rounded border px-4 py-3 shadow-lg text-sm ${
                                toast.type === 'success'
                                    ? 'border-green-300 bg-green-50 text-green-800'
                                    : toast.type === 'error'
                                    ? 'border-red-300 bg-red-50 text-red-800'
                                    : 'border-blue-300 bg-blue-50 text-blue-800'
                            }`}
                        >
                            {toast.message}
                        </div>
                    ))}
                </div>
            )}

            <div className="border rounded p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Live map</h2>
                    <button
                        type="button"
                        onClick={() => setActiveRequest(null)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Clear selection
                    </button>
                </div>
                {geoError && <div className="text-sm text-red-600 mb-2">{geoError}</div>}

                <DriverMap
                    driverLocation={driverLocation}
                    otherDrivers={nearbyDrivers}
                    activeRides={activeRides}
                    requests={scoredRequests}
                    activeRequest={activeRequest}
                    assignedRide={activeRide}
                    height={320}
                />

                {scoredRequests.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                        <div className="font-semibold mb-1">Nearby requests</div>
                        <div className="space-y-2">
                            {scoredRequests.map((req) => (
                                <div
                                    key={req.ride_id}
                                    className="flex flex-wrap items-center justify-between gap-2 border rounded p-2 bg-gray-50 dark:bg-gray-900"
                                >
                                    <div>
                                        <div className="font-semibold">Ride {req.ride_reference}</div>
                                        <div className="text-xs text-gray-500">
                                            {req.pickup.address}
                                            {req.distance != null && (
                                                <span> • {req.distance.toFixed(1)} km</span>
                                            )}
                                            {req.estimated_fare != null && (
                                                <span> • KES {req.estimated_fare}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveRequest(req)}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Show on map
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => runRideAction(req.ride_id, 'accept')}
                                            className="text-sm text-green-600 hover:underline"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <h2 className="text-lg font-semibold mb-3">Profile</h2>
                    <div className="text-sm text-gray-600">
                        <div><strong>Status:</strong> {profile?.status}</div>
                        <div><strong>Available:</strong> {profile?.is_available ? 'Yes' : 'No'}</div>
                        <div><strong>License:</strong> {profile?.license_number}</div>
                        <div><strong>Vehicle:</strong> {vehicles?.make} {vehicles?.model} ({vehicles?.plate_number})</div>
                    </div>
                    <button
                        type="button"
                        onClick={toggleAvailability}
                        disabled={saving}
                        className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? 'Updating…' : profile?.is_available ? 'Go Offline' : 'Go Online'}
                    </button>
                </div>

                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <h2 className="text-lg font-semibold mb-3">Earnings</h2>
                    {earnings ? (
                        <div className="text-sm text-gray-600">
                            <div><strong>Today:</strong> {earnings.today || 0}</div>
                            <div><strong>This week:</strong> {earnings.week || 0}</div>
                            <div><strong>This month:</strong> {earnings.month || 0}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">No earnings data.</div>
                    )}
                </div>
            </div>

            <div className="border rounded p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <h2 className="text-lg font-semibold">Recent payouts</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadDriverDataWithFilters()}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={exportPayoutsCsv}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                {payouts.length === 0 ? (
                    <div className="text-sm text-gray-600">No payouts yet.</div>
                ) : (
                    <div className="space-y-2">
                        {payouts.map((ride) => (
                            <div key={ride.id} className="flex justify-between items-start border-b pb-2">
                                <div>
                                    <div className="font-semibold">{ride.ride_reference}</div>
                                    <div className="text-sm text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right text-sm text-gray-700">
                                    <div>Fare: {ride.final_fare}</div>
                                    <div>Status: {ride.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border rounded p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold">Assigned rides</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 bg-white text-sm text-gray-900"
                        >
                            <option value="all">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <label className="text-sm text-gray-600 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={todayOnly}
                                onChange={(e) => setTodayOnly(e.target.checked)}
                            />
                            Today only
                        </label>
                        <button
                            type="button"
                            onClick={() => loadDriverDataWithFilters()}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
                {rides.length === 0 ? (
                    <div className="text-gray-600">No assigned rides yet.</div>
                ) : (
                    <div className="space-y-3">
                        {rides.map((ride) => {
                            const canAccept = ride.status === 'pending';
                            const canStart = ride.status === 'accepted';
                            const canComplete = ride.status === 'in_progress';

                            return (
                                <div key={ride.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold">{ride.ride_reference}</div>
                                            <div className="text-sm text-gray-500">{ride.status}</div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <div>{ride.vehicle_type}</div>
                                            <div>{ride.payment_method}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <div><strong>Pickup:</strong> {ride.pickup_address}</div>
                                        <div><strong>Dropoff:</strong> {ride.dropoff_address}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveRide(ride)}
                                            className="py-1 px-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            Show on map
                                        </button>
                                        {canAccept && (
                                            <button
                                                type="button"
                                                onClick={() => runRideAction(ride.id, 'accept')}
                                                disabled={saving}
                                                className="py-1 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                                            >
                                                Accept
                                            </button>
                                        )}
                                        {canStart && (
                                            <button
                                                type="button"
                                                onClick={() => runRideAction(ride.id, 'start')}
                                                disabled={saving}
                                                className="py-1 px-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
                                            >
                                                Start
                                            </button>
                                        )}
                                        {canComplete && (
                                            <button
                                                type="button"
                                                onClick={() => runRideAction(ride.id, 'complete')}
                                                disabled={saving}
                                                className="py-1 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {activeRide && (
                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">Assigned ride route</h2>
                        <button
                            type="button"
                            onClick={() => setActiveRide(null)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Close
                        </button>
                    </div>
                    <DriverMap
                        driverLocation={driverLocation}
                        requests={nearbyRequests}
                        activeRequest={activeRequest}
                        assignedRide={activeRide}
                        height={320}
                    />
                </div>
            )}
        </div>
    );
}
