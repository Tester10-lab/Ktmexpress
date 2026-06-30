import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    
    // Auto-recover from chunk load errors (stale cache / MIME type errors)
    const errorMsg = error?.message?.toLowerCase() || '';
    const isChunkError = errorMsg.includes('failed to fetch dynamically imported module') || 
                         errorMsg.includes('text/html') || 
                         errorMsg.includes('valid javascript mime type');
                         
    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reloaded', 'true');
        console.warn('Stale chunk detected. Forcing page reload to clear cache.');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto break-words">{this.state.error?.message}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem('chunk_reloaded');
              window.location.reload();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
