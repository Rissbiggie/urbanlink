import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL ?? '/api';

window.axios = axios.create({
    baseURL: baseUrl,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
});

const token = localStorage.getItem('urbanlink_token');
if (token) {
    window.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
}
