'use client';

import {
  Copy,
  FolderOpen,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusDot } from '@/components/ui/Status';
import { toast } from '@/components/ui/Toast';
import { idsToSelection } from '@/lib/build-utils';
import { calculateTotal, estimatePower } from '@/lib/calculations';
import { checkCompatibility } from '@/lib/compatibility';
import { cn } from '@/lib/cn';
import { copyToClipboard } from '@/lib/export';
import { formatDate, formatPrice } from '@/lib/format';
import { buildShareUrl, encodeBuild } from '@/lib/share';
import { useBuildStore } from '@/store/build-store';
import { useBuildsStore } from '@/store/builds-store';
import type { SavedBuild } from '@/types/build';

export function BuildsView() {
  const router = useRouter();
  const params = useSearchParams();
  const highlightId = params.get('open');

  const builds = useBuildsStore((state) => state.builds);
  const loaded = useBuildsStore((state) => state.loaded);
  const refresh = useBuildsStore((state) => state.refresh);
  const duplicate = useBuildsStore((state) => state.duplicate);
  const remove = useBuildsStore((state) => state.remove);
  const rename = useBuildsStore((state) => state.rename);

  const loadBuild = useBuildStore((state) => state.loadBuild);

  const [renaming, setRenaming] = useState<SavedBuild | null>(null);
  const [deleting, setDeleting] = useState<SavedBuild | null>(null);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const open = (build: SavedBuild) => {
    loadBuild({
      id: build.id,
      name: build.name,
      componentIds: build.componentIds,
      rgb: build.rgb,
    });
    router.push('/builder');
  };

  const share = async (build: SavedBuild) => {
    const code = encodeBuild({
      name: build.name,
      componentIds: build.componentIds,
      rgb: build.rgb,
    });
    const ok = await copyToClipboard(buildShareUrl(code));
    if (ok) toast.success('Link da build copiado.');
    else toast.error('Não foi possível copiar o link.');
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Minhas builds</h1>
          <p className="mt-1 text-xs text-ink-faint">
            Salvas no localStorage deste navegador. A arquitetura já está pronta
            para um banco de dados.
          </p>
        </div>
        <Link href="/builder">
          <Button variant="primary" icon={<Plus size={14} />}>
            Nova build
          </Button>
        </Link>
      </header>

      {!loaded ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      ) : builds.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line p-12 text-center">
          <FolderOpen className="mx-auto text-ink-faint" size={24} />
          <p className="mt-3 text-sm text-ink">Nenhuma build salva ainda</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-faint">
            Monte uma configuração no builder e clique em Salvar para que ela
            apareça aqui.
          </p>
          <Link href="/builder" className="mt-5 inline-block">
            <Button variant="secondary">Ir para o builder</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => {
            const selection = idsToSelection(build.componentIds);
            const total = calculateTotal(selection);
            const report = checkCompatibility(selection);
            const power = estimatePower(selection);

            return (
              <li key={build.id}>
                <article
                  className={cn(
                    'panel flex h-full flex-col p-5 transition-colors',
                    highlightId === build.id ? 'border-accent/60' : 'hover:border-line',
                  )}
                >
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-medium text-ink">{build.name}</h2>
                      <p className="mt-0.5 text-[10px] text-ink-faint">
                        Atualizada em {formatDate(build.updatedAt)}
                      </p>
                    </div>
                    <StatusDot severity={report.status} className="mt-1.5" />
                  </header>

                  {build.description ? (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                      {build.description}
                    </p>
                  ) : null}

                  <dl className="mt-3 space-y-1 text-[11px] text-ink-muted">
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-faint">CPU</dt>
                      <dd className="truncate">{selection.cpu?.name ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-faint">GPU</dt>
                      <dd className="truncate">{selection.gpu?.name ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-faint">Consumo</dt>
                      <dd>{power.estimatedDraw} W</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {report.errors > 0 ? <Badge tone="danger">{report.errors} erro(s)</Badge> : null}
                    {report.warnings > 0 ? <Badge tone="warn">{report.warnings} aviso(s)</Badge> : null}
                    {report.errors === 0 && report.warnings === 0 ? (
                      <Badge tone="ok">Compatível</Badge>
                    ) : null}
                  </div>

                  <p className="mt-4 text-lg font-semibold tabular-nums text-ink">
                    {formatPrice(total)}
                  </p>

                  <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-line-soft pt-3">
                    <Button size="sm" variant="secondary" onClick={() => open(build)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Copy size={12} />}
                      onClick={() => {
                        duplicate(build.id);
                        toast.success('Build duplicada.');
                      }}
                      aria-label="Duplicar build"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Pencil size={12} />}
                      onClick={() => {
                        setRenaming(build);
                        setDraftName(build.name);
                      }}
                      aria-label="Renomear build"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Share2 size={12} />}
                      onClick={() => share(build)}
                      aria-label="Copiar link de compartilhamento"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={12} />}
                      onClick={() => setDeleting(build)}
                      aria-label="Excluir build"
                      className="ml-auto text-ink-faint hover:text-danger"
                    />
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Renomear build"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (renaming) {
                  rename(renaming.id, draftName.trim() || renaming.name);
                  toast.success('Nome atualizado.');
                }
                setRenaming(null);
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="panel-heading">Nome</span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            className="focus-ring mt-1.5 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink"
          />
        </label>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Excluir build"
        description="Esta ação não pode ser desfeita."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) {
                  remove(deleting.id);
                  toast.success('Build excluída.');
                }
                setDeleting(null);
              }}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Tem certeza que deseja excluir{' '}
          <strong className="text-ink">{deleting?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
