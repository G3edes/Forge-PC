/**
 * Compatibility engine.
 *
 * Every rule is a pure function of the current selection, so the report can be
 * recomputed on each render without side effects. Rules only fire when all the
 * parts they need are present — an incomplete build reports "missing" slots
 * instead of false negatives.
 */

import type {
  BuildSelection,
  CompatibilityIssue,
  CompatibilityReport,
  CompatibilitySeverity,
} from '@/types/build';
import { CATEGORY_ORDER, type ComponentCategory } from '@/types/components';
import { DEFAULT_PSU_MARGIN, estimatePower } from './calculations';

/** Slots that must be filled before a build is considered complete. */
const REQUIRED_CATEGORIES: ComponentCategory[] = [
  'cpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooler',
];

export function checkCompatibility(
  build: BuildSelection,
  psuMargin: number = DEFAULT_PSU_MARGIN,
): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];

  checkCpuMotherboard(build, issues);
  checkMemory(build, issues);
  checkGpuCase(build, issues);
  checkMotherboardCase(build, issues);
  checkCooler(build, issues);
  checkStorage(build, issues);
  checkPsu(build, issues, psuMargin);
  checkFans(build, issues);
  checkGraphicsOutput(build, issues);

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  const passed = issues.filter((issue) => issue.severity === 'ok').length;

  const missing = CATEGORY_ORDER.filter((category) => {
    if (!REQUIRED_CATEGORIES.includes(category)) return false;
    if (category === 'fans') return build.fans.length === 0;
    return build[category] === null;
  });

  let status: CompatibilitySeverity = 'ok';
  if (errors > 0) status = 'error';
  else if (warnings > 0) status = 'warning';

  return { issues, status, errors, warnings, passed, missing };
}

function checkCpuMotherboard(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { cpu, motherboard } = build;
  if (!cpu || !motherboard) return;

  const cpuSocket = cpu.specifications.socket;
  const mbSocket = motherboard.specifications.socket;

  if (cpuSocket === mbSocket) {
    issues.push({
      id: 'cpu-socket',
      severity: 'ok',
      title: 'CPU compatível com a placa-mãe',
      detail: `${cpu.name} e ${motherboard.name} usam o mesmo socket ${cpuSocket}.`,
      categories: ['cpu', 'motherboard'],
    });
    return;
  }

  issues.push({
    id: 'cpu-socket',
    severity: 'error',
    title: 'Socket da CPU incompatível',
    detail: `${cpu.name} usa socket ${cpuSocket}, mas ${motherboard.name} oferece socket ${mbSocket}. Troque a CPU ou a placa-mãe para que os dois usem o mesmo socket.`,
    categories: ['cpu', 'motherboard'],
  });
}

function checkMemory(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { ram, motherboard, cpu } = build;
  if (!ram) return;

  const spec = ram.specifications;

  if (motherboard) {
    const mb = motherboard.specifications;

    if (spec.memoryType !== mb.memoryType) {
      issues.push({
        id: 'ram-type',
        severity: 'error',
        title: 'Tipo de memória incompatível',
        detail: `A memória é ${spec.memoryType} e ${motherboard.name} aceita apenas ${mb.memoryType}. DDR4 e DDR5 têm encaixes físicos diferentes e não são intercambiáveis.`,
        categories: ['ram', 'motherboard'],
      });
    } else {
      issues.push({
        id: 'ram-type',
        severity: 'ok',
        title: 'Memória compatível com a placa-mãe',
        detail: `${spec.memoryType} suportado por ${motherboard.name}.`,
        categories: ['ram', 'motherboard'],
      });
    }

    if (spec.modules > mb.memorySlots) {
      issues.push({
        id: 'ram-slots',
        severity: 'error',
        title: 'Slots de memória insuficientes',
        detail: `O kit tem ${spec.modules} módulos, mas ${motherboard.name} possui apenas ${mb.memorySlots} slots.`,
        categories: ['ram', 'motherboard'],
      });
    }

    if (spec.capacity > mb.maxMemory) {
      issues.push({
        id: 'ram-capacity',
        severity: 'error',
        title: 'Capacidade acima do suportado',
        detail: `O kit soma ${spec.capacity} GB e ${motherboard.name} suporta no máximo ${mb.maxMemory} GB.`,
        categories: ['ram', 'motherboard'],
      });
    }

    if (spec.speed > mb.maxMemorySpeed) {
      issues.push({
        id: 'ram-speed',
        severity: 'warning',
        title: 'Memória acima da frequência oficial da placa',
        detail: `O kit é de ${spec.speed} MHz e ${motherboard.name} valida até ${mb.maxMemorySpeed} MHz. A memória deve funcionar, mas provavelmente em frequência reduzida sem overclock manual.`,
        categories: ['ram', 'motherboard'],
      });
    }
  }

  if (cpu && !cpu.specifications.memorySupport.includes(spec.memoryType)) {
    issues.push({
      id: 'ram-cpu',
      severity: 'error',
      title: 'Memória não suportada pela CPU',
      detail: `${cpu.name} suporta ${cpu.specifications.memorySupport.join(' / ')} e o kit selecionado é ${spec.memoryType}.`,
      categories: ['ram', 'cpu'],
    });
  }

  if (cpu && spec.speed > cpu.specifications.maxMemorySpeed) {
    issues.push({
      id: 'ram-cpu-speed',
      severity: 'warning',
      title: 'Frequência acima do especificado pela CPU',
      detail: `O controlador de memória do ${cpu.name} é validado até ${cpu.specifications.maxMemorySpeed} MHz. Rodar a ${spec.speed} MHz depende de perfil EXPO/XMP e do silício.`,
      categories: ['ram', 'cpu'],
    });
  }
}

