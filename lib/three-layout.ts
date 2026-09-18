/**
 * Turns the current build into concrete 3D placements.
 *
 * All scene units are metres-ish: 1 unit === 100 mm, so a 450 mm tall case is
 * 4.5 units tall. Keeping the layout maths here means the R3F components stay
 * declarative and can be unit-tested without a renderer.
 *
 * Axis convention:
 *   +X → towards the side panel (the camera side)
 *   +Y → up
 *   +Z → towards the front of the case (intake fans)
 */

import type { BuildSelection } from '@/types/build';
import type { ComponentCategory, FormFactor } from '@/types/components';

/** Scene units per millimetre. */
export const MM = 0.01;

/** Used when no case is selected yet, so the viewer is never empty. */
export const DEFAULT_CASE_SIZE = { widthMm: 230, heightMm: 453, depthMm: 466 };

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Triple = [number, number, number];

export interface BoxPlacement {
  position: Triple;
  size: Triple;
}

export interface FanPlacement {
  position: Triple;
  rotation: Triple;
  radius: number;
  depth: number;
  /** Where the fan is mounted — only used for labels. */
  mount: 'front' | 'rear' | 'top';
}

export interface SceneLayout {
  caseSize: Triple;
  caseHalf: Vec3;
  wallThickness: number;
  shroud: BoxPlacement;
  motherboard: BoxPlacement;
  /** X coordinate where parts mounted on the board start. */
  boardSurfaceX: number;
  cpu: BoxPlacement;
  cooler:
    | { kind: 'air'; tower: BoxPlacement; fan: FanPlacement }
    | { kind: 'liquid'; pump: BoxPlacement; radiator: BoxPlacement; fans: FanPlacement[] };
  ram: BoxPlacement[];
  gpu: { body: BoxPlacement; bracket: BoxPlacement; fans: FanPlacement[] };
  psu: BoxPlacement;
  storage: BoxPlacement;
  storageKind: 'm2' | 'sata';
  fans: FanPlacement[];
  /** Cable routes, as point triples for a catmull-rom curve. */
  cables: Array<{ id: string; points: Triple[]; color: string }>;
}

const BOARD_SIZE: Record<FormFactor, { height: number; depth: number }> = {
  'E-ATX': { height: 244, depth: 330 },
  ATX: { height: 244, depth: 305 },
  'Micro-ATX': { height: 244, depth: 244 },
  'Mini-ITX': { height: 170, depth: 170 },
};

/** Distance kept free behind the motherboard tray for cable routing. */
const CABLE_SPACE = 27 * MM;
const WALL = 0.03;
const SHROUD_HEIGHT = 0.95;

