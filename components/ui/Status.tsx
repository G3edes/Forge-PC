import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { CompatibilitySeverity } from '@/types/build';

const SEVERITY_DOT: Record<CompatibilitySeverity, string> = {
  ok: 'bg-ok shadow-[0_0_10px_rgba(52,211,153,0.7)]',
  warning: 'bg-warn shadow-[0_0_10px_rgba(251,191,36,0.7)]',
  error: 'bg-danger shadow-[0_0_10px_rgba(248,113,113,0.7)]',
};

const SEVERITY_TEXT: Record<CompatibilitySeverity, string> = {
  ok: 'text-ok',
  warning: 'text-warn',
  error: 'text-danger',
};

export const SEVERITY_LABEL: Record<CompatibilitySeverity, string> = {
  ok: 'Compatível',
  warning: 'Atenção',
  error: 'Incompatível',
};

/** The 🟢 / 🟡 / 🔴 indicator, rendered as an accessible element. */
export function StatusDot({
  severity,
  className,
}: {
  severity: CompatibilitySeverity;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={SEVERITY_LABEL[severity]}
      className={cn('inline-block size-2 shrink-0 rounded-full', SEVERITY_DOT[severity], className)}
    />
  );
}

export function severityTextClass(severity: CompatibilitySeverity): string {
  return SEVERITY_TEXT[severity];
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line text-ink-muted',
    accent: 'border-accent/40 text-accent-soft bg-accent/10',
    ok: 'border-ok/40 text-ok bg-ok/10',
    warn: 'border-warn/40 text-warn bg-warn/10',
    danger: 'border-danger/40 text-danger bg-danger/10',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = 'accent',
  className,
}: {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  tone?: 'accent' | 'ok' | 'warn' | 'danger' | 'cyan';
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const tones = {
    accent: 'bg-accent',
    cyan: 'bg-cyan',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
  } as const;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-line border-t-accent',
        className,
      )}
      role="status"
      aria-label="Carregando"
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}
