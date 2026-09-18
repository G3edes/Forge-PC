'use client';

import { Activity, Gauge, Thermometer, Zap } from 'lucide-react';

import { PanelHeader } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Status';
import { cn } from '@/lib/cn';
import type {
  PerformanceEstimate,
  PowerEstimate,
  TemperatureEstimate,
} from '@/types/build';

const ESTIMATE_NOTE =
  'Estimativa gerada a partir de dados mock — use apenas como referência relativa.';

/** Consumo por componente + fonte recomendada. */
export function PowerPanel({ power }: { power: PowerEstimate }) {
  const hasData = power.estimatedDraw > 0;
  const loadTone =
    power.loadPercent === null
      ? 'accent'
      : power.loadPercent > 100
        ? 'danger'
        : power.loadPercent > 80
          ? 'warn'
          : 'ok';

  return (
    <div>
      <PanelHeader title="Consumo de energia" icon={<Zap size={13} />} />
      <div className="p-4">
        {!hasData ? (
          <p className="text-xs text-ink-faint">
            Adicione componentes para estimar o consumo do sistema.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="panel-heading">Consumo estimado</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">
                  {power.estimatedDraw}
                  <span className="ml-1 text-sm font-normal text-ink-faint">W</span>
                </p>
              </div>
              <div className="text-right">
                <p className="panel-heading">Fonte recomendada</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-accent-soft">
                  {power.recommendedPsu}W+
                </p>
              </div>
            </div>

            <p className="mt-1 text-[10px] text-ink-faint">
              Margem de segurança aplicada: {Math.round(power.margin * 100)}%
            </p>

            {power.loadPercent !== null ? (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-faint">
                  <span>Carga sobre a fonte</span>
                  <span className="tabular-nums">{power.loadPercent}%</span>
                </div>
                <ProgressBar value={power.loadPercent} tone={loadTone} />
              </div>
            ) : null}

            <ul className="mt-4 space-y-1.5">
              {power.breakdown.map((entry, index) => (
                <li key={`${entry.category}-${index}`} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">
                    {entry.label}
                  </span>
                  <ProgressBar
                    value={(entry.watts / Math.max(power.estimatedDraw, 1)) * 100}
                    tone="cyan"
                    className="h-1"
                  />
                  <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-ink-muted">
                    {entry.watts} W
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const PERFORMANCE_LABELS: Array<{ key: keyof PerformanceEstimate; label: string }> = [
  { key: 'gaming', label: 'Gaming' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'rendering', label: 'Rendering' },
];

export function PerformancePanel({ performance }: { performance: PerformanceEstimate }) {
  const empty =
    performance.gaming === 0 && performance.productivity === 0 && performance.rendering === 0;

  return (
    <div>
      <PanelHeader title="Desempenho estimado" icon={<Gauge size={13} />} />
      <div className="space-y-3 p-4">
        {empty ? (
          <p className="text-xs text-ink-faint">
            Selecione ao menos CPU ou GPU para ver os índices estimados.
          </p>
        ) : (
          <>
            {PERFORMANCE_LABELS.map(({ key, label }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted">{label}</span>
                  <span className="text-[11px] tabular-nums text-ink">{performance[key]}%</span>
                </div>
                <ProgressBar
                  value={performance[key]}
                  tone={performance[key] >= 80 ? 'ok' : performance[key] >= 55 ? 'accent' : 'warn'}
                />
              </div>
            ))}
            <p className="pt-1 text-[10px] leading-relaxed text-ink-faint">{ESTIMATE_NOTE}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function TemperaturePanel({ temperatures }: { temperatures: TemperatureEstimate }) {
  const { cpu, gpu } = temperatures;

  return (
    <div>
      <PanelHeader title="Temperatura estimada" icon={<Thermometer size={13} />} />
      <div className="space-y-3 p-4">
        {!cpu && !gpu ? (
          <p className="text-xs text-ink-faint">
            Selecione CPU ou GPU para ver a estimativa térmica.
          </p>
        ) : (
          <>
            {cpu ? <TempRow label="CPU" idle={cpu.idle} gaming={cpu.gaming} /> : null}
            {gpu ? <TempRow label="GPU" idle={gpu.idle} gaming={gpu.gaming} /> : null}

            <div className="flex items-center gap-2 border-t border-line-soft pt-3">
              <Activity size={12} className="text-ink-faint" />
              <span className="text-[11px] text-ink-muted">Índice de refrigeração</span>
              <span className="ml-auto text-[11px] tabular-nums text-ink">
                {temperatures.coolingScore}%
              </span>
            </div>
            <ProgressBar
              value={temperatures.coolingScore}
              tone={temperatures.coolingScore >= 70 ? 'ok' : 'warn'}
            />
            <p className="text-[10px] leading-relaxed text-ink-faint">{ESTIMATE_NOTE}</p>
          </>
        )}
      </div>
    </div>
  );
}

function TempRow({ label, idle, gaming }: { label: string; idle: number; gaming: number }) {
  const tone = gaming >= 90 ? 'text-danger' : gaming >= 80 ? 'text-warn' : 'text-ok';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4 text-right">
        <span className="text-[10px] text-ink-faint">
          Idle <span className="tabular-nums text-ink-muted">~{idle}°C</span>
        </span>
        <span className="text-[10px] text-ink-faint">
          Gaming <span className={cn('tabular-nums font-medium', tone)}>~{gaming}°C</span>
        </span>
      </div>
    </div>
  );
}
