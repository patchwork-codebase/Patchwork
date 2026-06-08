import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center p-4">
          <div className="bg-[#1C1A24] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            
            <p className="text-slate-400 text-[15px] mb-8 leading-relaxed">
              We encountered an unexpected error while trying to load this screen. Our team has been notified.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </button>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left bg-black/40 p-4 rounded-lg overflow-x-auto border border-red-500/20">
                <p className="text-red-400 font-mono text-xs font-bold mb-2">Error Details (Dev Only):</p>
                <pre className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
