'use client';

import { ArrowRight, Cpu, MonitorCog, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/Status';
import type { PresetBuild } from '@/data/builds';
import { idsToSelection } from '@/lib/build-utils';
import { calculateTotal, estimatePower } from '@/lib/calculations';
import { checkCompatibility } from '@/lib/compatibility';
import { formatPrice } from '@/lib/format';
import { useBuildStore } from '@/store/build-store';

/** Dashboard card for a starter configuration. Clicking loads it in the builder. */
export function PresetBuildCard({ preset }: { preset: PresetBuild }) {
  const router = useRouter();
  const loadBuild = useBuildStore((state) => state.loadBuild);

  const summary = useMemo(() => {
    const selection = idsToSelection(preset.componentIds);
    return {
      total: calculateTotal(selection),
      power: estimatePower(selection),
      report: checkCompatibility(selection),
      cpu: selection.cpu?.name ?? '—',
      gpu: selection.gpu?.name ?? '—',
    };
  }, [preset.componentIds]);

  const open = () => {
    loadBuild({
      id: null,
      name: preset.name,
      componentIds: preset.componentIds,
      rgb: preset.rgb,
    });
    router.push('/builder');
  };

  return (
    <article className="panel group relative overflow-hidden p-5 transition-colors hover:border-line">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, ${preset.accent}, transparent)` }}
      />

      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{preset.name}</h3>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-faint">
            {preset.tagline}
          </p>
        </div>
        <StatusDot severity={summary.report.status} className="mt-2" />
      </header>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{preset.description}</p>

      <dl className="mt-4 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px]">
          <Cpu size={12} className="shrink-0 text-ink-faint" />
          <dt className="sr-only">CPU</dt>
          <dd className="truncate text-ink-muted">{summary.cpu}</dd>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <MonitorCog size={12} className="shrink-0 text-ink-faint" />
          <dt className="sr-only">GPU</dt>
          <dd className="truncate text-ink-muted">{summary.gpu}</dd>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Zap size={12} className="shrink-0 text-ink-faint" />
          <dt className="sr-only">Consumo estimado</dt>
          <dd className="text-ink-muted">
            {summary.power.estimatedDraw} W · fonte {summary.power.recommendedPsu} W+
          </dd>
        </div>
      </dl>

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-line-soft pt-4">
        <span className="text-lg font-semibold tabular-nums text-ink">
          {formatPrice(summary.total)}
        </span>
        <Button size="sm" variant="secondary" icon={<ArrowRight size={13} />} onClick={open}>
          Abrir
        </Button>
      </footer>
    </article>
  );
}
