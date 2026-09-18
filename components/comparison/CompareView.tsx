'use client';

import { Equal, GitCompareArrows } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge, ProgressBar, StatusDot } from '@/components/ui/Status';
import { PRESET_BUILDS } from '@/data/builds';
import { idsToSelection, selectionToIds } from '@/lib/build-utils';
import {
  calculateTotal,
  estimatePerformance,
  estimatePower,
  estimateTemperatures,
} from '@/lib/calculations';
import { checkCompatibility } from '@/lib/compatibility';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useBuildStore } from '@/store/build-store';
import { useBuildsStore } from '@/store/builds-store';
import type { BuildComponentIds } from '@/types/build';
import { CATEGORIES, CATEGORY_ORDER } from '@/types/components';

interface Candidate {
  id: string;
  label: string;
  group: string;
  componentIds: BuildComponentIds;
}

/** Side-by-side comparison. Differences are highlighted, never ranked. */
export function CompareView() {
  const savedBuilds = useBuildsStore((state) => state.builds);
  const refresh = useBuildsStore((state) => state.refresh);
  const currentBuild = useBuildStore((state) => state.build);
  const currentName = useBuildStore((state) => state.name);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const candidates = useMemo<Candidate[]>(() => {
    const list: Candidate[] = [
      {
        id: 'current',
        label: `${currentName} (em edição)`,
        group: 'Atual',
        componentIds: selectionToIds(currentBuild),
      },
      ...PRESET_BUILDS.map((preset) => ({
        id: preset.id,
        label: preset.name,
        group: 'Prontas',
        componentIds: preset.componentIds,
      })),
      ...savedBuilds.map((build) => ({
        id: build.id,
        label: build.name,
        group: 'Salvas',
        componentIds: build.componentIds,
      })),
    ];
    return list;
  }, [currentBuild, currentName, savedBuilds]);

  const [leftId, setLeftId] = useState('preset-gaming');
  const [rightId, setRightId] = useState('preset-workstation');

  const left = candidates.find((item) => item.id === leftId) ?? candidates[0];
  const right = candidates.find((item) => item.id === rightId) ?? candidates[0];

  const analysisA = useAnalysis(left?.componentIds);
  const analysisB = useAnalysis(right?.componentIds);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex items-center gap-2">
        <GitCompareArrows size={18} className="text-accent" />
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Compare builds</h1>
      </header>
      <p className="mt-1 text-xs text-ink-faint">
        As diferenças são destacadas de forma objetiva. Build Forge não elege uma
        configuração como &ldquo;melhor&rdquo; — a escolha depende do seu uso.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <BuildPicker
          label="Build A"
          value={leftId}
          candidates={candidates}
          onChange={setLeftId}
        />
        <BuildPicker
          label="Build B"
          value={rightId}
          candidates={candidates}
          onChange={setRightId}
        />
      </div>

      <section className="panel mt-6 overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr] gap-px bg-line-soft sm:grid-cols-[130px_1fr_1fr]">
          <HeaderCell />
          <HeaderCell>
            <span className="text-xs font-medium text-ink">{left?.label}</span>
            <StatusDot severity={analysisA.report.status} />
          </HeaderCell>
          <HeaderCell>
            <span className="text-xs font-medium text-ink">{right?.label}</span>
            <StatusDot severity={analysisB.report.status} />
          </HeaderCell>

          {CATEGORY_ORDER.map((category) => {
            const a = describe(analysisA.selection, category);
            const b = describe(analysisB.selection, category);
            const same = a === b;
            return (
              <Row key={category} label={CATEGORIES[category].shortLabel} same={same}>
                <Cell value={a} same={same} />
                <Cell value={b} same={same} />
              </Row>
            );
          })}

          <Row label="Consumo" same={analysisA.power.estimatedDraw === analysisB.power.estimatedDraw}>
            <Cell value={`${analysisA.power.estimatedDraw} W`} />
            <Cell value={`${analysisB.power.estimatedDraw} W`} />
          </Row>

          <Row label="Fonte rec." same={analysisA.power.recommendedPsu === analysisB.power.recommendedPsu}>
            <Cell value={`${analysisA.power.recommendedPsu} W+`} />
            <Cell value={`${analysisB.power.recommendedPsu} W+`} />
          </Row>

          <Row label="CPU gaming" same={false}>
            <Cell value={analysisA.temperatures.cpu ? `~${analysisA.temperatures.cpu.gaming}°C` : '—'} />
            <Cell value={analysisB.temperatures.cpu ? `~${analysisB.temperatures.cpu.gaming}°C` : '—'} />
          </Row>

          <Row label="Total" same={analysisA.total === analysisB.total}>
            <Cell value={formatPrice(analysisA.total)} strong />
            <Cell value={formatPrice(analysisB.total)} strong />
          </Row>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <PerformanceCard title={left?.label ?? 'Build A'} analysis={analysisA} />
        <PerformanceCard title={right?.label ?? 'Build B'} analysis={analysisB} />
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-faint">
        Índices de desempenho e temperaturas são estimativas calculadas a partir
        de dados mock.
      </p>
    </div>
  );
}

