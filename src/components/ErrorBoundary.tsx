import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#161920] border border-slate-200 dark:border-[#1E222A] rounded-2xl p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Algo deu errado
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {this.state.error.message || 'Erro inesperado'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
