import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Here you could also log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            <div className="mb-8">
              <div className="text-8xl mb-4">💥</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-8">
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition"
              >
                Refresh Page
              </button>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-white rounded-lg shadow-md p-6 text-left">
                <h3 className="font-bold text-gray-900 mb-4">Error Details (Development)</h3>
                <div className="bg-gray-100 rounded p-4 text-sm font-mono text-red-600 mb-4">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                      Stack Trace
                    </summary>
                    <pre className="bg-gray-100 rounded p-4 text-xs font-mono text-gray-800 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Error occurred at: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;