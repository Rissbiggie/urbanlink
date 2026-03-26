import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function RidesPage() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [todayOnly, setTodayOnly] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const params = {};
                if (statusFilter !== 'all') params.status = statusFilter;
                if (todayOnly) params.today = true;

                const { data } = await axios.get('/rides', { params });
                if (!cancelled) {
                    setRides(data.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [statusFilter, todayOnly]);

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">My Rides</h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
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
            </div>
            {loading ? (
                <div>Loading…</div>
            ) : (
                <div className="space-y-4">
                    {rides.length === 0 ? (
                        <div className="text-gray-600">No rides found.</div>
                    ) : (
                        rides.map((ride) => (
                            <div key={ride.id} className="border rounded p-4 bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">{ride.ride_reference}</div>
                                        <div className="text-sm text-gray-500">{ride.status}</div>
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                        <div>{ride.vehicle_type}</div>
                                        <div>{ride.payment_method}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <div><strong>Pickup:</strong> {ride.pickup_address}</div>
                                    <div><strong>Dropoff:</strong> {ride.dropoff_address}</div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Link
                                        to={`/rides/${ride.id}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View details
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
