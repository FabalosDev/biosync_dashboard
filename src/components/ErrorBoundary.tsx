// src/components/ErrorBoundary.tsx
import React from "react";

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log to Sentry here
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="max-w-xl w-full rounded-lg border p-6 bg-white shadow">
            <h1 className="text-lg font-semibold mb-2">
              Something went wrong.
            </h1>
            <pre className="text-sm overflow-auto whitespace-pre-wrap text-red-600">
              {String(
                this.state.error?.stack || this.state.error || "Unknown error"
              )}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
