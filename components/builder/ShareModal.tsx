'use client';

import { Copy, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { copyToClipboard } from '@/lib/export';
import { buildShareUrl, encodeBuild } from '@/lib/share';
import { useBuildStore } from '@/store/build-store';

/**
 * The whole configuration is encoded into the URL, so the link works on any
 * device without a backend. A short-id service can replace `encodeBuild` later.
 */
export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const name = useBuildStore((state) => state.name);
  const rgb = useBuildStore((state) => state.rgb);
  const getComponentIds = useBuildStore((state) => state.getComponentIds);

  // The modal is mounted only while open, so this runs once per opening.
  const url = useMemo(
    () => buildShareUrl(encodeBuild({ name, componentIds: getComponentIds(), rgb })),
    [name, rgb, getComponentIds],
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) toast.success('Link copiado para a área de transferência.');
    else toast.error('Não foi possível copiar. Selecione o link manualmente.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartilhar build"
      description="O link carrega toda a configuração — nada é enviado para um servidor."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" icon={<Copy size={13} />} onClick={handleCopy}>
            Copiar link
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="panel-heading">Link da configuração</span>
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="focus-ring mt-1.5 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 font-mono text-[11px] text-ink-muted"
          />
        </label>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-md text-[11px] text-accent-soft hover:underline"
          >
            <ExternalLink size={12} />
            Abrir a página da build em uma nova aba
          </a>
        ) : null}

        <p className="text-[10px] leading-relaxed text-ink-faint">
          A configuração é codificada dentro do próprio endereço. Quando houver um
          backend, basta trocar a geração do código por um identificador curto —
          a rota <code className="font-mono">/build/[code]</code> já aceita os dois formatos.
        </p>
      </div>
    </Modal>
  );
}
