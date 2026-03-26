import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import axios from 'axios';

const tokenKey = 'urbanlink_token';
const AuthContext = createContext(null);

// 1. Set the base URL and initial token outside the component 
// to prevent race conditions during the first mount.
const initialToken = localStorage.getItem(tokenKey);
axios.defaults.baseURL = 'http://localhost:5000/api'; // Change to your API URL
if (initialToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(null);

    const logout = useCallback(() => {
        localStorage.removeItem(tokenKey);
        delete axios.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
    }, []);

    // 2. Axios Interceptor: Watch for 401 errors globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => axios.interceptors.response.eject(interceptor);
    }, [logout]);

    const setAuthToken = useCallback((tokenValue) => {
        if (tokenValue) {
            localStorage.setItem(tokenKey, tokenValue);
            axios.defaults.headers.common.Authorization = `Bearer ${tokenValue}`;
            setToken(tokenValue);
        } else {
            logout();
        }
    }, [logout]);

    const fetchMe = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get('/auth/me');
            setUser(data);
        } catch {
            logout();
        }
    }, [token, logout]);

    useEffect(() => {
        if (token) fetchMe();
    }, [token, fetchMe]);

    const login = useCallback(async (email, password) => {
        const { data } = await axios.post('/auth/login', { email, password });
        setAuthToken(data.token);
        setUser(data.user);
        return data;
    }, [setAuthToken]);

    const register = useCallback(async (payload) => {
        const { data } = await axios.post('/auth/register', payload);
        setAuthToken(data.token);
        setUser(data.user);
        return data;
    }, [setAuthToken]);

    const value = useMemo(
        () => ({ token, user, login, register, logout, fetchMe }),
        [token, user, login, register, logout, fetchMe]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}