function checkGpuCase(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { gpu, case: pcCase } = build;
  if (!gpu || !pcCase) return;

  const gpuLength = gpu.specifications.lengthMm;
  const maxLength = pcCase.specifications.maxGpuLength;
  const headroom = maxLength - gpuLength;

  if (headroom < 0) {
    issues.push({
      id: 'gpu-length',
      severity: 'error',
      title: 'GPU não cabe no gabinete',
      detail: `${gpu.name} tem ${gpuLength} mm e ${pcCase.name} comporta placas de até ${maxLength} mm. Faltam ${Math.abs(headroom)} mm.`,
      categories: ['gpu', 'case'],
    });
  } else if (headroom < 20) {
    issues.push({
      id: 'gpu-length',
      severity: 'warning',
      title: 'Folga apertada para a GPU',
      detail: `Sobram apenas ${headroom} mm entre ${gpu.name} (${gpuLength} mm) e o limite de ${maxLength} mm do ${pcCase.name}. Cabos de alimentação frontais podem não caber.`,
      categories: ['gpu', 'case'],
    });
  } else {
    issues.push({
      id: 'gpu-length',
      severity: 'ok',
      title: 'GPU cabe no gabinete',
      detail: `${gpuLength} mm de placa para ${maxLength} mm disponíveis (${headroom} mm de folga).`,
      categories: ['gpu', 'case'],
    });
  }
}

function checkMotherboardCase(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { motherboard, case: pcCase } = build;
  if (!motherboard || !pcCase) return;

  const formFactor = motherboard.specifications.formFactor;
  const supported = pcCase.specifications.formFactorSupport;

  if (!supported.includes(formFactor)) {
    issues.push({
      id: 'mb-form-factor',
      severity: 'error',
      title: 'Formato da placa-mãe não suportado',
      detail: `${motherboard.name} é ${formFactor} e ${pcCase.name} aceita ${supported.join(', ')}.`,
      categories: ['motherboard', 'case'],
    });
  } else {
    issues.push({
      id: 'mb-form-factor',
      severity: 'ok',
      title: 'Formato da placa-mãe compatível',
      detail: `${formFactor} está na lista suportada pelo ${pcCase.name}.`,
      categories: ['motherboard', 'case'],
    });
  }
}

