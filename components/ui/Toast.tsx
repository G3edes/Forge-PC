'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { create } from 'zustand';

import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, tone = 'info') =>
    set((state) => ({ toasts: [...state.toasts, { id: nextId++, message, tone }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Fire-and-forget notifications, usable outside React too. */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const TONES: Record<ToastTone, string> = {
  success: 'border-ok/40 text-ok',
  error: 'border-danger/40 text-danger',
  info: 'border-line text-ink-muted',
};

function ToastItem({ item }: { item: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = ICONS[item.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), 3600);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id]);

  return (
    <button
      type="button"
      onClick={() => dismiss(item.id)}
      className={cn(
        'animate-fade-in pointer-events-auto flex w-full items-start gap-2 rounded-lg border bg-surface-2/95 px-3 py-2.5',
        'text-left text-xs leading-relaxed shadow-xl backdrop-blur',
        TONES[item.tone],
      )}
    >
      <Icon size={14} className="mt-px shrink-0" />
      <span className="text-ink">{item.message}</span>
    </button>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </div>
  );
}
