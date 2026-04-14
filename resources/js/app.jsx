import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppRouter from './AppRouter';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppRouter />
            </AuthProvider>
        </ErrorBoundary>
    );
}

const container = document.getElementById('app');
if (container) {
    if (!window.reactRoot) {
        window.reactRoot = createRoot(container);
    }
    window.reactRoot.render(<App />);
}

export default App;