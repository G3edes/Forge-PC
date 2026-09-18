'use client';

import { ChevronDown, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { PanelHeader } from '@/components/ui/Panel';
import { Badge, SEVERITY_LABEL, StatusDot, severityTextClass } from '@/components/ui/Status';
import { cn } from '@/lib/cn';
import { CATEGORIES } from '@/types/components';
import type { CompatibilityReport } from '@/types/build';

const HEADLINE: Record<CompatibilityReport['status'], string> = {
  ok: 'Configuração compatível',
  warning: 'Compatível com ressalvas',
  error: 'Incompatibilidade encontrada',
};

/** Traffic-light compatibility list; each row expands with the reason. */
export function CompatibilityPanel({ report }: { report: CompatibilityReport }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const ordered = [...report.issues].sort((a, b) => {
    const weight = { error: 0, warning: 1, ok: 2 };
    return weight[a.severity] - weight[b.severity];
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Compatibilidade"
        icon={<ShieldCheck size={13} />}
        action={
          <div className="flex items-center gap-1">
            {report.errors > 0 ? <Badge tone="danger">{report.errors}</Badge> : null}
            {report.warnings > 0 ? <Badge tone="warn">{report.warnings}</Badge> : null}
            {report.errors === 0 && report.warnings === 0 && report.passed > 0 ? (
              <Badge tone="ok">{report.passed}</Badge>
            ) : null}
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
          <StatusDot severity={report.status} />
          <p className={cn('text-xs font-medium', severityTextClass(report.status))}>
            {HEADLINE[report.status]}
          </p>
        </div>

        {ordered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs leading-relaxed text-ink-faint">
            Selecione ao menos dois componentes para que as verificações de
            compatibilidade comecem a rodar.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {ordered.map((issue) => {
              const open = openId === issue.id;
              return (
                <li key={issue.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : issue.id)}
                    aria-expanded={open}
                    className="focus-ring flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-2/50"
                  >
                    <StatusDot severity={issue.severity} className="mt-1.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs leading-snug text-ink">{issue.title}</span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-ink-faint">
                        {issue.categories.map((c) => CATEGORIES[c].shortLabel).join(' · ')}
                      </span>
                    </span>
                    <ChevronDown
                      size={13}
                      className={cn(
                        'mt-0.5 shrink-0 text-ink-faint transition-transform',
                        open && 'rotate-180',
                      )}
                    />
                  </button>

                  {open ? (
                    <div className="animate-fade-in px-4 pb-3 pl-8">
                      <p className="rounded-md border border-line-soft bg-surface-2/60 p-2.5 text-[11px] leading-relaxed text-ink-muted">
                        <span className={cn('font-medium', severityTextClass(issue.severity))}>
                          {SEVERITY_LABEL[issue.severity]}.{' '}
                        </span>
                        {issue.detail}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {report.missing.length > 0 ? (
          <div className="border-t border-line-soft px-4 py-3">
            <p className="panel-heading mb-1.5">Faltando na build</p>
            <div className="flex flex-wrap gap-1">
              {report.missing.map((category) => (
                <Badge key={category}>{CATEGORIES[category].shortLabel}</Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
