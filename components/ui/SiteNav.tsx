'use client';

import { GitCompareArrows, Layers3, LayoutDashboard, Save } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/builder', label: 'Builder', icon: Layers3 },
  { href: '/builds', label: 'Minhas builds', icon: Save },
  { href: '/compare', label: 'Comparar', icon: GitCompareArrows },
] as const;

/** Top navigation used on every page except the full-bleed builder. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-void/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-md">
          <span className="grid size-7 place-items-center rounded-md bg-accent/15 text-accent">
            <Layers3 size={15} />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[13px] font-semibold tracking-[0.18em] text-ink">
              BUILD FORGE
            </span>
            <span className="text-[9px] tracking-[0.24em] text-ink-faint">PC BUILDER 3D</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto">
          {LINKS.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'focus-ring flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors sm:px-3',
                  active
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-faint hover:bg-surface-2/60 hover:text-ink-muted',
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
