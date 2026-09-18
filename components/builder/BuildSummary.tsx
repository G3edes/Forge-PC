'use client';

import { Eye, EyeOff, Minus, Plus, Repeat, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { PanelHeader } from '@/components/ui/Panel';
import { StatusDot } from '@/components/ui/Status';
import { cn } from '@/lib/cn';
import { formatPrice, toSpecRows } from '@/lib/format';
import { useBuildStore } from '@/store/build-store';
import { useViewerStore } from '@/store/viewer-store';
import type { CompatibilityReport, CompatibilitySeverity } from '@/types/build';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  type ComponentCategory,
  type PCComponent,
} from '@/types/components';

/**
 * Right column: one row per slot with price, specs, and the
 * add / remove / replace actions, plus the running total.
 */
export function BuildSummary({
  report,
  total,
  onReplace,
}: {
  report: CompatibilityReport;
  total: number;
  onReplace: (category: ComponentCategory) => void;
}) {
  const build = useBuildStore((state) => state.build);

  const severityByCategory = new Map<ComponentCategory, CompatibilitySeverity>();
  for (const issue of report.issues) {
    for (const category of issue.categories) {
      const current = severityByCategory.get(category);
      if (issue.severity === 'error') severityByCategory.set(category, 'error');
      else if (issue.severity === 'warning' && current !== 'error') {
        severityByCategory.set(category, 'warning');
      } else if (!current) severityByCategory.set(category, 'ok');
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Build summary" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y divide-line-soft">
          {CATEGORY_ORDER.map((category) => (
            <li key={category}>
              {category === 'fans' ? (
                <FansRow
                  severity={severityByCategory.get('fans')}
                  onReplace={() => onReplace('fans')}
                />
              ) : (
                <SlotRow
                  category={category}
                  component={build[category] as PCComponent | null}
                  severity={severityByCategory.get(category)}
                  onReplace={() => onReplace(category)}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-line-soft bg-surface-2/40 p-4">
        <div className="flex items-baseline justify-between">
          <span className="panel-heading">Total</span>
          <span className="text-xl font-semibold tabular-nums text-ink">
            {formatPrice(total)}
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">
          Preços de demonstração (dados mock). Não refletem valores reais de mercado.
        </p>
      </footer>
    </div>
  );
}

function RowShell({
  category,
  severity,
  children,
}: {
  category: ComponentCategory;
  severity?: CompatibilitySeverity;
  children: React.ReactNode;
}) {
  const hidden = useViewerStore((state) => state.hidden.includes(category));
  const toggleHidden = useViewerStore((state) => state.toggleHidden);
  const select = useViewerStore((state) => state.select);
  const selected = useViewerStore((state) => state.selected === category);

  return (
    <div
      className={cn(
        'px-4 py-3 transition-colors',
        selected ? 'bg-accent/8' : 'hover:bg-surface-2/40',
      )}
    >
      <div className="flex items-center gap-2">
        {severity ? <StatusDot severity={severity} /> : <span className="size-2" />}
        <button
          type="button"
          onClick={() => select(category)}
          className="focus-ring rounded text-left text-[10px] font-semibold uppercase tracking-wider text-ink-faint hover:text-accent-soft"
          title="Destacar no visualizador 3D"
        >
          {CATEGORIES[category].shortLabel}
        </button>
        <button
          type="button"
          onClick={() => toggleHidden(category)}
          aria-label={hidden ? 'Mostrar no 3D' : 'Ocultar no 3D'}
          title={hidden ? 'Mostrar no 3D' : 'Ocultar no 3D'}
          className="focus-ring ml-auto rounded p-1 text-ink-faint transition-colors hover:text-ink"
        >
          {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
      {children}
    </div>
  );
}

function SlotRow({
  category,
  component,
  severity,
  onReplace,
}: {
  category: ComponentCategory;
  component: PCComponent | null;
  severity?: CompatibilitySeverity;
  onReplace: () => void;
}) {
  const removeComponent = useBuildStore((state) => state.removeComponent);
  const [expanded, setExpanded] = useState(false);

  return (
    <RowShell category={category} severity={severity}>
      {component ? (
        <>
          <div className="mt-1 flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="focus-ring min-w-0 rounded text-left"
            >
              <p className="truncate text-sm text-ink">{component.name}</p>
              <p className="text-[10px] text-ink-faint">{component.brand}</p>
            </button>
            <span className="shrink-0 text-sm tabular-nums text-ink-muted">
              {formatPrice(component.price)}
            </span>
          </div>

          {expanded ? (
            <dl className="animate-fade-in mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border border-line-soft bg-surface-2/50 p-2">
              {toSpecRows(component.specifications).map((spec) => (
                <div key={spec.key} className="min-w-0">
                  <dt className="truncate text-[9px] uppercase tracking-wide text-ink-faint">
                    {spec.label}
                  </dt>
                  <dd className="truncate text-[11px] text-ink-muted">{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-2 flex gap-1.5">
            <Button size="sm" variant="ghost" icon={<Repeat size={12} />} onClick={onReplace}>
              Substituir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={12} />}
              onClick={() => removeComponent(category)}
              className="text-ink-faint hover:text-danger"
            >
              Remover
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onReplace}
          className="focus-ring mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-left text-xs text-ink-faint transition-colors hover:border-accent/50 hover:text-ink"
        >
          <Plus size={13} />
          Adicionar {CATEGORIES[category].label.toLowerCase()}
        </button>
      )}
    </RowShell>
  );
}

function FansRow({
  severity,
  onReplace,
}: {
  severity?: CompatibilitySeverity;
  onReplace: () => void;
}) {
  const fans = useBuildStore((state) => state.build.fans);
  const setFanQuantity = useBuildStore((state) => state.setFanQuantity);
  const removeComponent = useBuildStore((state) => state.removeComponent);

  return (
    <RowShell category="fans" severity={severity}>
      {fans.length === 0 ? (
        <button
          type="button"
          onClick={onReplace}
          className="focus-ring mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-left text-xs text-ink-faint transition-colors hover:border-accent/50 hover:text-ink"
        >
          <Plus size={13} />
          Adicionar ventoinhas
        </button>
      ) : (
        <div className="mt-1 space-y-2">
          {fans.map((fan) => (
            <div key={fan.component.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-ink">{fan.component.name}</p>
                <p className="text-[10px] text-ink-faint">
                  {fan.component.brand} · {formatPrice(fan.component.price * fan.quantity)}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-md border border-line">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setFanQuantity(fan.component.id, fan.quantity - 1)}
                  className="focus-ring rounded-l-md px-1.5 py-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
                >
                  <Minus size={11} />
                </button>
                <span className="w-5 text-center text-[11px] tabular-nums text-ink">
                  {fan.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setFanQuantity(fan.component.id, fan.quantity + 1)}
                  className="focus-ring rounded-r-md px-1.5 py-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
                >
                  <Plus size={11} />
                </button>
              </div>

              <button
                type="button"
                aria-label="Remover ventoinha"
                onClick={() => removeComponent('fans', fan.component.id)}
                className="focus-ring rounded p-1 text-ink-faint hover:text-danger"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          <Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={onReplace}>
            Adicionar outra
          </Button>
        </div>
      )}
    </RowShell>
  );
}
