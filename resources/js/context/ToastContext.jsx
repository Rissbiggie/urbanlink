import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

function playToastSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gain.gain.value = 0.1;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.12);
    } catch {
        // ignore audio failures (browser restrictions)
    }
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const variant = toast.variant || 'info';
        const message = toast.message || '';
        const duration = toast.duration ?? DEFAULT_DURATION;

        setToasts((prev) => [{ id, message, variant }, ...prev]);
        playToastSound();

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = useMemo(
        () => ({ addToast, removeToast }),
        [addToast, removeToast]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}
