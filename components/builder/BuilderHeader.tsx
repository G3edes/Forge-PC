'use client';

import {
  ClipboardCopy,
  Download,
  FileJson,
  FileText,
  Layers3,
  Save,
  Share2,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
  buildExportPayload,
  buildTextSummary,
  copyToClipboard,
  downloadJson,
  exportBuildToPdf,
} from '@/lib/export';
import { useBuildStore } from '@/store/build-store';
import type { CompatibilityReport } from '@/types/build';

import { SaveBuildModal } from './SaveBuildModal';
import { ShareModal } from './ShareModal';

export function BuilderHeader({ report }: { report: CompatibilityReport }) {
  const name = useBuildStore((state) => state.name);
  const setName = useBuildStore((state) => state.setName);
  const clearBuild = useBuildStore((state) => state.clearBuild);
  const build = useBuildStore((state) => state.build);

  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [exportOpen]);

  const handleJson = () => {
    downloadJson(buildExportPayload(build, report, name), name);
    toast.success('Arquivo JSON gerado.');
    setExportOpen(false);
  };

  const handlePdf = () => {
    const ok = exportBuildToPdf(build, report, name);
    if (ok) toast.info('Escolha "Salvar como PDF" na janela de impressão.');
    else toast.error('O navegador bloqueou a janela de impressão. Libere pop-ups e tente de novo.');
    setExportOpen(false);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildTextSummary(build, name));
    if (ok) toast.success('Configuração copiada.');
    else toast.error('Não foi possível copiar a configuração.');
    setExportOpen(false);
  };

  const handleClear = () => {
    clearBuild();
    toast.info('Build limpa.');
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-2 border-b border-line-soft bg-surface/70 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Layers3 size={16} className="shrink-0 text-accent" />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Nome da build"
            className="focus-ring min-w-0 flex-1 truncate rounded-md bg-transparent px-1 py-1 text-sm font-medium text-ink outline-none hover:bg-surface-2"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 size={13} />}
            onClick={handleClear}
            className="hidden text-ink-faint hover:text-danger sm:inline-flex"
          >
            Limpar
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={<Share2 size={13} />}
            onClick={() => setShareOpen(true)}
          >
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>

          <div className="relative" ref={exportRef}>
            <Button
              size="sm"
              variant="secondary"
              icon={<Download size={13} />}
              onClick={() => setExportOpen((value) => !value)}
              aria-expanded={exportOpen}
            >
              <span className="hidden sm:inline">Exportar</span>
            </Button>

            {exportOpen ? (
              <div
                className={cn(
                  'animate-fade-in absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-lg',
                  'border border-line bg-surface shadow-2xl',
                )}
              >
                <ExportItem icon={<FileText size={13} />} label="Exportar PDF" onClick={handlePdf} />
                <ExportItem icon={<FileJson size={13} />} label="Exportar JSON" onClick={handleJson} />
                <ExportItem
                  icon={<ClipboardCopy size={13} />}
                  label="Copiar configuração"
                  onClick={handleCopy}
                />
              </div>
            ) : null}
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<Save size={13} />}
            onClick={() => setSaveOpen(true)}
          >
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </div>
      </header>

      {/* Mounted only while open so their drafts always start fresh. */}
      {saveOpen ? <SaveBuildModal open onClose={() => setSaveOpen(false)} /> : null}
      {shareOpen ? <ShareModal open onClose={() => setShareOpen(false)} /> : null}
    </>
  );
}

function ExportItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {icon}
      {label}
    </button>
  );
}