function checkCooler(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { cooler, cpu, case: pcCase, ram } = build;
  if (!cooler) return;

  const spec = cooler.specifications;

  if (cpu) {
    if (!spec.sockets.includes(cpu.specifications.socket)) {
      issues.push({
        id: 'cooler-socket',
        severity: 'error',
        title: 'Cooler incompatível com o socket',
        detail: `${cooler.name} suporta ${spec.sockets.join(', ')} e a CPU usa ${cpu.specifications.socket}.`,
        categories: ['cooler', 'cpu'],
      });
    } else {
      issues.push({
        id: 'cooler-socket',
        severity: 'ok',
        title: 'Cooler compatível com o socket',
        detail: `${cooler.name} tem suporte para ${cpu.specifications.socket}.`,
        categories: ['cooler', 'cpu'],
      });
    }

    const cpuTdp = cpu.specifications.tdp;
    if (spec.tdpRating < cpuTdp) {
      issues.push({
        id: 'cooler-tdp',
        severity: 'warning',
        title: 'Cooler abaixo do TDP da CPU',
        detail: `${cooler.name} é avaliado para ${spec.tdpRating} W e ${cpu.name} tem TDP de ${cpuTdp} W. Espere throttling térmico sob carga prolongada.`,
        categories: ['cooler', 'cpu'],
      });
    }
  }

  if (pcCase) {
    if (spec.coolerType === 'air') {
      const maxHeight = pcCase.specifications.maxCoolerHeight;
      if (spec.heightMm > maxHeight) {
        issues.push({
          id: 'cooler-height',
          severity: 'error',
          title: 'Cooler alto demais para o gabinete',
          detail: `${cooler.name} tem ${spec.heightMm} mm e ${pcCase.name} comporta até ${maxHeight} mm.`,
          categories: ['cooler', 'case'],
        });
      } else if (maxHeight - spec.heightMm < 8) {
        issues.push({
          id: 'cooler-height',
          severity: 'warning',
          title: 'Folga mínima para o cooler',
          detail: `Sobram ${maxHeight - spec.heightMm} mm entre o cooler e a lateral do gabinete.`,
          categories: ['cooler', 'case'],
        });
      }
    } else if (spec.radiatorMm > pcCase.specifications.maxRadiator) {
      issues.push({
        id: 'cooler-radiator',
        severity: 'error',
        title: 'Radiador não suportado pelo gabinete',
        detail: `O radiador de ${spec.radiatorMm} mm excede o limite de ${pcCase.specifications.maxRadiator} mm do ${pcCase.name}.`,
        categories: ['cooler', 'case'],
      });
    }
  }

  if (ram && spec.coolerType === 'air' && ram.specifications.heightMm > spec.ramClearanceMm) {
    issues.push({
      id: 'cooler-ram',
      severity: 'warning',
      title: 'Possível conflito entre cooler e memória',
      detail: `${ram.name} tem ${ram.specifications.heightMm} mm de altura e ${cooler.name} deixa ${spec.ramClearanceMm} mm livres. Pode ser necessário subir a ventoinha do cooler.`,
      categories: ['cooler', 'ram'],
    });
  }
}

function checkStorage(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { storage, motherboard, case: pcCase } = build;
  if (!storage) return;

  const iface = storage.specifications.storageInterface;

  if (motherboard) {
    if (iface === 'M.2 NVMe') {
      if (motherboard.specifications.m2Slots < 1) {
        issues.push({
          id: 'storage-m2',
          severity: 'error',
          title: 'Sem slot M.2 disponível',
          detail: `${motherboard.name} não possui slots M.2 e o SSD selecionado é NVMe.`,
          categories: ['storage', 'motherboard'],
        });
      } else {
        issues.push({
          id: 'storage-m2',
          severity: 'ok',
          title: 'Slot M.2 disponível',
          detail: `${motherboard.name} oferece ${motherboard.specifications.m2Slots} slots M.2.`,
          categories: ['storage', 'motherboard'],
        });
      }
    } else if (motherboard.specifications.sataPorts < 1) {
      issues.push({
        id: 'storage-sata',
        severity: 'error',
        title: 'Sem portas SATA disponíveis',
        detail: `${motherboard.name} não possui portas SATA e o SSD selecionado é SATA.`,
        categories: ['storage', 'motherboard'],
      });
    } else {
      issues.push({
        id: 'storage-sata',
        severity: 'ok',
        title: 'Porta SATA disponível',
        detail: `${motherboard.name} oferece ${motherboard.specifications.sataPorts} portas SATA.`,
        categories: ['storage', 'motherboard'],
      });
    }
  }

  if (pcCase && iface === 'SATA' && pcCase.specifications.sataBays < 1) {
    issues.push({
      id: 'storage-bay',
      severity: 'warning',
      title: 'Gabinete sem baia para SSD SATA',
      detail: `${pcCase.name} não declara baias de 2.5". Pode ser necessário improvisar a fixação.`,
      categories: ['storage', 'case'],
    });
  }
}

