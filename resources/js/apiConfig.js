export const getApiBaseUrl = () => {
    const envBase = import.meta.env.VITE_API_URL?.trim() || '';

    if (!envBase) {
        return '/api';
    }

    try {
        const url = new URL(envBase, window.location.origin);

        // If the configured API URL points to localhost or 127.0.0.1, use a relative path
        // so the same origin and port as the browser page are used.
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            return '/api';
        }

        return envBase.replace(/\/+$|\/$/, '');
    } catch {
        return envBase;
    }
};
