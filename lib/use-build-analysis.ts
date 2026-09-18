'use client';

import { useMemo } from 'react';

import { useBuildStore } from '@/store/build-store';
import type {
  CompatibilityReport,
  PerformanceEstimate,
  PowerEstimate,
  TemperatureEstimate,
} from '@/types/build';

import {
  calculateCategoryTotals,
  calculateTotal,
  estimatePerformance,
  estimatePower,
  estimateTemperatures,
} from './calculations';
import { checkCompatibility } from './compatibility';

export interface BuildAnalysis {
  report: CompatibilityReport;
  power: PowerEstimate;
  performance: PerformanceEstimate;
  temperatures: TemperatureEstimate;
  total: number;
  rows: ReturnType<typeof calculateCategoryTotals>;
}

/** Recomputes every derived figure whenever the selection changes. */
export function useBuildAnalysis(): BuildAnalysis {
  const build = useBuildStore((state) => state.build);
  const psuMargin = useBuildStore((state) => state.psuMargin);

  return useMemo(
    () => ({
      report: checkCompatibility(build, psuMargin),
      power: estimatePower(build, psuMargin),
      performance: estimatePerformance(build),
      temperatures: estimateTemperatures(build),
      total: calculateTotal(build),
      rows: calculateCategoryTotals(build),
    }),
    [build, psuMargin],
  );
}
