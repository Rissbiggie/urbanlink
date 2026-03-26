import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const { data } = await axios.get('/payments');
                if (!cancelled) {
                    setPayments(data.data || []);
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
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Payments</h1>
            {loading ? (
                <div>Loading…</div>
            ) : (
                <div className="space-y-4">
                    {payments.length === 0 ? (
                        <div className="text-gray-600">No payments found.</div>
                    ) : (
                        payments.map((payment) => (
                            <div key={payment.id} className="border rounded p-4 bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{payment.payable_type} #{payment.payable_id}</div>
                                        <div className="text-sm text-gray-500">{payment.payment_method.toUpperCase()}</div>
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                        <div>{payment.status}</div>
                                        <div>{payment.amount} {payment.currency}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <div><strong>Created:</strong> {new Date(payment.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
