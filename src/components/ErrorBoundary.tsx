import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Caught error in ${this.props.moduleName || 'module'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleGoHome = () => {
    this.handleReset();
    window.location.hash = '#/dashboard';
  };

  public handleReload = () => {
    window.location.reload();
  };

  public toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const moduleTitle = this.props.moduleName || 'Module Inspector';

      return (
        <div
          id="error-boundary-fallback"
          className="flex-1 w-full h-full min-h-[360px] flex items-center justify-center p-6 bg-[#0A0B0D] text-[#E0E0E0] font-mono"
        >
          <div className="max-w-xl w-full p-6 rounded-xl border border-rose-500/30 bg-[#12161E] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  RECOVERED RUNTIME FAULT
                </span>
                <h2 className="text-sm font-bold text-white mt-1">
                  {moduleTitle} Encountered an Issue
                </h2>
              </div>
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              An unexpected runtime error was caught and isolated. The rest of the NexusDev AI platform remains fully operational.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-[#0A0B0D] border border-[#2D3748] text-xs text-rose-300 font-mono">
                <div className="font-bold text-rose-400">Error:</div>
                <div className="mt-1 break-all">{this.state.error.message || 'Unknown error occurred'}</div>
              </div>
            )}

            <div>
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 transition cursor-pointer"
              >
                <span>{this.state.showDetails ? 'Hide diagnostic details' : 'Show diagnostic details'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && this.state.errorInfo && (
                <pre className="mt-2 p-3 rounded bg-[#07080A] border border-gray-800 text-[10px] text-gray-400 overflow-x-auto max-h-40 leading-tight">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2D3748]">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry {moduleTitle}</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A1D23] hover:bg-[#252A34] text-gray-300 border border-[#2D3748] text-xs font-bold transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A1D23] hover:bg-[#252A34] text-gray-400 border border-[#2D3748] text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
