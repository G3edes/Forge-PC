import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return <section className={cn('panel', className)}>{children}</section>;
}

export interface PanelHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, icon, action, className }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="text-accent">{icon}</span> : null}
        <h2 className="panel-heading truncate">{title}</h2>
      </div>
      {action}
    </header>
  );
}

export function PanelBody({ children, className }: PanelProps) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-ink-faint">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
