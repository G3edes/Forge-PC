'use client';

import {
  Box,
  Boxes,
  Cable,
  GitCompareArrows,
  Hammer,
  Palette,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { PRESET_BUILDS } from '@/data/builds';
import { ALL_COMPONENTS } from '@/data/components';
import { formatDate, formatPrice } from '@/lib/format';
import { idsToSelection } from '@/lib/build-utils';
import { calculateTotal } from '@/lib/calculations';
import { useBuildsStore } from '@/store/builds-store';

import { PresetBuildCard } from './PresetBuildCard';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Compatibilidade automática',
    text: 'Socket, memória, folga da GPU, cooler, fonte e armazenamento verificados a cada mudança.',
  },
  {
    icon: Box,
    title: 'Visualização 3D',
    text: 'Gire, aproxime, selecione peças, abra o gabinete e inspecione a montagem por dentro.',
  },
  {
    icon: Zap,
    title: 'Consumo e térmicas',
    text: 'Estimativa de consumo, fonte recomendada com margem e temperaturas aproximadas.',
  },
  {
    icon: Palette,
    title: 'RGB em tempo real',
    text: 'Cor, intensidade e efeitos (static, breathing, rainbow, pulse) aplicados na cena.',
  },
  {
    icon: Cable,
    title: 'Cabos e X-Ray',
    text: 'Modo raio-x e traçado simplificado dos cabos de alimentação.',
  },
  {
    icon: GitCompareArrows,
    title: 'Comparação objetiva',
    text: 'Compare duas configurações lado a lado, sem eleger uma vencedora.',
  },
];

export function DashboardView() {
  const builds = useBuildsStore((state) => state.builds);
  const loaded = useBuildsStore((state) => state.loaded);
  const refresh = useBuildsStore((state) => state.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line-soft bg-surface/50 px-6 py-12 backdrop-blur sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.34em] text-accent-soft">
            PC BUILDER 3D
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            BUILD FORGE
          </h1>
          <p className="mt-4 text-lg text-ink-muted sm:text-xl">
            Monte. Personalize. Visualize.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-faint">
            Monte seu PC peça por peça, valide a compatibilidade e visualize sua
            configuração em 3D.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/builder">
              <Button size="lg" variant="primary" icon={<Hammer size={15} />}>
                COMEÇAR BUILD
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" variant="outline" icon={<GitCompareArrows size={15} />}>
                Comparar builds
              </Button>
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Boxes size={12} />
            {ALL_COMPONENTS.length} componentes no catálogo de demonstração
          </p>
        </div>
      </section>

      {/* Presets */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-ink">BUILDS PRONTAS</h2>
            <p className="mt-1 text-xs text-ink-faint">
              Pontos de partida que você pode abrir e ajustar.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRESET_BUILDS.map((preset) => (
            <PresetBuildCard key={preset.id} preset={preset} />
          ))}
        </div>
      </section>

      {/* Saved builds */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-ink">BUILDS RECENTES</h2>
            <p className="mt-1 text-xs text-ink-faint">
              Salvas neste navegador (localStorage).
            </p>
          </div>
          <Link
            href="/builds"
            className="focus-ring rounded text-xs text-accent-soft hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {!loaded ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ) : builds.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-line p-8 text-center text-xs text-ink-faint">
            Você ainda não salvou nenhuma build. Abra o builder, monte a sua
            configuração e clique em <span className="text-ink-muted">Salvar</span>.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {builds.slice(0, 6).map((saved) => {
              const total = calculateTotal(idsToSelection(saved.componentIds));
              return (
                <li key={saved.id}>
                  <Link
                    href={`/builds?open=${saved.id}`}
                    className="focus-ring panel block p-4 transition-colors hover:border-line"
                  >
                    <p className="truncate text-sm font-medium text-ink">{saved.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-faint">
                      Atualizada em {formatDate(saved.updatedAt)}
                    </p>
                    <p className="mt-3 text-base font-semibold tabular-nums text-accent-soft">
                      {formatPrice(total)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Features */}
      <section className="mt-14">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-ink">O QUE ESTÁ INCLUÍDO</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="panel p-5">
                <Icon size={16} className="text-accent" />
                <h3 className="mt-3 text-sm font-medium text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-14 border-t border-line-soft pt-6">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Catálogo, preços, índices de desempenho e temperaturas são{' '}
          <strong className="text-ink-muted">dados mock</strong> criados para
          demonstração. Nenhuma informação é obtida de lojas ou APIs externas.
        </p>
      </footer>
    </div>
  );
}
