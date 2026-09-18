/**
 * Starter configurations shown on the dashboard and on the compare page.
 * These reference ids from the MOCK catalog in `data/components.ts`.
 * Totals are always computed from the catalog, never hardcoded.
 */

import type { BuildComponentIds, RgbSettings } from '@/types/build';

export interface PresetBuild {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  componentIds: BuildComponentIds;
  rgb: RgbSettings;
}

export const PRESET_BUILDS: PresetBuild[] = [
  {
    id: 'preset-gaming',
    name: 'Build Gaming',
    tagline: '1440p de alto refresh',
    description:
      'Foco em FPS: CPU com cache 3D, GPU de gama alta e um gabinete com bom fluxo de ar.',
    accent: '#7c5cff',
    componentIds: {
      cpu: 'cpu-r7-7800x3d',
      gpu: 'gpu-rtx4070s',
      motherboard: 'mb-b650-tomahawk',
      ram: 'ram-ddr5-32-6000-rgb',
      storage: 'ssd-nvme-2tb',
      psu: 'psu-850-gold',
      case: 'case-mid-airflow',
      cooler: 'cooler-aio280',
      fans: [{ id: 'fan-ll120-rgb', quantity: 3 }],
    },
    rgb: { enabled: true, color: '#7c5cff', intensity: 0.85, effect: 'rainbow' },
  },
  {
    id: 'preset-workstation',
    name: 'Build Workstation',
    tagline: 'Renderização e compilação',
    description:
      'Muitos núcleos, 64 GB de memória e armazenamento rápido para cargas de trabalho pesadas.',
    accent: '#22d3ee',
    componentIds: {
      cpu: 'cpu-r9-7950x',
      gpu: 'gpu-rtx4080s',
      motherboard: 'mb-x670e-hero',
      ram: 'ram-ddr5-64-5600-rgb',
      storage: 'ssd-nvme-4tb',
      psu: 'psu-1000-platinum',
      case: 'case-lancool-3',
      cooler: 'cooler-aio360',
      fans: [{ id: 'fan-uni-sl140', quantity: 4 }],
    },
    rgb: { enabled: true, color: '#22d3ee', intensity: 0.6, effect: 'breathing' },
  },
  {
    id: 'preset-budget',
    name: 'Build Econômico',
    tagline: '1080p sem exageros',
    description:
      'Plataforma AM4 madura, boa relação custo-benefício e espaço para upgrades futuros.',
    accent: '#f59e0b',
    componentIds: {
      cpu: 'cpu-r5-5600',
      gpu: 'gpu-rtx4060',
      motherboard: 'mb-b550m-aorus',
      ram: 'ram-ddr4-16-3200',
      storage: 'ssd-nvme-1tb',
      psu: 'psu-550-bronze',
      case: 'case-mat-mini',
      cooler: 'cooler-hyper212',
      fans: [{ id: 'fan-af120', quantity: 2 }],
    },
    rgb: { enabled: false, color: '#f59e0b', intensity: 0.5, effect: 'static' },
  },
];

export function getPresetById(id: string): PresetBuild | undefined {
  return PRESET_BUILDS.find((preset) => preset.id === id);
}
