import { Component, type ReactNode } from 'react';
import { getErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';
import './ErrorBoundary.scss';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: getErrorMessage(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('UI error boundary captured an exception.', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="card text-center">
            <h1>Something went wrong</h1>
            <p className="text-secondary">{this.state.message}</p>
            <div className="error-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleReload}
              >
                Reload the app
              </button>
              <a className="btn btn-secondary" href="/">
                Back to home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
