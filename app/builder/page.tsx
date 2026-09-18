import type { Metadata } from 'next';

import { BuilderWorkspace } from '@/components/builder/BuilderWorkspace';
import { SiteNav } from '@/components/ui/SiteNav';

export const metadata: Metadata = {
  title: 'Builder',
  description: 'Monte seu PC peça por peça e visualize a montagem em 3D.',
};

/**
 * From `lg` up the builder is an app-shell screen: it fills the viewport
 * exactly and each column scrolls on its own, so the 3D canvas always has a
 * bounded height. On small screens the sections stack and the page scrolls.
 */
export default function BuilderPage() {
  return (
    <div className="flex flex-1 flex-col lg:h-[100dvh] lg:flex-none lg:overflow-hidden">
      <SiteNav />
      <div className="flex min-h-0 flex-1 flex-col">
        <BuilderWorkspace />
      </div>
    </div>
  );
}
