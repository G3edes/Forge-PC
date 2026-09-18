/**
 * Price, power, performance and thermal estimators.
 *
 * Every figure produced here is an ESTIMATE derived from the mock catalog in
 * `data/components.ts`. The heuristics are deliberately simple and documented
 * so they can be swapped for real benchmark/telemetry data later.
 */

import type {
  BuildSelection,
  PerformanceEstimate,
  PowerBreakdownEntry,
  PowerEstimate,
  TemperatureEstimate,
} from '@/types/build';
import { CATEGORIES, type ComponentCategory } from '@/types/components';

/** Baseline draw of everything not itemised (VRMs, USB devices, fans headers). */
const SYSTEM_OVERHEAD_WATTS = 30;

/** Default headroom applied on top of the estimated draw. */
export const DEFAULT_PSU_MARGIN = 0.3;

/** Retail wattages a recommendation can snap to. */
const COMMON_PSU_WATTAGES = [450, 550, 600, 650, 750, 850, 1000, 1200, 1600];

export function calculateTotal(build: BuildSelection): number {
  let total = 0;
  total += build.cpu?.price ?? 0;
  total += build.gpu?.price ?? 0;
  total += build.motherboard?.price ?? 0;
  total += build.ram?.price ?? 0;
  total += build.storage?.price ?? 0;
  total += build.psu?.price ?? 0;
  total += build.case?.price ?? 0;
  total += build.cooler?.price ?? 0;
  for (const fan of build.fans) {
    total += fan.component.price * fan.quantity;
  }
  return total;
}

/** Per-category subtotal, used by the build summary and the export. */
export function calculateCategoryTotals(
  build: BuildSelection,
): Array<{ category: ComponentCategory; label: string; name: string; total: number }> {
  const rows: Array<{
    category: ComponentCategory;
    label: string;
    name: string;
    total: number;
  }> = [];

  const simple: Array<[ComponentCategory, { name: string; price: number } | null]> = [
    ['cpu', build.cpu],
    ['gpu', build.gpu],
    ['motherboard', build.motherboard],
    ['ram', build.ram],
    ['storage', build.storage],
    ['psu', build.psu],
    ['case', build.case],
    ['cooler', build.cooler],
  ];

  for (const [category, component] of simple) {
    if (!component) continue;
    rows.push({
      category,
      label: CATEGORIES[category].shortLabel,
      name: component.name,
      total: component.price,
    });
  }

  if (build.fans.length > 0) {
    const total = build.fans.reduce(
      (sum, fan) => sum + fan.component.price * fan.quantity,
      0,
    );
    const units = build.fans.reduce((sum, fan) => sum + fan.quantity, 0);
    rows.push({
      category: 'fans',
      label: CATEGORIES.fans.shortLabel,
      name: `${units}x ventoinha${units === 1 ? '' : 's'}`,
      total,
    });
  }

  return rows;
}

/**
 * Sums the TDP of each part plus a fixed system overhead.
 * CPU and GPU are boosted slightly to approximate transient peaks.
 */
export function estimatePower(
  build: BuildSelection,
  margin: number = DEFAULT_PSU_MARGIN,
): PowerEstimate {
  const breakdown: PowerBreakdownEntry[] = [];

  const push = (category: ComponentCategory, watts: number) => {
    if (watts <= 0) return;
    breakdown.push({ category, label: CATEGORIES[category].shortLabel, watts });
  };

  // CPUs pull well above their rated TDP under boost; 1.25x is a common rule of thumb.
  push('cpu', build.cpu ? Math.round(build.cpu.specifications.tdp * 1.25) : 0);
  push('gpu', build.gpu ? Math.round(build.gpu.specifications.tdp * 1.1) : 0);
  push('motherboard', build.motherboard?.specifications.tdp ?? 0);
  push('ram', build.ram?.specifications.tdp ?? 0);
  push('storage', build.storage?.specifications.tdp ?? 0);
  push('cooler', build.cooler?.specifications.tdp ?? 0);

  const fanWatts = build.fans.reduce(
    (sum, fan) => sum + fan.component.specifications.tdp * fan.quantity,
    0,
  );
  push('fans', fanWatts);

  const itemised = breakdown.reduce((sum, entry) => sum + entry.watts, 0);
  const hasAnything = itemised > 0;
  const estimatedDraw = hasAnything ? itemised + SYSTEM_OVERHEAD_WATTS : 0;

  if (hasAnything) {
    breakdown.push({ category: 'motherboard', label: 'Sistema', watts: SYSTEM_OVERHEAD_WATTS });
  }

  const withMargin = estimatedDraw * (1 + margin);
  const recommendedPsu = hasAnything ? snapToCommonWattage(withMargin) : 0;

  const psuWattage = build.psu?.specifications.wattage ?? null;
  const loadPercent =
    psuWattage && psuWattage > 0 ? Math.round((estimatedDraw / psuWattage) * 100) : null;

  return { breakdown, estimatedDraw, margin, recommendedPsu, loadPercent };
}

