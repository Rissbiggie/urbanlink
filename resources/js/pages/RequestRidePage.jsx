import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RequestRidePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        pickup_address: '',
        pickup_lat: '',
        pickup_lng: '',
        dropoff_address: '',
        dropoff_lat: '',
        dropoff_lng: '',
        vehicle_type: 'economy',
        payment_method: 'mpesa',
        distance_km: '',
        duration_minutes: '',
    });
    const [fare, setFare] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateField = (key) => (event) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const handleQuote = async () => {
        setError(null);
        setFare(null);

        const distance = parseFloat(form.distance_km);
        const duration = parseInt(form.duration_minutes, 10);

        if (Number.isNaN(distance) || Number.isNaN(duration)) {
            setError('Distance and duration must be valid numbers.');
            return;
        }

        try {
            const { data } = await axios.post('/rides/quote', {
                distance_km: distance,
                duration_minutes: duration,
                vehicle_type: form.vehicle_type,
            });

            setFare(data.fare);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await axios.post('/rides', {
                pickup_address: form.pickup_address,
                pickup_lat: parseFloat(form.pickup_lat) || null,
                pickup_lng: parseFloat(form.pickup_lng) || null,
                dropoff_address: form.dropoff_address,
                dropoff_lat: parseFloat(form.dropoff_lat) || null,
                dropoff_lng: parseFloat(form.dropoff_lng) || null,
                vehicle_type: form.vehicle_type,
                payment_method: form.payment_method,
                distance_km: parseFloat(form.distance_km) || null,
                duration_minutes: parseInt(form.duration_minutes, 10) || null,
            });

            navigate('/rides');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Request a Ride</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-medium">Pickup address</label>
                    <input
                        value={form.pickup_address}
                        onChange={updateField('pickup_address')}
                        type="text"
                        required
                        className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Pickup lat</label>
                        <input
                            value={form.pickup_lat}
                            onChange={updateField('pickup_lat')}
                            type="text"
                            placeholder="e.g. -1.2921"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Pickup lng</label>
                        <input
                            value={form.pickup_lng}
                            onChange={updateField('pickup_lng')}
                            type="text"
                            placeholder="e.g. 36.8219"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">Dropoff address</label>
                    <input
                        value={form.dropoff_address}
                        onChange={updateField('dropoff_address')}
                        type="text"
                        required
                        className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Dropoff lat</label>
                        <input
                            value={form.dropoff_lat}
                            onChange={updateField('dropoff_lat')}
                            type="text"
                            placeholder="e.g. -1.2921"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Dropoff lng</label>
                        <input
                            value={form.dropoff_lng}
                            onChange={updateField('dropoff_lng')}
                            type="text"
                            placeholder="e.g. 36.8219"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Vehicle type</label>
                        <select
                            value={form.vehicle_type}
                            onChange={updateField('vehicle_type')}
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        >
                            <option value="economy">Economy</option>
                            <option value="comfort">Comfort</option>
                            <option value="xl">XL</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Payment method</label>
                        <select
                            value={form.payment_method}
                            onChange={updateField('payment_method')}
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        >
                            <option value="mpesa">M-Pesa</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Distance (km)</label>
                        <input
                            value={form.distance_km}
                            onChange={updateField('distance_km')}
                            type="number"
                            step="0.1"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Duration (min)</label>
                        <input
                            value={form.duration_minutes}
                            onChange={updateField('duration_minutes')}
                            type="number"
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleQuote}
                        className="w-full sm:w-auto py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Calculate fare
                    </button>
                    <span className="text-sm text-gray-600">
                        Estimated fare: {fare === null ? '—' : <span className="font-semibold">{fare}</span>}
                    </span>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                >
                    {loading ? 'Requesting…' : 'Request Ride'}
                </button>
            </form>
        </div>
    );
}
