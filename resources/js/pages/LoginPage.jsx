import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100 text-slate-900">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tighter italic">URBANLINK.</h1>
                    <p className="text-slate-500 text-sm mt-2">Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 placeholder:text-slate-400"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 placeholder:text-slate-400"
                        required
                    />

                    {error && <p className="text-red-600 text-xs font-bold px-2">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                    <Link to="/register" className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors">
                        Create New Account
                    </Link>
                </div>
            </div>
        </div>
    );
}