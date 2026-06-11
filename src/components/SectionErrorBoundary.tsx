import { Component, ErrorInfo, ReactNode } from 'react';
import { Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SectionErrorBoundary caught:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-[#161920] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {this.props.fallbackTitle || 'Algo deu errado'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {this.state.error?.message || 'Erro inesperado nesta seção'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
