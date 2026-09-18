import type { Metadata } from 'next';

import { SharedBuildView } from '@/components/builds/SharedBuildView';
import { SiteNav } from '@/components/ui/SiteNav';

export const metadata: Metadata = {
  title: 'Build compartilhada',
  description: 'Visualize uma configuração compartilhada no Build Forge.',
};

export default async function SharedBuildPage({ params }: PageProps<'/build/[code]'>) {
  const { code } = await params;

  return (
    <>
      <SiteNav />
      <SharedBuildView code={code} />
    </>
  );
}
