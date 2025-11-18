import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log to console so production users can share details
    try {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught error:', error);
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Error info:', errorInfo);
    } catch {
      /* ignore */
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Unknown error';

      return React.createElement('div', {
        className: 'min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4'
      },
        React.createElement('div', { className: 'max-w-md w-full' },
          React.createElement('div', { className: 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-red-200' },
            React.createElement('div', { className: 'w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center' },
              React.createElement(AlertTriangle, { className: 'w-10 h-10 text-white' })
            ),
            React.createElement('h2', { className: 'text-2xl font-bold mb-3 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent' },
              'Oops! Something went wrong'
            ),
            React.createElement('p', { className: 'text-gray-600 mb-6' },
              'We encountered an unexpected error. Don\'t worry, your data is safe.'
            ),
            // In development always show details; in production only when explicitly enabled
            ((process.env.NODE_ENV === 'development') || (import.meta as any).env?.VITE_SHOW_ERRORS === 'true') && React.createElement('div', { className: 'mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-left' },
              React.createElement('p', { className: 'text-xs font-mono text-red-800 break-all' },
                errorMessage
              )
            ),
            React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3' },
              React.createElement('button', {
                onClick: this.handleReset,
                className: 'flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105'
              },
                React.createElement(RefreshCw, { className: 'w-4 h-4' }),
                'Try Again'
              ),
              React.createElement('button', {
                onClick: this.handleGoHome,
                className: 'flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium border border-gray-300 shadow-sm hover:shadow-md'
              },
                React.createElement(Home, { className: 'w-4 h-4' }),
                'Go Home'
              )
            ),
            React.createElement('p', { className: 'text-xs text-gray-500 mt-6' },
              'If this problem persists, please refresh the page or contact support.'
            )
          )
        )
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundaryWrapper: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return React.createElement(ErrorBoundary, { fallback, children });
};

export default ErrorBoundary;
