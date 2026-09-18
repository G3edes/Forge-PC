'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useBuildStore } from '@/store/build-store';
import { useBuildsStore } from '@/store/builds-store';

/**
 * Mounted only while open (see `BuilderHeader`), so the draft fields are
 * initialised from the store on every open without an effect.
 */
export function SaveBuildModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const name = useBuildStore((state) => state.name);
  const currentBuildId = useBuildStore((state) => state.currentBuildId);
  const rgb = useBuildStore((state) => state.rgb);
  const getComponentIds = useBuildStore((state) => state.getComponentIds);
  const setName = useBuildStore((state) => state.setName);
  const save = useBuildsStore((state) => state.save);

  const [draftName, setDraftName] = useState(name);
  const [description, setDescription] = useState('');
  const [asNew, setAsNew] = useState(false);

  const handleSave = () => {
    const finalName = draftName.trim() || 'Build sem nome';
    const saved = save({
      id: asNew ? null : currentBuildId,
      name: finalName,
      description: description.trim() || undefined,
      componentIds: getComponentIds(),
      rgb,
    });
    setName(finalName);
    useBuildStore.setState({ currentBuildId: saved.id });
    toast.success(`Build "${finalName}" salva no navegador.`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salvar build"
      description="As builds ficam guardadas no localStorage deste navegador."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="panel-heading">Nome</span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Minha build gamer"
            className="focus-ring mt-1.5 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </label>

        <label className="block">
          <span className="panel-heading">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Para que essa configuração foi pensada…"
            className="focus-ring mt-1.5 w-full resize-none rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          />
        </label>

        {currentBuildId ? (
          <label className="flex items-start gap-2 rounded-lg border border-line-soft bg-surface-2/50 p-3">
            <input
              type="checkbox"
              checked={asNew}
              onChange={(event) => setAsNew(event.target.checked)}
              className="mt-0.5 accent-[var(--color-accent)]"
            />
            <span className="text-xs leading-relaxed text-ink-muted">
              Salvar como uma nova build em vez de atualizar a build aberta.
            </span>
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
