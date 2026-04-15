import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors and displays a recovery UI instead of crashing */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  /** Reloads the application to recover from the error */
  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-xl bg-surface-card p-8 shadow-lg">
          <h1 className="mb-2 text-xl font-semibold text-fg">Something went wrong</h1>
          <p className="mb-6 text-sm text-fg-muted">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition-colors hover:bg-accent-hover"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