function snapToCommonWattage(value: number): number {
  for (const wattage of COMMON_PSU_WATTAGES) {
    if (wattage >= value) return wattage;
  }
  return Math.ceil(value / 100) * 100;
}

/**
 * Weighted blend of the mock benchmark scores.
 * Weights reflect how much each part usually drives a given workload.
 */
export function estimatePerformance(build: BuildSelection): PerformanceEstimate {
  const cpu = build.cpu?.specifications.benchmark ?? null;
  const gpu = build.gpu?.specifications.benchmark ?? null;

  const ramScore = scoreRam(build);
  const storageScore = scoreStorage(build);

  const blend = (
    cpuWeight: number,
    gpuWeight: number,
    ramWeight: number,
    storageWeight: number,
    pick: 'gaming' | 'productivity' | 'rendering',
  ): number => {
    let total = 0;
    let weight = 0;
    if (cpu) {
      total += cpu[pick] * cpuWeight;
      weight += cpuWeight;
    }
    if (gpu) {
      total += gpu[pick] * gpuWeight;
      weight += gpuWeight;
    }
    if (ramScore !== null) {
      total += ramScore * ramWeight;
      weight += ramWeight;
    }
    if (storageScore !== null) {
      total += storageScore * storageWeight;
      weight += storageWeight;
    }
    if (weight === 0) return 0;
    return clamp(Math.round(total / weight), 0, 100);
  };

  return {
    gaming: blend(0.25, 0.6, 0.1, 0.05, 'gaming'),
    productivity: blend(0.55, 0.15, 0.2, 0.1, 'productivity'),
    rendering: blend(0.4, 0.45, 0.1, 0.05, 'rendering'),
  };
}

function scoreRam(build: BuildSelection): number | null {
  const ram = build.ram;
  if (!ram) return null;
  const capacityScore = clamp((ram.specifications.capacity / 64) * 100, 20, 100);
  const speedTarget = ram.specifications.memoryType === 'DDR5' ? 6400 : 3600;
  const speedScore = clamp((ram.specifications.speed / speedTarget) * 100, 20, 100);
  return Math.round(capacityScore * 0.6 + speedScore * 0.4);
}

function scoreStorage(build: BuildSelection): number | null {
  const storage = build.storage;
  if (!storage) return null;
  const readScore = clamp((storage.specifications.readSpeed / 7500) * 100, 10, 100);
  const capacityScore = clamp((storage.specifications.capacity / 4000) * 100, 10, 100);
  return Math.round(readScore * 0.7 + capacityScore * 0.3);
}

/**
 * Adjusts each part's mock thermal profile by cooler headroom and case airflow.
 * Returns `null` per device when the relevant part is not selected.
 */
export function estimateTemperatures(build: BuildSelection): TemperatureEstimate {
  const airflow = build.case?.specifications.airflowScore ?? 70;
  const fanUnits = build.fans.reduce((sum, fan) => sum + fan.quantity, 0);
  // Each extra fan past the case defaults shaves a little off both figures.
  const fanBonus = clamp(fanUnits * 1.2, 0, 8);
  const airflowDelta = (75 - airflow) * 0.12;

  let cpu: TemperatureEstimate['cpu'] = null;
  if (build.cpu) {
    const profile = build.cpu.specifications.thermals;
    const cpuTdp = build.cpu.specifications.tdp;
    const coolerRating = build.cooler?.specifications.tdpRating ?? 0;
    // No cooler at all is a hard penalty; an undersized one scales with the gap.
    const coolerDelta = build.cooler
      ? clamp((cpuTdp - coolerRating) * 0.12, -8, 22)
      : 25;
    cpu = {
      idle: Math.round(clamp(profile.idle + coolerDelta * 0.3 + airflowDelta - fanBonus * 0.4, 25, 90)),
      gaming: Math.round(clamp(profile.gaming + coolerDelta + airflowDelta - fanBonus, 35, 105)),
    };
  }

  let gpu: TemperatureEstimate['gpu'] = null;
  if (build.gpu) {
    const profile = build.gpu.specifications.thermals;
    gpu = {
      idle: Math.round(clamp(profile.idle + airflowDelta - fanBonus * 0.3, 25, 90)),
      gaming: Math.round(clamp(profile.gaming + airflowDelta * 1.4 - fanBonus * 0.8, 35, 100)),
    };
  }

  const coolingScore = Math.round(
    clamp(airflow * 0.6 + (build.cooler ? build.cooler.specifications.tdpRating / 4 : 0) + fanBonus * 2, 0, 100),
  );

  return { cpu, gpu, coolingScore };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
