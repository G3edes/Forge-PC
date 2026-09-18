'use client';

import { Box } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Spinner } from '@/components/ui/Status';
import type { BuildSelection } from '@/types/build';

/**
 * The canvas touches `window` and WebGL, so it is loaded client-side only.
 * A failure here degrades to a message — the rest of the builder keeps working.
 */
const PCScene = dynamic(() => import('./PCScene'), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

export function ViewerLoading({ message = 'Montando a cena 3D…' }: { message?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-void">
      <div className="relative">
        <Box className="text-ink-faint animate-soft-pulse" size={30} strokeWidth={1.2} />
      </div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        <Spinner className="size-3" />
        {message}
      </div>
    </div>
  );
}

export function Viewer3D({ build }: { build: BuildSelection }) {
  return (
    <ErrorBoundary label="o visualizador 3D">
      <Suspense fallback={<ViewerLoading />}>
        <PCScene build={build} />
      </Suspense>
    </ErrorBoundary>
  );
}
