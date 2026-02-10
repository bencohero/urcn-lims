import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Une erreur est survenue
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              L'application a rencontre un probleme inattendu.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-w-lg overflow-auto rounded bg-gray-100 p-3 text-left text-xs text-gray-700">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={this.handleReset}>
                Reessayer
              </Button>
              <Button onClick={() => (window.location.href = '/dashboard')}>
                Tableau de bord
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
