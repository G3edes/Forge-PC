'use client';

import { useEffect, useState } from 'react';

import { Viewer3D, ViewerLoading } from '@/components/three/Viewer3D';
import { useBuildAnalysis } from '@/lib/use-build-analysis';
import { useIsClient } from '@/lib/use-is-client';
import { useBuildStore } from '@/store/build-store';
import type { ComponentCategory } from '@/types/components';

import { AnalysisDock } from './AnalysisDock';
import { BuildSummary } from './BuildSummary';
import { BuilderHeader } from './BuilderHeader';
import { ComponentLibrary } from './ComponentLibrary';
import { ViewerHint, ViewerToolbar } from './ViewerToolbar';

/**
 * Desktop layout: components | 3D | summary, with the analysis dock under the
 * viewport. On small screens everything stacks (viewer → summary → catalog),
 * matching the mobile order in the spec.
 */
export function BuilderWorkspace() {
  const build = useBuildStore((state) => state.build);
  const hydrated = useBuildStore((state) => state.hydrated);
  const name = useBuildStore((state) => state.name);
  const analysis = useBuildAnalysis();

  // The persisted build is read from localStorage, so the first paint has to
  // match the server output — `useIsClient` keeps hydration consistent.
  const isClient = useIsClient();
  const ready = isClient && hydrated;

  const [category, setCategory] = useState<ComponentCategory>('cpu');

  useEffect(() => {
    document.title = `${name} — Build Forge`;
  }, [name]);

  if (!ready) return <BuilderSkeleton />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BuilderHeader report={analysis.report} />

      <div
        className={[
          'grid min-h-0 flex-1 grid-cols-1',
          'lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto]',
          'xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(300px,340px)] xl:grid-rows-1',
        ].join(' ')}
      >
        {/* Catalog */}
        <aside className="order-3 min-h-0 border-t border-line-soft lg:order-1 lg:col-start-1 lg:row-start-1 lg:border-r lg:border-t-0">
          <div className="h-[70vh] lg:h-full">
            <ComponentLibrary category={category} onCategoryChange={setCategory} />
          </div>
        </aside>

        {/* Viewer + analysis dock */}
        <main className="order-1 flex min-h-0 flex-col lg:order-2 lg:col-start-2 lg:row-start-1">
          <div className="relative h-[46vh] min-h-[280px] shrink-0 bg-void lg:h-auto lg:min-h-0 lg:flex-1">
            <ViewerToolbar />
            <Viewer3D build={build} />
            <ViewerHint />
          </div>

          <div className="flex h-[280px] shrink-0 flex-col lg:h-[258px]">
            <AnalysisDock analysis={analysis} />
          </div>
        </main>

        {/* Summary */}
        <aside
          className={[
            'order-2 min-h-0 border-t border-line-soft',
            'lg:order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2',
            'xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:border-l xl:border-t-0',
          ].join(' ')}
        >
          <div className="h-full max-h-[70vh] xl:max-h-none">
            <BuildSummary
              report={analysis.report}
              total={analysis.total}
              onReplace={setCategory}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Shown until the persisted build has been read from localStorage. */
function BuilderSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="h-12 border-b border-line-soft bg-surface/70" />
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="hidden border-r border-line-soft p-3 xl:block">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton mt-3 h-9 rounded-lg" />
          <div className="skeleton mt-3 h-28 rounded-lg" />
          <div className="skeleton mt-3 h-28 rounded-lg" />
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="min-h-[280px] flex-1">
            <ViewerLoading message="Carregando build…" />
          </div>
          <div className="h-[258px] border-t border-line-soft p-3">
            <div className="skeleton h-full rounded-lg" />
          </div>
        </div>
        <div className="hidden border-l border-line-soft p-3 xl:block">
          <div className="skeleton h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
