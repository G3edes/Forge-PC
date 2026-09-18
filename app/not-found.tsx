import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-accent-soft">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">Página não encontrada</h1>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        O endereço acessado não existe no Build Forge.
      </p>
      <Link
        href="/"
        className="focus-ring mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
