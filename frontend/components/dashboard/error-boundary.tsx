'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in RoadTwin Command Center:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">
                {this.props.fallbackTitle || 'COMMAND CENTER INTERFACE DEGRADED'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected client rendering error occurred. Underlying digital twin services remain active.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shadow-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RELOAD COMMAND CENTER</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
