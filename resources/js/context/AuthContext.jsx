import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import axios from 'axios';
import { authAPI } from '../api'; // ✅ Using your new registry

const tokenKey = 'urbanlink_token';
const AuthContext = createContext(null);

// Initial Axios setup for the very first load
const initialToken = localStorage.getItem(tokenKey);
if (initialToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem(tokenKey);
        // Clean up headers in both global axios and your apiClient
        delete axios.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
        setLoading(false);
    }, []);

    const fetchMe = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            // ✅ Clean: Using authAPI instead of axios.get
            const response = await authAPI.getMe();
            
            // Extracting from your { status, data: { user } } structure
            const userData = response.data.data?.user || response.data.data;
            setUser(userData);
        } catch (error) {
            console.error("Session fetch failed:", error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            // ✅ Clean: Using authAPI instead of axios.post
            const response = await authAPI.login({ email, password });
            
            const userData = response.data.data?.user;
            const tokenData = response.data.data?.token;

            if (userData && tokenData) {
                localStorage.setItem(tokenKey, tokenData);
                // Set the header for future requests
                axios.defaults.headers.common.Authorization = `Bearer ${tokenData}`;
                setToken(tokenData);
                setUser(userData);
            }
            return response.data;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (payload) => {
        setLoading(true);
        try {
            // ✅ Clean: Using authAPI instead of axios.post
            const response = await authAPI.register(payload);
            
            const userData = response.data.data?.user;
            const tokenData = response.data.data?.token;

            if (userData && tokenData) {
                localStorage.setItem(tokenKey, tokenData);
                axios.defaults.headers.common.Authorization = `Bearer ${tokenData}`;
                setToken(tokenData);
                setUser(userData);
            }
            return response.data;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo(
        () => ({ token, user, loading, login, register, logout, fetchMe }),
        [token, user, loading, login, register, logout, fetchMe]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};