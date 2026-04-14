import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // Using relative path since it's hosted with Laravel
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Attach Token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('urbanlink_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;