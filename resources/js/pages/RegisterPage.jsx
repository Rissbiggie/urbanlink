import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Optionally import icons (e.g., from heroicons)
// import { UserIcon, IdentificationIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    
    // Core User State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [role, setRole] = useState('citizen'); // Default to citizen

    // Driver/Vehicle State
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseClass, setLicenseClass] = useState('Class B');
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [vehicle, setVehicle] = useState({
        make: '',
        model: '',
        plate_number: '',
        vehicle_type: 'Sedan',
        year: new Date().getFullYear()
    });
    
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        // Prepare payload, only adding driver info if necessary
        const payload = {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            role,
            ...(role === 'driver' && {
                license_number: licenseNumber,
                license_class: licenseClass,
                license_expiry: licenseExpiry,
                vehicle: vehicle
            })
        };

        try {
            await register(payload);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Modern Styling Classes ---
    const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white text-gray-900 text-base placeholder:text-gray-400 outline-none transition-all duration-150 ease-in-out hover:border-gray-400";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-1.5";
    const driverInputClasses = `${inputClasses} border-indigo-200 bg-indigo-50/50 focus:ring-indigo-300`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-3xl w-full">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-950 tracking-tight">Create Your Account</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-md mx-auto">Join UrbanLink for seamless, reliable urban mobility solutions.</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-100 transform transition-all duration-300">
                    
                    {/* Modern Segmented Role Selector */}
                    <div className="mb-8 max-w-xs mx-auto">
                        <label className={`${labelClasses} text-center`}>Registering as:</label>
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setRole('citizen')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold rounded-xl transition-all duration-200 ${role === 'citizen' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {/* <UserIcon className="w-5 h-5" /> */}
                                Citizen
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('driver')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold rounded-xl transition-all duration-200 ${role === 'driver' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {/* <TruckIcon className="w-5 h-5" /> */}
                                Driver
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Common Section (Always Shown) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <label className={labelClasses}>Full Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    required
                                    className={inputClasses}
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Email Address</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    required
                                    className={inputClasses}
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        {/* Driver & Vehicle Section (Conditional rendering) */}
                        {role === 'driver' && (
                            <div className="bg-indigo-50/70 p-6 sm:p-8 rounded-2xl border border-indigo-100 space-y-6 animate-in fade-in zoom-in duration-300 ease-out">
                                <div className="flex items-center gap-3 pb-3 border-b border-indigo-100">
                                    {/* <IdentificationIcon className="w-8 h-8 text-indigo-600" /> */}
                                    <div>
                                        <h3 className="text-xl font-bold text-indigo-950">Driver & Vehicle Details</h3>
                                        <p className="text-indigo-800 text-sm">Required for account verification and service access.</p>
                                    </div>
                                </div>

                                {/* Driver Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={`${labelClasses} text-indigo-900`}>License Number</label>
                                        <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required={role === 'driver'} className={driverInputClasses} placeholder="ABC-123XXX" />
                                    </div>
                                    <div>
                                        <label className={`${labelClasses} text-indigo-900`}>License Class</label>
                                        <select value={licenseClass} onChange={(e) => setLicenseClass(e.target.value)} className={driverInputClasses}>
                                            <option value="Class B">Class B (Sedan)</option>
                                            <option value="Class A">Class A (Motorcycle)</option>
                                            <option value="Class C">Class C (Commercial)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`${labelClasses} text-indigo-900`}>License Expiry</label>
                                        <input value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} type="date" required={role === 'driver'} className={driverInputClasses} />
                                    </div>
                                </div>

                                {/* Vehicle Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <input placeholder="Make (Toyota)" value={vehicle.make} onChange={(e) => setVehicle({...vehicle, make: e.target.value})} required={role === 'driver'} className={driverInputClasses} />
                                    <input placeholder="Model (Corolla)" value={vehicle.model} onChange={(e) => setVehicle({...vehicle, model: e.target.value})} required={role === 'driver'} className={driverInputClasses} />
                                    <input placeholder="Plate (KAA 123X)" value={vehicle.plate_number} onChange={(e) => setVehicle({...vehicle, plate_number: e.target.value})} required={role === 'driver'} className={driverInputClasses} />
                                    <input placeholder="Year" type="number" value={vehicle.year} onChange={(e) => setVehicle({...vehicle, year: e.target.value})} required={role === 'driver'} className={driverInputClasses} />
                                </div>
                            </div>
                        )}

                        {/* Password Section (Always Shown) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <label className={labelClasses}>Password</label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    required
                                    className={inputClasses}
                                    placeholder="At least 8 characters"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Confirm Password</label>
                                <input
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    type="password"
                                    required
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        {/* Error Handling */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <strong className="block font-bold">Registration Failed</strong>
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-2xl font-extrabold text-lg shadow-lg hover:shadow-indigo-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Optional: Simple Copyright/Footer */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    © {new Date().getFullYear()} UrbanLink Mobility. All rights reserved.
                </p>
            </div>
        </div>
    );
}