'use client';

import {
  Box,
  Cable,
  DoorOpen,
  Eye,
  Layers,
  RefreshCw,
  RotateCw,
  ScanLine,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { useViewerStore } from '@/store/viewer-store';

interface ToolButtonProps {
  active?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** Long form shown on wide screens. */
  text?: string;
}

function ToolButton({ active, label, icon, onClick, text }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[10px] font-medium uppercase tracking-wider transition-colors',
        active
          ? 'border-accent/60 bg-accent/15 text-accent-soft'
          : 'border-line bg-surface-2/70 text-ink-muted hover:border-accent/40 hover:text-ink',
      )}
    >
      {icon}
      {text ? <span className="hidden sm:inline">{text}</span> : null}
    </button>
  );
}

/** Floating controls over the 3D viewport. */
export function ViewerToolbar() {
  const {
    xray,
    exploded,
    panelOpen,
    showCables,
    autoRotate,
    hidden,
    toggleXray,
    toggleExploded,
    togglePanel,
    toggleCables,
    toggleAutoRotate,
    showAll,
    resetCamera,
  } = useViewerStore();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3">
      <div className="pointer-events-auto flex flex-wrap gap-1.5">
        <ToolButton
          active={xray}
          label="Modo X-Ray"
          text="X-Ray"
          icon={<ScanLine size={13} />}
          onClick={toggleXray}
        />
        <ToolButton
          active={exploded}
          label="Exploded view"
          text="Exploded"
          icon={<Layers size={13} />}
          onClick={toggleExploded}
        />
        <ToolButton
          active={!panelOpen}
          label={panelOpen ? 'Fechar a lateral do gabinete' : 'Abrir a lateral do gabinete'}
          text={panelOpen ? 'Aberto' : 'Fechado'}
          icon={<DoorOpen size={13} />}
          onClick={togglePanel}
        />
        <ToolButton
          active={showCables}
          label="Mostrar cabos"
          text="Cabos"
          icon={<Cable size={13} />}
          onClick={toggleCables}
        />
      </div>

      <div className="pointer-events-auto flex flex-wrap gap-1.5">
        {hidden.length > 0 ? (
          <ToolButton
            label={`Mostrar ${hidden.length} componente(s) oculto(s)`}
            text={`${hidden.length} oculto`}
            icon={<Eye size={13} />}
            onClick={showAll}
            active
          />
        ) : null}
        <ToolButton
          active={autoRotate}
          label="Rotação automática"
          icon={<RotateCw size={13} />}
          onClick={toggleAutoRotate}
        />
        <ToolButton
          label="Reenquadrar a câmera"
          icon={<RefreshCw size={13} />}
          onClick={resetCamera}
        />
      </div>
    </div>
  );
}

/** Small hint shown at the bottom of the viewport. */
export function ViewerHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
      <p className="flex items-center gap-1.5 rounded-full border border-line-soft bg-void/70 px-3 py-1 text-[10px] text-ink-faint backdrop-blur">
        <Box size={11} />
        Arraste para girar · scroll para zoom · clique em uma peça para ver os detalhes
      </p>
    </div>
  );
}
