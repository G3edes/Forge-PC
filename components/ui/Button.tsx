import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[0_0_0_1px_rgba(124,92,255,0.5),0_8px_24px_-12px_rgba(124,92,255,0.9)] hover:bg-accent-soft',
  secondary:
    'bg-surface-3 text-ink border border-line hover:border-accent/60 hover:bg-surface-3/80',
  outline: 'border border-line text-ink-muted hover:text-ink hover:border-accent/60',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-2',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'focus-ring inline-flex items-center justify-center rounded-lg font-medium tracking-wide',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
