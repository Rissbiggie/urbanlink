import React from 'react';

export default function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`max-w-sm rounded border px-4 py-3 shadow-lg flex items-start gap-3 transition transform duration-150 ease-out bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                        toast.variant === 'success'
                            ? 'text-green-800 dark:text-green-200'
                            : toast.variant === 'error'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-gray-900 dark:text-gray-100'
                    }`}
                >
                    <div className="flex-1">
                        <div className="text-sm font-medium">{toast.message}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onDismiss(toast.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