export function computeLayout(build: BuildSelection): SceneLayout {
  const caseSpec = build.case?.specifications;
  const widthMm = caseSpec?.widthMm ?? DEFAULT_CASE_SIZE.widthMm;
  const heightMm = caseSpec?.heightMm ?? DEFAULT_CASE_SIZE.heightMm;
  const depthMm = caseSpec?.depthMm ?? DEFAULT_CASE_SIZE.depthMm;

  const width = widthMm * MM;
  const height = heightMm * MM;
  const depth = depthMm * MM;

  const half: Vec3 = { x: width / 2, y: height / 2, z: depth / 2 };

  const shroudTopY = -half.y + SHROUD_HEIGHT;
  const shroudDepth = depth * 0.72;
  const shroud: BoxPlacement = {
    position: [0, -half.y + SHROUD_HEIGHT / 2, -half.z + shroudDepth / 2],
    size: [width - WALL * 2, SHROUD_HEIGHT, shroudDepth],
  };

  // Motherboard --------------------------------------------------------------
  const formFactor = build.motherboard?.specifications.formFactor ?? 'ATX';
  const board = BOARD_SIZE[formFactor] ?? BOARD_SIZE.ATX;
  const boardHeight = Math.min(board.height * MM, height - SHROUD_HEIGHT - 0.35);
  const boardDepth = Math.min(board.depth * MM, depth - 0.5);

  const boardX = -half.x + CABLE_SPACE;
  const boardBottomY = shroudTopY + 0.1;
  const boardCenterY = boardBottomY + boardHeight / 2;
  const boardRearZ = -half.z + 0.14;
  const boardCenterZ = boardRearZ + boardDepth / 2;
  const boardThickness = 0.025;
  const boardSurfaceX = boardX + boardThickness / 2;

  const motherboard: BoxPlacement = {
    position: [boardX, boardCenterY, boardCenterZ],
    size: [boardThickness, boardHeight, boardDepth],
  };

  const boardTopY = boardCenterY + boardHeight / 2;

  // CPU ----------------------------------------------------------------------
  const cpuZ = boardRearZ + boardDepth * 0.32;
  const cpuY = boardTopY - boardHeight * 0.3;
  const cpuSize = 0.42;
  const cpu: BoxPlacement = {
    position: [boardSurfaceX + 0.03, cpuY, cpuZ],
    size: [0.055, cpuSize, cpuSize],
  };

  // Memory -------------------------------------------------------------------
  const ramSpec = build.ram?.specifications;
  const ramModules = Math.min(ramSpec?.modules ?? 2, 4);
  const ramProtrusion = (ramSpec?.heightMm ?? 34) * MM;
  const ramVisibleHeight = Math.min(1.15, boardHeight * 0.5);
  const ramPitch = 0.115;
  const ramStartZ = cpuZ + cpuSize / 2 + 0.28;
  const ramTopY = boardTopY - 0.12;
  const ram: BoxPlacement[] = Array.from({ length: ramModules }, (_, index) => ({
    position: [
      boardSurfaceX + ramProtrusion / 2,
      ramTopY - ramVisibleHeight / 2,
      ramStartZ + index * ramPitch,
    ] as Triple,
    size: [ramProtrusion, ramVisibleHeight, 0.075] as Triple,
  }));

  // Cooler -------------------------------------------------------------------
  const coolerSpec = build.cooler?.specifications;
  const coolerKind = coolerSpec?.coolerType ?? 'air';
  let cooler: SceneLayout['cooler'];

  if (coolerKind === 'liquid') {
    const radiatorMm = coolerSpec?.radiatorMm ?? 240;
    const radiatorLength = Math.min(radiatorMm * MM, depth - 0.6);
    const radiatorY = half.y - 0.18;
    const radiatorZ = boardRearZ + radiatorLength / 2 + 0.1;
    const radiatorFanCount = Math.max(2, Math.round(radiatorMm / 120));
    cooler = {
      kind: 'liquid',
      pump: {
        position: [boardSurfaceX + 0.35, cpuY, cpuZ],
        size: [0.62, 0.72, 0.72],
      },
      radiator: {
        position: [boardSurfaceX + 0.62, radiatorY, radiatorZ],
        size: [1.24, 0.3, radiatorLength],
      },
      fans: Array.from({ length: radiatorFanCount }, (_, index) => ({
        position: [
          boardSurfaceX + 0.62,
          radiatorY - 0.3,
          radiatorZ - radiatorLength / 2 + 0.6 + index * 1.2,
        ] as Triple,
        rotation: [0, 0, 0] as Triple,
        radius: 0.56,
        depth: 0.25,
        mount: 'top' as const,
      })),
    };
  } else {
    const towerHeight = Math.min((coolerSpec?.heightMm ?? 155) * MM, width - CABLE_SPACE - 0.15);
    cooler = {
      kind: 'air',
      tower: {
        position: [boardSurfaceX + towerHeight / 2, cpuY + 0.28, cpuZ],
        size: [towerHeight, 1.32, 1.05],
      },
      fan: {
        position: [boardSurfaceX + towerHeight / 2, cpuY + 0.28, cpuZ + 0.6],
        rotation: [Math.PI / 2, 0, 0],
        radius: 0.58,
        depth: 0.22,
        mount: 'front',
      },
    };
  }

  // GPU ----------------------------------------------------------------------
  const gpuSpec = build.gpu?.specifications;
  const gpuLength = Math.min((gpuSpec?.lengthMm ?? 280) * MM, depth - 0.35);
  const gpuReach = (gpuSpec?.heightMm ?? 130) * MM;
  const gpuThickness = Math.max(0.4, (gpuSpec?.slots ?? 2) * 0.2);
  const gpuY = cpuY - boardHeight * 0.34;
  const gpuZ = boardRearZ + gpuLength / 2 + 0.04;

  const gpuFanCount = gpuLength > 3.0 ? 3 : 2;
  const gpu: SceneLayout['gpu'] = {
    body: {
      position: [boardSurfaceX + gpuReach / 2, gpuY, gpuZ],
      size: [gpuReach, gpuThickness, gpuLength],
    },
    bracket: {
      position: [boardSurfaceX + gpuReach / 2, gpuY, boardRearZ - 0.03],
      size: [gpuReach * 0.92, gpuThickness * 1.5, 0.05],
    },
    fans: Array.from({ length: gpuFanCount }, (_, index) => {
      const span = gpuLength - 0.7;
      const step = gpuFanCount > 1 ? span / (gpuFanCount - 1) : 0;
      return {
        position: [
          boardSurfaceX + gpuReach / 2,
          gpuY - gpuThickness / 2 + 0.03,
          gpuZ - span / 2 + index * step,
        ] as Triple,
        rotation: [0, 0, 0] as Triple,
        radius: Math.min(0.42, gpuReach / 2.6),
        depth: 0.12,
        mount: 'top' as const,
      };
    }),
  };

  // PSU ----------------------------------------------------------------------
  const psuLength = Math.min((build.psu?.specifications.lengthMm ?? 160) * MM, shroudDepth - 0.2);
  const psu: BoxPlacement = {
    position: [0, -half.y + 0.1 + 0.43, -half.z + 0.08 + psuLength / 2],
    size: [Math.min(1.5, width - 0.3), 0.86, psuLength],
  };

  // Storage ------------------------------------------------------------------
  const storageKind: SceneLayout['storageKind'] =
    build.storage?.specifications.storageInterface === 'SATA' ? 'sata' : 'm2';

  const storage: BoxPlacement =
    storageKind === 'sata'
      ? {
          position: [0.05, shroudTopY + 0.04, boardRearZ + boardDepth * 0.55],
          size: [0.7, 0.07, 1.0],
        }
      : {
          position: [boardSurfaceX + 0.02, gpuY + boardHeight * 0.17, boardRearZ + boardDepth * 0.42],
          size: [0.03, 0.22, 0.8],
        };

  // Case fans ----------------------------------------------------------------
  const requestedFans = build.fans.reduce((sum, fan) => sum + fan.quantity, 0);
  const fanSizeMm = build.fans[0]?.component.specifications.sizeMm ?? 120;
  const fanRadius = (fanSizeMm * MM) / 2;
  const mountLimit = build.case?.specifications.fanMounts ?? 6;
  const fanCount = Math.min(requestedFans, mountLimit, 7);

  const fans: FanPlacement[] = [];
  const frontSlots = Math.min(3, Math.max(0, fanCount));
  const frontStartY = -half.y + SHROUD_HEIGHT + fanRadius + 0.1;
  for (let index = 0; index < frontSlots; index += 1) {
    fans.push({
      position: [0, frontStartY + index * (fanRadius * 2 + 0.06), half.z - 0.1],
      rotation: [Math.PI / 2, 0, 0],
      radius: fanRadius,
      depth: 0.25,
      mount: 'front',
    });
  }
  if (fanCount > frontSlots) {
    fans.push({
      position: [boardSurfaceX + 0.55, boardTopY - 0.35, -half.z + 0.08],
      rotation: [Math.PI / 2, 0, 0],
      radius: fanRadius,
      depth: 0.25,
      mount: 'rear',
    });
  }
  const topSlots = Math.max(0, fanCount - frontSlots - 1);
  for (let index = 0; index < Math.min(3, topSlots); index += 1) {
    fans.push({
      position: [boardSurfaceX + 0.6, half.y - 0.12, boardRearZ + 0.7 + index * (fanRadius * 2 + 0.06)],
      rotation: [0, 0, 0],
      radius: fanRadius,
      depth: 0.25,
      mount: 'top',
    });
  }

  // Cables -------------------------------------------------------------------
  const psuTopY = psu.position[1] + 0.43;
  const cables: SceneLayout['cables'] = [];

  if (build.psu && build.motherboard) {
    cables.push({
      id: 'psu-motherboard',
      color: '#2f3545',
      points: [
        [psu.position[0] - 0.4, psuTopY, psu.position[2] + 0.2],
        [boardSurfaceX + 0.12, shroudTopY + 0.35, boardCenterZ + boardDepth * 0.3],
        [boardSurfaceX + 0.08, boardCenterY, boardRearZ + boardDepth - 0.08],
        [boardSurfaceX + 0.05, boardTopY - 0.35, boardRearZ + boardDepth - 0.05],
      ],
    });
  }

  if (build.psu && build.gpu) {
    cables.push({
      id: 'psu-gpu',
      color: '#3a2f45',
      points: [
        [psu.position[0] + 0.2, psuTopY, psu.position[2] + 0.35],
        [boardSurfaceX + gpuReach * 0.8, shroudTopY + 0.4, gpuZ + gpuLength * 0.25],
        [boardSurfaceX + gpuReach * 0.75, gpuY + gpuThickness / 2 + 0.12, gpuZ + gpuLength * 0.34],
      ],
    });
  }

  if (build.psu && build.storage && storageKind === 'sata') {
    cables.push({
      id: 'psu-storage',
      color: '#2b3a34',
      points: [
        [psu.position[0] - 0.2, psuTopY, psu.position[2] + 0.4],
        [0.1, shroudTopY + 0.02, storage.position[2] - 0.55],
        [storage.position[0], shroudTopY + 0.06, storage.position[2] - 0.5],
      ],
    });
  }

  return {
    caseSize: [width, height, depth],
    caseHalf: half,
    wallThickness: WALL,
    shroud,
    motherboard,
    boardSurfaceX,
    cpu,
    cooler,
    ram,
    gpu,
    psu,
    storage,
    storageKind,
    fans,
    cables,
  };
}

/** Offsets applied to each group when the exploded view is on. */
export const EXPLODED_OFFSETS: Record<ComponentCategory | 'case', Triple> = {
  case: [0, 0, 0],
  motherboard: [-0.3, 0, 0],
  cpu: [0.65, 0.85, 0],
  cooler: [1.45, 1.35, 0],
  ram: [0.55, 1.0, 0.7],
  gpu: [1.25, -0.5, 0.4],
  psu: [0, -1.05, -0.6],
  storage: [1.15, -0.3, 1.0],
  fans: [0, 0, 1.1],
};
