import type { Metadata } from 'next';

import { CompareView } from '@/components/comparison/CompareView';
import { SiteNav } from '@/components/ui/SiteNav';

export const metadata: Metadata = {
  title: 'Compare builds',
  description: 'Compare duas configurações lado a lado.',
};

export default function ComparePage() {
  return (
    <>
      <SiteNav />
      <CompareView />
    </>
  );
}
