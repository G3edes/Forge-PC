'use client';

import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from './Button';

interface Props {
  children: ReactNode;
  /** Rendered instead of the default card when provided. */
  fallback?: ReactNode;
  /** Short label used in the default message, e.g. "o visualizador 3D". */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors from a subtree — used around the 3D canvas so a WebGL
 * or model failure degrades to a message instead of blanking the page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[build-forge] erro capturado pelo ErrorBoundary', error, info);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback, label = 'esta seção' } = this.props;

    if (!error) return children;
    if (fallback) return fallback;

    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="text-warn" size={22} />
        <p className="text-sm font-medium text-ink">Não foi possível carregar {label}</p>
        <p className="max-w-sm text-xs leading-relaxed text-ink-faint">
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        <Button size="sm" onClick={this.reset}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
