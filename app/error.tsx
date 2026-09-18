'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[build-forge] erro na rota', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <AlertTriangle className="text-warn" size={26} />
      <h1 className="mt-4 text-lg font-semibold text-ink">Algo deu errado</h1>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        {error.message || 'Ocorreu um erro inesperado ao renderizar esta página.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-6 rounded-lg border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent/60"
      >
        Tentar novamente
      </button>
    </div>
  );
}
