import Echo from 'laravel-echo';

class RealtimeService {
    constructor() {
        this.echo = window.Echo;
        this.listeners = new Map();
    }

    // Listen for ride requests (for drivers)
    listenForRideRequests(userId, callback) {
        if (!this.echo) return;

        const channel = this.echo.private(`user.${userId}`)
            .listen('.ride.requested', callback);

        this.listeners.set(`ride-requests-${userId}`, channel);
        return channel;
    }

    // Listen for ride status updates (for passengers)
    listenForRideUpdates(userId, callback) {
        if (!this.echo) return;

        const channel = this.echo.private(`user.${userId}`)
            .listen('.ride.status.updated', callback);

        this.listeners.set(`ride-updates-${userId}`, channel);
        return channel;
    }

    // Stop listening for ride requests
    stopListeningRideRequests(userId) {
        const channel = this.listeners.get(`ride-requests-${userId}`);
        if (channel) {
            this.echo.leave(`user.${userId}`);
            this.listeners.delete(`ride-requests-${userId}`);
        }
    }

    // Stop listening for ride updates
    stopListeningRideUpdates(userId) {
        const channel = this.listeners.get(`ride-updates-${userId}`);
        if (channel) {
            this.echo.leave(`user.${userId}`);
            this.listeners.delete(`ride-updates-${userId}`);
        }
    }

    // Clean up all listeners
    cleanup() {
        this.listeners.forEach((channel, key) => {
            const userId = key.split('-').pop();
            this.echo.leave(`user.${userId}`);
        });
        this.listeners.clear();
    }
}

export default new RealtimeService();