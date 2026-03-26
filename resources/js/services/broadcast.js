import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

export function getEcho() {
    return echoInstance;
}

export function createEcho(token) {
    if (!token) {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    const key = import.meta.env.VITE_PUSHER_APP_KEY;
    const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
    const host = import.meta.env.VITE_PUSHER_HOST;

    // If no Pusher key is defined, we cannot set up real-time.
    if (!key) {
        return null;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'pusher',
        key,
        cluster,
        wsHost: host || window.location.hostname,
        wsPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
        wssPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });

    return echoInstance;
}

export function disconnectEcho() {
    if (!echoInstance) return;
    echoInstance.disconnect();
    echoInstance = null;
}
