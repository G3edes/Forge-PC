'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { StatusDot } from '@/components/ui/Status';
import { cn } from '@/lib/cn';
import type { BuildAnalysis } from '@/lib/use-build-analysis';
import { useViewerStore } from '@/store/viewer-store';

import { PerformancePanel, PowerPanel, TemperaturePanel } from './AnalysisPanels';
import { CompatibilityPanel } from './CompatibilityPanel';
import { RgbPanel } from './RgbPanel';
import { SelectedPartPanel } from './SelectedPartPanel';

type TabId = 'compatibility' | 'power' | 'performance' | 'temperature' | 'rgb' | 'selection';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'compatibility', label: 'Compatibilidade' },
  { id: 'power', label: 'Energia' },
  { id: 'performance', label: 'Desempenho' },
  { id: 'temperature', label: 'Temperatura' },
  { id: 'rgb', label: 'RGB' },
  { id: 'selection', label: 'Peça selecionada' },
];

/** Tabbed dock under the 3D viewport holding every analysis panel. */
export function AnalysisDock({ analysis }: { analysis: BuildAnalysis }) {
  const [tab, setTab] = useState<TabId>('compatibility');
  const [collapsed, setCollapsed] = useState(false);

  // Clicking a part in the 3D scene opens its detail tab. Subscribing to the
  // store (rather than reacting to a rendered value) keeps this a single render.
  useEffect(
    () =>
      useViewerStore.subscribe((state, previous) => {
        if (state.selected && state.selected !== previous.selected) {
          setTab('selection');
          setCollapsed(false);
        }
      }),
    [],
  );

  return (
    <section className="flex min-h-0 flex-col border-t border-line-soft bg-surface/60 backdrop-blur">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line-soft px-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setCollapsed(false);
            }}
            className={cn(
              'focus-ring relative shrink-0 px-3 py-2.5 text-[11px] font-medium transition-colors',
              tab === item.id && !collapsed
                ? 'text-ink'
                : 'text-ink-faint hover:text-ink-muted',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.id === 'compatibility' ? <StatusDot severity={analysis.report.status} /> : null}
              {item.label}
            </span>
            {tab === item.id && !collapsed ? (
              <span className="accent-rule absolute inset-x-2 bottom-0 h-0.5 rounded-full" />
            ) : null}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
          className="focus-ring ml-auto shrink-0 rounded p-1.5 text-ink-faint hover:text-ink"
        >
          <ChevronDown size={14} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {!collapsed ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'compatibility' ? <CompatibilityPanel report={analysis.report} /> : null}
          {tab === 'power' ? <PowerPanel power={analysis.power} editableMargin /> : null}
          {tab === 'performance' ? <PerformancePanel performance={analysis.performance} /> : null}
          {tab === 'temperature' ? <TemperaturePanel temperatures={analysis.temperatures} /> : null}
          {tab === 'rgb' ? <RgbPanel /> : null}
          {tab === 'selection' ? <SelectedPartPanel /> : null}
        </div>
      ) : null}
    </section>
  );
}
