'use client';

import { Palette } from 'lucide-react';

import { PanelHeader } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { useBuildStore } from '@/store/build-store';
import type { RgbEffect } from '@/types/build';

const EFFECTS: Array<{ id: RgbEffect; label: string }> = [
  { id: 'static', label: 'Static' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'pulse', label: 'Pulse' },
];

const PRESET_COLORS = ['#7c5cff', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#ffffff'];

/** RGB controls — drives the emissive materials on RAM, fans, GPU and case. */
export function RgbPanel() {
  const rgb = useBuildStore((state) => state.rgb);
  const setRgb = useBuildStore((state) => state.setRgb);

  return (
    <div>
      <PanelHeader
        title="Iluminação RGB"
        icon={<Palette size={13} />}
        action={
          <button
            type="button"
            role="switch"
            aria-checked={rgb.enabled}
            aria-label="Ligar ou desligar o RGB"
            onClick={() => setRgb({ enabled: !rgb.enabled })}
            className={cn(
              'focus-ring relative h-5 w-9 rounded-full transition-colors',
              rgb.enabled ? 'bg-accent' : 'bg-surface-3',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
                rgb.enabled ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </button>
        }
      />

      <div
        className={cn(
          'space-y-4 p-4 transition-opacity',
          !rgb.enabled && 'pointer-events-none opacity-40',
        )}
      >
        <div>
          <p className="panel-heading mb-2">Cor</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={rgb.color}
              onChange={(event) => setRgb({ color: event.target.value })}
              aria-label="Cor do RGB"
              className="size-8 rounded-lg"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setRgb({ color })}
                  aria-label={`Usar a cor ${color}`}
                  style={{ backgroundColor: color }}
                  className={cn(
                    'focus-ring size-6 rounded-md border transition-transform hover:scale-110',
                    rgb.color.toLowerCase() === color.toLowerCase()
                      ? 'border-ink'
                      : 'border-line',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="panel-heading">Intensidade</span>
            <span className="text-[11px] tabular-nums text-ink-muted">
              {Math.round(rgb.intensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={rgb.intensity}
            onChange={(event) => setRgb({ intensity: Number(event.target.value) })}
            aria-label="Intensidade do RGB"
            className="w-full"
          />
        </div>

        <div>
          <p className="panel-heading mb-2">Efeito</p>
          <div className="grid grid-cols-2 gap-1.5">
            {EFFECTS.map((effect) => (
              <button
                key={effect.id}
                type="button"
                onClick={() => setRgb({ effect: effect.id })}
                className={cn(
                  'focus-ring rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                  rgb.effect === effect.id
                    ? 'border-accent/60 bg-accent/10 text-ink'
                    : 'border-line text-ink-muted hover:border-accent/40 hover:text-ink',
                )}
              >
                {effect.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-ink-faint">
          A iluminação afeta memória, ventoinhas, GPU e o gabinete — apenas nos
          componentes cuja ficha técnica indica suporte a RGB.
        </p>
      </div>
    </div>
  );
}