function useAnalysis(componentIds: BuildComponentIds | undefined) {
  return useMemo(() => {
    const selection = idsToSelection(componentIds);
    return {
      selection,
      report: checkCompatibility(selection),
      power: estimatePower(selection),
      performance: estimatePerformance(selection),
      temperatures: estimateTemperatures(selection),
      total: calculateTotal(selection),
    };
  }, [componentIds]);
}

function describe(
  selection: ReturnType<typeof idsToSelection>,
  category: (typeof CATEGORY_ORDER)[number],
): string {
  if (category === 'fans') {
    if (selection.fans.length === 0) return '—';
    return selection.fans.map((fan) => `${fan.quantity}x ${fan.component.name}`).join(', ');
  }
  const component = selection[category];
  return component && !Array.isArray(component) ? component.name : '—';
}

function BuildPicker({
  label,
  value,
  candidates,
  onChange,
}: {
  label: string;
  value: string;
  candidates: Candidate[];
  onChange: (value: string) => void;
}) {
  const groups = Array.from(new Set(candidates.map((item) => item.group)));

  return (
    <label className="panel block p-3">
      <span className="panel-heading">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-1.5 h-9 w-full rounded-lg border border-line bg-surface-2 px-2 text-xs text-ink"
      >
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {candidates
              .filter((item) => item.group === group)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function HeaderCell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-surface-2/70 px-3 py-2.5">
      {children}
    </div>
  );
}

function Row({
  label,
  same,
  children,
}: {
  label: string;
  same?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-1.5 bg-surface px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
        {same ? <Equal size={10} className="text-ink-faint" /> : null}
      </div>
      {children}
    </>
  );
}

function Cell({
  value,
  same,
  strong,
}: {
  value: string;
  same?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-3 py-2.5 text-[11px] leading-snug',
        same ? 'bg-surface text-ink-faint' : 'bg-surface text-ink',
        strong && 'text-sm font-semibold tabular-nums',
      )}
    >
      {value}
    </div>
  );
}

function PerformanceCard({
  title,
  analysis,
}: {
  title: string;
  analysis: ReturnType<typeof useAnalysis>;
}) {
  const rows = [
    { label: 'Gaming', value: analysis.performance.gaming },
    { label: 'Productivity', value: analysis.performance.productivity },
    { label: 'Rendering', value: analysis.performance.rendering },
  ];

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-xs font-medium text-ink">{title}</h2>
        {analysis.report.errors > 0 ? (
          <Badge tone="danger">{analysis.report.errors} erro(s)</Badge>
        ) : analysis.report.warnings > 0 ? (
          <Badge tone="warn">{analysis.report.warnings} aviso(s)</Badge>
        ) : (
          <Badge tone="ok">Compatível</Badge>
        )}
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-ink-muted">{row.label}</span>
              <span className="tabular-nums text-ink">{row.value}%</span>
            </div>
            <ProgressBar value={row.value} tone="accent" />
          </div>
        ))}
      </div>
    </div>
  );
}
