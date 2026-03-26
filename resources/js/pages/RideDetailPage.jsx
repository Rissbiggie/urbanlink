import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function RideDetailPage() {
    const { id } = useParams();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState(null);

    const loadRide = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.get(`/rides/${id}`);
            setRide(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadRide();
    }, [loadRide]);

    const runAction = async (path) => {
        setActionLoading(true);
        setError(null);

        try {
            await axios.post(`/rides/${id}/${path}`);
            await loadRide();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        await runAction('cancel');
    };

    const handleRate = async () => {
        setActionLoading(true);
        setError(null);

        try {
            await axios.post(`/rides/${id}/rate`, {
                rating,
                comment,
            });
            await loadRide();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div>Loading…</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    if (!ride) {
        return <div className="text-gray-600">Ride not found.</div>;
    }

    const canCancel = ['pending', 'accepted'].includes(ride.status);
    const canRate = ride.status === 'completed' && !ride.passenger_rating;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between">
                <h1 className="text-2xl font-semibold mb-4">Ride {ride.ride_reference}</h1>
                <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">{ride.status}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <h2 className="font-semibold mb-2">Route</h2>
                    <div className="text-sm text-gray-600">
                        <div><strong>Pickup:</strong> {ride.pickup_address}</div>
                        <div><strong>Dropoff:</strong> {ride.dropoff_address}</div>
                    </div>
                </div>
                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <h2 className="font-semibold mb-2">Details</h2>
                    <div className="text-sm text-gray-600">
                        <div><strong>Vehicle:</strong> {ride.vehicle_type}</div>
                        <div><strong>Payment:</strong> {ride.payment_method}</div>
                        <div><strong>Est. fare:</strong> {ride.estimated_fare ?? '—'}</div>
                        <div><strong>Final fare:</strong> {ride.final_fare ?? '—'}</div>
                    </div>
                </div>
            </div>

            {canCancel && (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                    >
                        {actionLoading ? 'Processing…' : 'Cancel Ride'}
                    </button>
                </div>
            )}

            {canRate && (
                <div className="border rounded p-4 bg-white dark:bg-gray-800">
                    <h2 className="font-semibold mb-2">Rate your ride</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium">Rating</label>
                            <select
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            >
                                {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Comment (optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleRate}
                            disabled={actionLoading}
                            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                        >
                            {actionLoading ? 'Saving…' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
