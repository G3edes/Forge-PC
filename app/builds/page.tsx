import type { Metadata } from 'next';
import { Suspense } from 'react';

import { BuildsView } from '@/components/builds/BuildsView';
import { SiteNav } from '@/components/ui/SiteNav';

export const metadata: Metadata = {
  title: 'Minhas builds',
  description: 'Salve, edite, duplique e compartilhe suas configurações.',
};

function BuildsFallback() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 md:grid-cols-3 sm:px-6">
      {[0, 1, 2].map((index) => (
        <div key={index} className="skeleton h-44 rounded-xl" />
      ))}
    </div>
  );
}

export default function BuildsPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<BuildsFallback />}>
        <BuildsView />
      </Suspense>
    </>
  );
}
