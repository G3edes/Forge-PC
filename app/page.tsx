import { DashboardView } from '@/components/dashboard/DashboardView';
import { SiteNav } from '@/components/ui/SiteNav';

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <DashboardView />
    </>
  );
}
