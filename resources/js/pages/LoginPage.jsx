
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-medium">Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        className="w-full rounded border border-gray-300 px-3 py-2 bg-white text-gray-900"
                    />
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Login
                </button>
            </form>
            <p className="mt-4 text-sm text-gray-600">
                Don&apos;t have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
            </p>
        </div>
    );
}