function checkPsu(
  build: BuildSelection,
  issues: CompatibilityIssue[],
  psuMargin: number,
): void {
  const { psu, gpu, case: pcCase } = build;
  const power = estimatePower(build, psuMargin);

  if (psu && power.estimatedDraw > 0) {
    const wattage = psu.specifications.wattage;
    const load = (power.estimatedDraw / wattage) * 100;

    if (power.estimatedDraw > wattage) {
      issues.push({
        id: 'psu-wattage',
        severity: 'error',
        title: 'Fonte insuficiente para a configuração',
        detail: `O consumo estimado é de ${power.estimatedDraw} W e a fonte entrega ${wattage} W. Recomendado: ${power.recommendedPsu} W ou mais.`,
        categories: ['psu'],
      });
    } else if (load > 80) {
      issues.push({
        id: 'psu-wattage',
        severity: 'warning',
        title: 'Fonte próxima do limite recomendado',
        detail: `O consumo estimado de ${power.estimatedDraw} W representa ${Math.round(load)}% dos ${wattage} W da fonte. O ideal é operar entre 50% e 80% para eficiência e margem de picos. Recomendado: ${power.recommendedPsu} W.`,
        categories: ['psu'],
      });
    } else {
      issues.push({
        id: 'psu-wattage',
        severity: 'ok',
        title: 'Fonte adequada',
        detail: `${wattage} W para um consumo estimado de ${power.estimatedDraw} W (${Math.round(load)}% de carga).`,
        categories: ['psu'],
      });
    }
  }

  if (psu && gpu) {
    const needed = gpu.specifications.powerConnectors;
    const available = psu.specifications.pcieConnectors;
    if (available < needed) {
      issues.push({
        id: 'psu-connectors',
        severity: 'error',
        title: 'Conectores PCIe insuficientes',
        detail: `${gpu.name} precisa de ${needed} conectores PCIe e ${psu.name} oferece ${available}.`,
        categories: ['psu', 'gpu'],
      });
    }
  }

  if (psu && pcCase && psu.specifications.lengthMm > pcCase.specifications.maxPsuLength) {
    issues.push({
      id: 'psu-length',
      severity: 'error',
      title: 'Fonte longa demais para o gabinete',
      detail: `${psu.name} tem ${psu.specifications.lengthMm} mm e ${pcCase.name} comporta até ${pcCase.specifications.maxPsuLength} mm.`,
      categories: ['psu', 'case'],
    });
  }
}

function checkFans(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { case: pcCase, motherboard } = build;
  const units = build.fans.reduce((sum, fan) => sum + fan.quantity, 0);
  if (units === 0) return;

  if (pcCase) {
    const mounts = pcCase.specifications.fanMounts;
    if (units > mounts) {
      issues.push({
        id: 'fans-mounts',
        severity: 'error',
        title: 'Mais ventoinhas do que posições no gabinete',
        detail: `A build tem ${units} ventoinhas e ${pcCase.name} possui ${mounts} posições de instalação.`,
        categories: ['fans', 'case'],
      });
    } else {
      issues.push({
        id: 'fans-mounts',
        severity: 'ok',
        title: 'Ventoinhas cabem no gabinete',
        detail: `${units} de ${mounts} posições ocupadas em ${pcCase.name}.`,
        categories: ['fans', 'case'],
      });
    }
  }

  if (motherboard) {
    const coolerFans = build.cooler?.specifications.fans ?? 0;
    const headers = motherboard.specifications.fanHeaders;
    if (units + coolerFans > headers) {
      issues.push({
        id: 'fans-headers',
        severity: 'warning',
        title: 'Headers de ventoinha insuficientes',
        detail: `A build usa ${units + coolerFans} ventoinhas e ${motherboard.name} tem ${headers} headers. Será necessário um hub ou splitters.`,
        categories: ['fans', 'motherboard'],
      });
    }
  }
}

function checkGraphicsOutput(build: BuildSelection, issues: CompatibilityIssue[]): void {
  const { cpu, gpu } = build;
  if (!cpu || gpu) return;

  if (!cpu.specifications.integratedGraphics) {
    issues.push({
      id: 'no-video-output',
      severity: 'warning',
      title: 'Nenhuma saída de vídeo na configuração',
      detail: `${cpu.name} não possui gráficos integrados e nenhuma GPU dedicada foi selecionada. O sistema liga, mas não gera imagem.`,
      categories: ['cpu', 'gpu'],
    });
  }
}
