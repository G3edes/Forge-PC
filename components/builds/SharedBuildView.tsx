'use client';

import { Hammer, Link2Off, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { PowerPanel, PerformancePanel } from '@/components/builder/AnalysisPanels';
import { CompatibilityPanel } from '@/components/builder/CompatibilityPanel';
import { Viewer3D, ViewerLoading } from '@/components/three/Viewer3D';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { idsToSelection } from '@/lib/build-utils';
import {
  calculateCategoryTotals,
  calculateTotal,
  estimatePerformance,
  estimatePower,
} from '@/lib/calculations';
import { checkCompatibility } from '@/lib/compatibility';
import { useIsClient } from '@/lib/use-is-client';
import { formatPrice } from '@/lib/format';
import { DEFAULT_RGB, decodeBuild, type SharePayload } from '@/lib/share';
import { localBuildRepository } from '@/lib/storage';
import { useBuildStore } from '@/store/build-store';
import { useBuildsStore } from '@/store/builds-store';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; payload: SharePayload }
  | { status: 'missing' };

/**
 * Resolves a share code. Self-contained codes decode anywhere; a code that is
 * instead a saved-build id only resolves in the browser that stored it.
 * A backend lookup would slot in right here.
 */
function resolveCode(code: string, isClient: boolean): LoadState {
  const decoded = decodeBuild(code);
  if (decoded) return { status: 'ready', payload: decoded };

  if (!isClient) return { status: 'loading' };

  const local = localBuildRepository.get(code);
  if (local) {
    return {
      status: 'ready',
      payload: {
        name: local.name,
        componentIds: local.componentIds,
        rgb: local.rgb ?? DEFAULT_RGB,
      },
    };
  }

  return { status: 'missing' };
}

/**
 * Renders a build received through `/build/<code>`.
 *
 * The code is normally a self-contained payload (works across devices). As a
 * fallback it is also looked up in the local repository, which is the seam a
 * backend short-id lookup would plug into.
 */
export function SharedBuildView({ code }: { code: string }) {
  const router = useRouter();
  const loadBuild = useBuildStore((state) => state.loadBuild);
  const save = useBuildsStore((state) => state.save);

  const isClient = useIsClient();
  const state = useMemo(() => resolveCode(code, isClient), [code, isClient]);

  const analysis = useMemo(() => {
    if (state.status !== 'ready') return null;
    const selection = idsToSelection(state.payload.componentIds);
    return {
      selection,
      rows: calculateCategoryTotals(selection),
      total: calculateTotal(selection),
      report: checkCompatibility(selection),
      power: estimatePower(selection),
      performance: estimatePerformance(selection),
    };
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  if (state.status === 'missing') {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:px-6">
        <Link2Off className="mx-auto text-ink-faint" size={26} />
        <h1 className="mt-4 text-lg font-semibold text-ink">Build não encontrada</h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Este link não pôde ser decodificado. Ele pode ter sido truncado ao ser
          copiado, ou aponta para uma build salva em outro navegador.
        </p>
        <Link href="/builder" className="mt-6 inline-block">
          <Button variant="primary" icon={<Hammer size={14} />}>
            Montar uma build
          </Button>
        </Link>
      </div>
    );
  }

  const { payload } = state;
  if (!analysis) return null;

  const openInBuilder = () => {
    loadBuild({
      id: null,
      name: payload.name,
      componentIds: payload.componentIds,
      rgb: payload.rgb,
    });
    router.push('/builder');
  };

  const saveLocally = () => {
    save({
      name: payload.name,
      componentIds: payload.componentIds,
      rgb: payload.rgb,
    });
    toast.success('Build salva no seu navegador.');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent-soft">
            Build compartilhada
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{payload.name}</h1>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink-muted">
            {formatPrice(analysis.total)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Save size={14} />} onClick={saveLocally}>
            Salvar cópia
          </Button>
          <Button variant="primary" icon={<Hammer size={14} />} onClick={openInBuilder}>
            Abrir no builder
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel relative h-[420px] overflow-hidden">
          <SharedViewer selection={analysis.selection} />
        </div>

        <div className="panel divide-y divide-line-soft">
          <div className="p-4">
            <p className="panel-heading mb-2">Componentes</p>
            <ul className="space-y-1.5">
              {analysis.rows.length === 0 ? (
                <li className="text-xs text-ink-faint">Nenhum componente nesta build.</li>
              ) : (
                analysis.rows.map((row) => (
                  <li key={row.category} className="flex items-baseline justify-between gap-3">
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">
                      {row.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-[11px] text-ink">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-muted">
                      {formatPrice(row.total)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-line-soft pt-3">
              <span className="panel-heading">Total</span>
              <span className="text-base font-semibold tabular-nums text-ink">
                {formatPrice(analysis.total)}
              </span>
            </div>
          </div>
          <PowerPanel power={analysis.power} />
          <PerformancePanel performance={analysis.performance} />
        </div>
      </div>

      <div className="panel mt-4 max-h-96 overflow-hidden">
        <CompatibilityPanel report={analysis.report} />
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-faint">
        Valores e índices calculados a partir de um catálogo de demonstração
        (dados mock).
      </p>
    </div>
  );
}

function SharedViewer({ selection }: { selection: ReturnType<typeof idsToSelection> }) {
  const isClient = useIsClient();
  if (!isClient) return <ViewerLoading />;
  return <Viewer3D build={selection} />;
}
