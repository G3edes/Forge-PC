/** Conversions between a live `BuildSelection` and the id-only payload we persist. */

import { getComponentByIdAs } from '@/data/components';
import type { BuildComponentIds, BuildSelection } from '@/types/build';

export const EMPTY_BUILD: BuildSelection = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  case: null,
  cooler: null,
  fans: [],
};

export const EMPTY_COMPONENT_IDS: BuildComponentIds = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  case: null,
  cooler: null,
  fans: [],
};

export function selectionToIds(build: BuildSelection): BuildComponentIds {
  return {
    cpu: build.cpu?.id ?? null,
    gpu: build.gpu?.id ?? null,
    motherboard: build.motherboard?.id ?? null,
    ram: build.ram?.id ?? null,
    storage: build.storage?.id ?? null,
    psu: build.psu?.id ?? null,
    case: build.case?.id ?? null,
    cooler: build.cooler?.id ?? null,
    fans: build.fans.map((fan) => ({ id: fan.component.id, quantity: fan.quantity })),
  };
}

/**
 * Rebuilds a selection from ids. Unknown ids are dropped instead of throwing,
 * so a payload saved against an older catalog still loads what it can.
 */
export function idsToSelection(ids: Partial<BuildComponentIds> | null | undefined): BuildSelection {
  if (!ids) return { ...EMPTY_BUILD, fans: [] };

  const fans = Array.isArray(ids.fans) ? ids.fans : [];

  return {
    cpu: getComponentByIdAs('cpu', ids.cpu),
    gpu: getComponentByIdAs('gpu', ids.gpu),
    motherboard: getComponentByIdAs('motherboard', ids.motherboard),
    ram: getComponentByIdAs('ram', ids.ram),
    storage: getComponentByIdAs('storage', ids.storage),
    psu: getComponentByIdAs('psu', ids.psu),
    case: getComponentByIdAs('case', ids.case),
    cooler: getComponentByIdAs('cooler', ids.cooler),
    fans: fans.flatMap((entry) => {
      const component = getComponentByIdAs('fans', entry?.id);
      if (!component) return [];
      const quantity = Number.isFinite(entry.quantity) ? Math.max(1, Math.trunc(entry.quantity)) : 1;
      return [{ component, quantity }];
    }),
  };
}

export function isBuildEmpty(build: BuildSelection): boolean {
  return (
    !build.cpu &&
    !build.gpu &&
    !build.motherboard &&
    !build.ram &&
    !build.storage &&
    !build.psu &&
    !build.case &&
    !build.cooler &&
    build.fans.length === 0
  );
}

export function countSelected(build: BuildSelection): number {
  let count = 0;
  if (build.cpu) count += 1;
  if (build.gpu) count += 1;
  if (build.motherboard) count += 1;
  if (build.ram) count += 1;
  if (build.storage) count += 1;
  if (build.psu) count += 1;
  if (build.case) count += 1;
  if (build.cooler) count += 1;
  if (build.fans.length > 0) count += 1;
  return count;
}
