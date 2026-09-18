import type {
  CaseComponent,
  ComponentCategory,
  CoolerComponent,
  CpuComponent,
  FanComponent,
  GpuComponent,
  MotherboardComponent,
  PsuComponent,
  RamComponent,
  StorageComponent,
} from './components';

/** A fan model plus how many units the build uses. */
export interface FanSelection {
  component: FanComponent;
  quantity: number;
}

/** The parts currently selected. `null` means the slot is empty. */
export interface BuildSelection {
  cpu: CpuComponent | null;
  gpu: GpuComponent | null;
  motherboard: MotherboardComponent | null;
  ram: RamComponent | null;
  storage: StorageComponent | null;
  psu: PsuComponent | null;
  case: CaseComponent | null;
  cooler: CoolerComponent | null;
  fans: FanSelection[];
}

export type CompatibilitySeverity = 'ok' | 'warning' | 'error';

export interface CompatibilityIssue {
  id: string;
  severity: CompatibilitySeverity;
  /** Short line rendered in the status list. */
  title: string;
  /** Long explanation revealed when the user opens the issue. */
  detail: string;
  /** Categories involved, used to highlight the relevant slots. */
  categories: ComponentCategory[];
}

export interface CompatibilityReport {
  issues: CompatibilityIssue[];
  status: CompatibilitySeverity;
  errors: number;
  warnings: number;
  passed: number;
  /** Categories still empty in the build. */
  missing: ComponentCategory[];
}

export interface PowerBreakdownEntry {
  category: ComponentCategory;
  label: string;
  watts: number;
}

export interface PowerEstimate {
  breakdown: PowerBreakdownEntry[];
  /** Sum of every component draw, before the safety margin. */
  estimatedDraw: number;
  /** Safety margin applied, as a ratio (0.3 === 30%). */
  margin: number;
  /** Recommended PSU wattage, rounded up to a common retail size. */
  recommendedPsu: number;
  /** Load percentage against the selected PSU, or `null` when no PSU is set. */
  loadPercent: number | null;
}

export interface PerformanceEstimate {
  gaming: number;
  productivity: number;
  rendering: number;
}

export interface TemperatureEstimate {
  cpu: { idle: number; gaming: number } | null;
  gpu: { idle: number; gaming: number } | null;
  /** 0-100 quality of the case/cooler combination. Mock heuristic. */
  coolingScore: number;
}

export type RgbEffect = 'static' | 'breathing' | 'rainbow' | 'pulse';

export interface RgbSettings {
  enabled: boolean;
  color: string;
  intensity: number;
  effect: RgbEffect;
}

/** A build persisted by the user (localStorage today, database later). */
export interface SavedBuild {
  id: string;
  name: string;
  description?: string;
  /** Component ids per slot — keeps saved payloads small and catalog-agnostic. */
  componentIds: BuildComponentIds;
  rgb: RgbSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BuildComponentIds {
  cpu: string | null;
  gpu: string | null;
  motherboard: string | null;
  ram: string | null;
  storage: string | null;
  psu: string | null;
  case: string | null;
  cooler: string | null;
  fans: Array<{ id: string; quantity: number }>;
}

/** Shape of the JSON produced by "Exportar JSON". */
export interface BuildExport {
  application: string;
  version: number;
  exportedAt: string;
  name: string;
  components: Array<{
    category: ComponentCategory;
    id: string;
    name: string;
    brand: string;
    quantity: number;
    price: number;
    specifications: Record<string, unknown>;
  }>;
  totals: {
    price: number;
    estimatedPowerDraw: number;
    recommendedPsu: number;
  };
  compatibility: {
    status: CompatibilitySeverity;
    issues: Array<{ severity: CompatibilitySeverity; title: string; detail: string }>;
  };
  disclaimer: string;
}
