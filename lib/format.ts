/** Display helpers shared by every panel. */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return BRL.format(value);
}

export function formatCapacity(gigabytes: number): string {
  if (gigabytes >= 1000) {
    const terabytes = gigabytes / 1000;
    return `${Number.isInteger(terabytes) ? terabytes : terabytes.toFixed(1)} TB`;
  }
  return `${gigabytes} GB`;
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Human labels for raw specification keys. */
const SPEC_LABELS: Record<string, string> = {
  socket: 'Socket',
  cores: 'Núcleos',
  threads: 'Threads',
  baseClock: 'Clock base',
  boostClock: 'Clock boost',
  tdp: 'TDP',
  integratedGraphics: 'Gráficos integrados',
  memorySupport: 'Memória suportada',
  maxMemorySpeed: 'Freq. máx. de memória',
  vram: 'VRAM',
  memoryType: 'Tipo de memória',
  lengthMm: 'Comprimento',
  heightMm: 'Altura',
  slots: 'Slots ocupados',
  powerConnectors: 'Conectores PCIe',
  recommendedPsu: 'Fonte recomendada',
  rgb: 'RGB',
  chipset: 'Chipset',
  formFactor: 'Formato',
  memorySlots: 'Slots de memória',
  maxMemory: 'Memória máxima',
  m2Slots: 'Slots M.2',
  sataPorts: 'Portas SATA',
  pcieVersion: 'PCIe',
  fanHeaders: 'Headers de fan',
  capacity: 'Capacidade',
  modules: 'Módulos',
  speed: 'Frequência',
  latency: 'Latência',
  storageInterface: 'Interface',
  readSpeed: 'Leitura',
  writeSpeed: 'Escrita',
  wattage: 'Potência',
  efficiency: 'Eficiência',
  modular: 'Modularidade',
  pcieConnectors: 'Conectores PCIe',
  formFactorSupport: 'Formatos suportados',
  maxGpuLength: 'GPU máxima',
  maxCoolerHeight: 'Cooler máximo',
  maxPsuLength: 'Fonte máxima',
  maxRadiator: 'Radiador máximo',
  fanMounts: 'Posições de fan',
  includedFans: 'Fans inclusas',
  sataBays: 'Baias 2.5"',
  sidePanel: 'Lateral',
  airflowScore: 'Índice de airflow',
  widthMm: 'Largura',
  depthMm: 'Profundidade',
  coolerType: 'Tipo',
  sockets: 'Sockets',
  radiatorMm: 'Radiador',
  tdpRating: 'Dissipação',
  ramClearanceMm: 'Folga para RAM',
  fans: 'Ventoinhas',
  noiseDb: 'Ruído',
  sizeMm: 'Tamanho',
  airflowCfm: 'Fluxo de ar',
  staticPressure: 'Pressão estática',
  benchmark: 'Índices estimados',
  thermals: 'Temperaturas estimadas',
};

/** Suffix appended to numeric specs. */
const SPEC_UNITS: Record<string, string> = {
  baseClock: ' GHz',
  boostClock: ' GHz',
  tdp: ' W',
  maxMemorySpeed: ' MHz',
  vram: ' GB',
  lengthMm: ' mm',
  heightMm: ' mm',
  widthMm: ' mm',
  depthMm: ' mm',
  recommendedPsu: ' W',
  maxMemory: ' GB',
  speed: ' MHz',
  readSpeed: ' MB/s',
  writeSpeed: ' MB/s',
  wattage: ' W',
  maxGpuLength: ' mm',
  maxCoolerHeight: ' mm',
  maxPsuLength: ' mm',
  maxRadiator: ' mm',
  radiatorMm: ' mm',
  tdpRating: ' W',
  ramClearanceMm: ' mm',
  noiseDb: ' dB',
  sizeMm: ' mm',
  airflowCfm: ' CFM',
  staticPressure: ' mmH2O',
};

/** Keys hidden from the generic specification list (rendered by dedicated UI). */
const HIDDEN_SPECS = new Set(['benchmark', 'thermals', 'airflowScore']);

export function formatSpecLabel(key: string): string {
  return SPEC_LABELS[key] ?? key;
}

export function formatSpecValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') {
    if (key === 'capacity') return formatCapacity(value);
    if (key === 'ramClearanceMm' && value >= 900) return 'Sem restrição';
    if (key === 'radiatorMm' && value === 0) return 'N/A';
    const unit = SPEC_UNITS[key] ?? '';
    return `${value.toLocaleString('pt-BR')}${unit}`;
  }
  if (typeof value === 'string') {
    if (key === 'coolerType') return value === 'air' ? 'Ar' : 'Water cooler';
    return value;
  }
  return String(value);
}

/** Turns a raw specifications object into label/value rows ready for display. */
export function toSpecRows(
  specifications: Record<string, unknown>,
): Array<{ key: string; label: string; value: string }> {
  return Object.entries(specifications)
    .filter(([key]) => !HIDDEN_SPECS.has(key))
    .map(([key, value]) => ({
      key,
      label: formatSpecLabel(key),
      value: formatSpecValue(key, value),
    }));
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
