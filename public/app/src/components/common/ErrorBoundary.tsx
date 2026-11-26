import React from 'react';
import { Button } from '../ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-base-50 dark:bg-base-950">
          <div className="max-w-md w-full bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 rounded-2xl p-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold text-base-900 dark:text-base-50 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-base-600 dark:text-base-400 mb-6">{this.state.message}</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
