import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getApiBaseUrl } from './apiConfig';

const baseUrl = getApiBaseUrl();

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

// Setup Laravel Echo for real-time features
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: false,
    wsHost: import.meta.env.VITE_PUSHER_HOST || '127.0.0.1',
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                axios.post('/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    callback(true, error);
                });
            }
        };
    },
});
