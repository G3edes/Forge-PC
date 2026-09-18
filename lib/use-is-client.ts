'use client';

import { useSyncExternalStore } from 'react';

/** No-op subscribe: the value never changes after hydration. */
function subscribe(): () => void {
  return () => {};
}

/**
 * `false` during SSR and the first (hydration) render, `true` afterwards.
 * Used to gate browser-only work without setting state inside an effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
