'use client';

import { EyeOff, MousePointerClick, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatPrice, toSpecRows } from '@/lib/format';
import { useBuildStore } from '@/store/build-store';
import { useViewerStore } from '@/store/viewer-store';
import { CATEGORIES, type ComponentCategory, type PCComponent } from '@/types/components';

/**
 * Side panel that opens when a part is clicked in the 3D scene.
 * Falls back to a hint when nothing is selected.
 */
export function SelectedPartPanel() {
  const selected = useViewerStore((state) => state.selected);
  const select = useViewerStore((state) => state.select);
  const toggleHidden = useViewerStore((state) => state.toggleHidden);
  const build = useBuildStore((state) => state.build);

  if (!selected) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-[11px] text-ink-faint">
        <MousePointerClick size={13} />
        Clique em uma peça no visualizador 3D para ver os detalhes dela aqui.
      </div>
    );
  }

  if (selected === 'case') {
    const pcCase = build.case;
    return (
      <PartDetails
        title="Gabinete"
        component={pcCase}
        emptyMessage="Nenhum gabinete selecionado — o visualizador está mostrando um chassi padrão."
        onClose={() => select(null)}
        onHide={pcCase ? () => toggleHidden('case') : undefined}
      />
    );
  }

  const category = selected as ComponentCategory;

  if (category === 'fans') {
    const fans = build.fans;
    return (
      <div className="animate-fade-in">
        <Header title={CATEGORIES.fans.label} onClose={() => select(null)} />
        <div className="space-y-3 px-4 pb-4">
          {fans.length === 0 ? (
            <p className="text-xs text-ink-faint">Nenhuma ventoinha selecionada.</p>
          ) : (
            fans.map((fan) => (
              <div key={fan.component.id} className="rounded-lg border border-line-soft p-3">
                <p className="text-sm text-ink">{fan.component.name}</p>
                <p className="text-[10px] text-ink-faint">
                  {fan.component.brand} · {fan.quantity} unidades ·{' '}
                  {formatPrice(fan.component.price * fan.quantity)}
                </p>
                <SpecGrid component={fan.component} />
              </div>
            ))
          )}
          <Button size="sm" variant="ghost" icon={<EyeOff size={12} />} onClick={() => toggleHidden('fans')}>
            Ocultar no 3D
          </Button>
        </div>
      </div>
    );
  }

  const component = build[category] as PCComponent | null;

  return (
    <PartDetails
      title={CATEGORIES[category].label}
      component={component}
      emptyMessage={`Nenhum componente selecionado nesta categoria.`}
      onClose={() => select(null)}
      onHide={component ? () => toggleHidden(category) : undefined}
    />
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
      <h2 className="panel-heading">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar detalhes"
        className="focus-ring rounded p-1 text-ink-faint hover:text-ink"
      >
        <X size={13} />
      </button>
    </header>
  );
}

function PartDetails({
  title,
  component,
  emptyMessage,
  onClose,
  onHide,
}: {
  title: string;
  component: PCComponent | null;
  emptyMessage: string;
  onClose: () => void;
  onHide?: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <Header title={title} onClose={onClose} />
      <div className="px-4 pb-4">
        {!component ? (
          <p className="pt-3 text-xs leading-relaxed text-ink-faint">{emptyMessage}</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 pt-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                  {component.brand}
                </p>
                <p className="text-sm font-medium text-ink">{component.name}</p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-accent-soft">
                {formatPrice(component.price)}
              </span>
            </div>

            <SpecGrid component={component} />

            {onHide ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<EyeOff size={12} />}
                onClick={onHide}
                className="mt-3"
              >
                Ocultar no 3D
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function SpecGrid({ component }: { component: PCComponent }) {
  const rows = toSpecRows(component.specifications);
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
      {rows.map((spec) => (
        <div key={spec.key} className="min-w-0 rounded-md border border-line-soft bg-surface-2/40 px-2 py-1.5">
          <dt className="truncate text-[9px] uppercase tracking-wide text-ink-faint">
            {spec.label}
          </dt>
          <dd className="truncate text-[11px] text-ink">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
