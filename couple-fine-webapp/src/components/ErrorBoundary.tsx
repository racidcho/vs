import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();

    // Reload the page
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                앗! 문제가 발생했어요
              </h1>

              <p className="text-gray-600 mb-6">
                예상치 못한 오류가 발생했어요.
                새로고침하면 대부분 해결됩니다.
              </p>

              {/* Error details for debugging */}
              {import.meta.env.DEV && this.state.error && (
                <div className="w-full mb-6 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-gray-600 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                새로고침
              </button>

              <p className="text-xs text-gray-500 mt-4">
                문제가 계속되면 잠시 후 다시 시도해주세요
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}