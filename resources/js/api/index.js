import axios from 'axios';
import { getApiBaseUrl } from '../apiConfig';

/**
 * 1. BASE CONFIGURATION
 */
const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('urbanlink_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * 2. AUTHENTICATION & IDENTITY
 */
export const authAPI = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (payload) => apiClient.post('/auth/register', payload),
    getMe: () => apiClient.get('/auth/me'),
    logout: () => apiClient.post('/auth/logout'),
    updateProfile: (data) => apiClient.put('/user/profile', data),
};

/**
 * 3. COMPLIANCE & VERIFICATION (NTSA/KRA)
 */
export const complianceAPI = {
    verifyDL: (dlNumber) => apiClient.post('/compliance/ntsa/verify-dl', { dl_number: dlNumber }),
    verifyPIN: (pin) => apiClient.post('/compliance/kra/verify-pin', { pin }),
    getComplianceStatus: () => apiClient.get('/compliance/status'),
};

/**
 * 4. DRIVER OPERATIONS
 */
export const driverAPI = {
    getProfile: () => apiClient.get('/driver/profile'),
    updateLocation: (coords) => apiClient.post('/driver/location', coords),
    toggleAvailability: () => apiClient.post('/driver/toggle-availability'),
    getRides: (params) => apiClient.get('/driver/rides', { params }),
    getEarnings: () => apiClient.get('/driver/earnings'),
    getPayouts: () => apiClient.get('/driver/payouts'),
    getVehicles: () => apiClient.get('/driver/vehicles'),
    GetAvailableDrivers: () => apiClient.get('/driver/available-drivers'),
    // Ride Lifecycle
    acceptRide: (id) => apiClient.post(`/driver/rides/${id}/accept`),
    startRide: (id) => apiClient.post(`/driver/rides/${id}/start`),
    completeRide: (id) => apiClient.post(`/driver/rides/${id}/complete`),

};  

/**
 * 5. MOBILITY (CITIZEN RIDES)
 */
export const rideAPI = {
    list: (params) => apiClient.get('/rides', { params }),
    
    // CHANGE THIS: Remove '/request' if your backend endpoint is just '/rides'
    request: (payload) => apiClient.post('/rides', payload), 
    
    getDetails: (id) => apiClient.get(`/rides/${id}`),
    estimate: (payload) => apiClient.post('/rides/quote', payload),
    cancel: (id) => apiClient.post(`/rides/${id}/cancel`),
    submitRating: (id, data) => apiClient.post(`/rides/${id}/rate`, data),
};

/**
 * 6. GOVERNMENT SERVICES & FILINGS
 */
export const applicationAPI = {
    list: (params) => apiClient.get('/applications', { params }),
    getServices: () => apiClient.get('/services'),
    submit: (payload) => apiClient.post('/applications', payload),
    getDetails: (id) => apiClient.get(`/applications/${id}`),
    updateStatus: (id, data) => apiClient.put(`/applications/${id}`, data), // For Officers
};

/**
 * 7. PAYMENTS (MPESA)
 */
export const paymentAPI = {
    initiateStkPush: (data) => apiClient.post('/payments/mpesa/stk-push', data),
    checkStatus: (checkoutRequestId) => apiClient.get(`/payments/mpesa/status/${checkoutRequestId}`),
    getHistory: () => apiClient.get('/payments'),
};

/**
 * 8. AI & INTELLIGENCE (GROK)
 */
export const aiAPI = {
    askGrok: (prompt) => apiClient.post('/ai/grok/chat', { prompt }),
    analyzeDocument: (file) => {
        const formData = new FormData();
        formData.append('document', file);
        return apiClient.post('/ai/analyze-doc', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

/**
 * 9. ADMIN & OFFICER COMMAND CENTER
 */
export const adminAPI = {
    getDashboardStats: () => apiClient.get('/admin/dashboard'),
    getSystemLogs: () => apiClient.get('/admin/logs'),
    manageUsers: () => apiClient.get('/admin/users'),
};

export default apiClient;