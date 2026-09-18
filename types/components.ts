/**
 * Domain model for every PC part handled by Build Forge.
 *
 * The catalog shipped with the app is MOCK DATA (see `data/components.ts`).
 * Specifications are modelled per category as discriminated unions so the
 * compatibility engine can reason about them without `any` casts.
 */

export type ComponentCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'fans';

export type CpuSocket = 'AM4' | 'AM5' | 'LGA1700' | 'LGA1851';

export type MemoryType = 'DDR4' | 'DDR5';

export type FormFactor = 'E-ATX' | 'ATX' | 'Micro-ATX' | 'Mini-ITX';

export type StorageInterface = 'M.2 NVMe' | 'SATA';

export type CoolerType = 'air' | 'liquid';

/** Rough 0-100 scores used by the estimated-performance panel. Mock data. */
export interface BenchmarkScores {
  gaming: number;
  productivity: number;
  rendering: number;
}

/** Mock thermal profile, in celsius. */
export interface ThermalProfile {
  idle: number;
  gaming: number;
}

export interface BaseComponent {
  id: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  /** Price in BRL. Mock value — not fetched from any store. */
  price: number;
  image?: string;
  /** Optional GLB/GLTF asset path. When absent the app renders a primitive fallback. */
  model3D?: string;
  specifications: Record<string, unknown>;
}

export interface CpuSpecifications extends Record<string, unknown> {
  socket: CpuSocket;
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  tdp: number;
  integratedGraphics: boolean;
  memorySupport: MemoryType[];
  maxMemorySpeed: number;
  benchmark: BenchmarkScores;
  thermals: ThermalProfile;
}

export interface GpuSpecifications extends Record<string, unknown> {
  vram: number;
  memoryType: string;
  lengthMm: number;
  heightMm: number;
  slots: number;
  tdp: number;
  powerConnectors: number;
  recommendedPsu: number;
  rgb: boolean;
  benchmark: BenchmarkScores;
  thermals: ThermalProfile;
}

export interface MotherboardSpecifications extends Record<string, unknown> {
  socket: CpuSocket;
  chipset: string;
  formFactor: FormFactor;
  memoryType: MemoryType;
  memorySlots: number;
  maxMemory: number;
  maxMemorySpeed: number;
  m2Slots: number;
  sataPorts: number;
  pcieVersion: string;
  fanHeaders: number;
  tdp: number;
  rgb: boolean;
}

export interface RamSpecifications extends Record<string, unknown> {
  memoryType: MemoryType;
  capacity: number;
  modules: number;
  speed: number;
  latency: string;
  heightMm: number;
  rgb: boolean;
  tdp: number;
}

export interface StorageSpecifications extends Record<string, unknown> {
  storageInterface: StorageInterface;
  capacity: number;
  readSpeed: number;
  writeSpeed: number;
  tdp: number;
}

export interface PsuSpecifications extends Record<string, unknown> {
  wattage: number;
  efficiency: string;
  modular: string;
  formFactor: string;
  lengthMm: number;
  pcieConnectors: number;
}

export interface CaseSpecifications extends Record<string, unknown> {
  formFactorSupport: FormFactor[];
  maxGpuLength: number;
  maxCoolerHeight: number;
  maxPsuLength: number;
  maxRadiator: number;
  fanMounts: number;
  includedFans: number;
  sataBays: number;
  sidePanel: 'Vidro temperado' | 'Aço' | 'Acrílico';
  /** Rough airflow quality 0-100 used by the temperature estimator. Mock data. */
  airflowScore: number;
  rgb: boolean;
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface CoolerSpecifications extends Record<string, unknown> {
  coolerType: CoolerType;
  sockets: CpuSocket[];
  heightMm: number;
  radiatorMm: number;
  tdpRating: number;
  ramClearanceMm: number;
  fans: number;
  rgb: boolean;
  tdp: number;
  noiseDb: number;
}

export interface FanSpecifications extends Record<string, unknown> {
  sizeMm: number;
  airflowCfm: number;
  staticPressure: number;
  noiseDb: number;
  rgb: boolean;
  tdp: number;
}

export interface CpuComponent extends BaseComponent {
  category: 'cpu';
  specifications: CpuSpecifications;
}
export interface GpuComponent extends BaseComponent {
  category: 'gpu';
  specifications: GpuSpecifications;
}
export interface MotherboardComponent extends BaseComponent {
  category: 'motherboard';
  specifications: MotherboardSpecifications;
}
export interface RamComponent extends BaseComponent {
  category: 'ram';
  specifications: RamSpecifications;
}
export interface StorageComponent extends BaseComponent {
  category: 'storage';
  specifications: StorageSpecifications;
}
export interface PsuComponent extends BaseComponent {
  category: 'psu';
  specifications: PsuSpecifications;
}
export interface CaseComponent extends BaseComponent {
  category: 'case';
  specifications: CaseSpecifications;
}
export interface CoolerComponent extends BaseComponent {
  category: 'cooler';
  specifications: CoolerSpecifications;
}
export interface FanComponent extends BaseComponent {
  category: 'fans';
  specifications: FanSpecifications;
}

export type PCComponent =
  | CpuComponent
  | GpuComponent
  | MotherboardComponent
  | RamComponent
  | StorageComponent
  | PsuComponent
  | CaseComponent
  | CoolerComponent
  | FanComponent;

/** Maps a category literal to its concrete component type. */
export interface ComponentByCategory {
  cpu: CpuComponent;
  gpu: GpuComponent;
  motherboard: MotherboardComponent;
  ram: RamComponent;
  storage: StorageComponent;
  psu: PsuComponent;
  case: CaseComponent;
  cooler: CoolerComponent;
  fans: FanComponent;
}

export interface CategoryMeta {
  id: ComponentCategory;
  label: string;
  shortLabel: string;
  description: string;
  /** `true` when a build may hold more than one unit of this part. */
  multiple: boolean;
}

export const CATEGORY_ORDER: ComponentCategory[] = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooler',
  'fans',
];

export const CATEGORIES: Record<ComponentCategory, CategoryMeta> = {
  cpu: {
    id: 'cpu',
    label: 'Processador',
    shortLabel: 'CPU',
    description: 'O cérebro da máquina',
    multiple: false,
  },
  gpu: {
    id: 'gpu',
    label: 'Placa de vídeo',
    shortLabel: 'GPU',
    description: 'Renderização e jogos',
    multiple: false,
  },
  motherboard: {
    id: 'motherboard',
    label: 'Placa-mãe',
    shortLabel: 'Motherboard',
    description: 'Conecta todos os componentes',
    multiple: false,
  },
  ram: {
    id: 'ram',
    label: 'Memória RAM',
    shortLabel: 'RAM',
    description: 'Memória de trabalho',
    multiple: false,
  },
  storage: {
    id: 'storage',
    label: 'Armazenamento',
    shortLabel: 'Storage',
    description: 'SSD e HDD',
    multiple: false,
  },
  psu: {
    id: 'psu',
    label: 'Fonte',
    shortLabel: 'PSU',
    description: 'Alimentação do sistema',
    multiple: false,
  },
  case: {
    id: 'case',
    label: 'Gabinete',
    shortLabel: 'Case',
    description: 'Estrutura e fluxo de ar',
    multiple: false,
  },
  cooler: {
    id: 'cooler',
    label: 'Cooler do CPU',
    shortLabel: 'Cooler',
    description: 'Refrigeração do processador',
    multiple: false,
  },
  fans: {
    id: 'fans',
    label: 'Ventoinhas',
    shortLabel: 'Fans',
    description: 'Fluxo de ar do gabinete',
    multiple: true,
  },
};
