import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset error state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the page to fully reset the app
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center">
              {/* Error Icon */}
              <div className="text-6xl mb-4">⚠️</div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-red-500 mb-4">
                Something Went Wrong
              </h1>

              {/* Error Message */}
              <p className="text-gray-300 mb-6">
                The application encountered an unexpected error. You can try to recover
                or reload the page.
              </p>

              {/* Error Details (Development only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-dark-elevated rounded-lg text-left overflow-auto max-h-60">
                  <h3 className="text-sm font-semibold text-gold-500 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <pre className="text-xs text-red-400 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={this.handleReset}
                >
                  Try to Recover
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Main Menu
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-500 mt-6">
                If this problem persists, please try clearing your browser cache or
                contact support.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
