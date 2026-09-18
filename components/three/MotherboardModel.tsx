'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { PALETTE, Part, RgbSurface } from './shared';

/** PCB, rear I/O shield, VRM/chipset heatsinks, DIMM and PCIe slots. */
export function MotherboardModel({
  layout,
  name,
  rgb,
}: {
  layout: SceneLayout;
  name: string;
  rgb: boolean;
}) {
  const board = layout.motherboard;
  const [, by, bz] = board.position;
  const [, boardHeight, boardDepth] = board.size;
  const surfaceX = layout.boardSurfaceX;
  const rearZ = bz - boardDepth / 2;
  const topY = by + boardHeight / 2;

  return (
    <Part
      id="motherboard"
      label="Motherboard"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.motherboard}
      hideKey="motherboard"
    >
      {/* PCB */}
      <mesh position={board.position} castShadow receiveShadow>
        <boxGeometry args={board.size} />
        <meshStandardMaterial color={PALETTE.pcb} roughness={0.72} metalness={0.15} />
      </mesh>

      {/* Rear I/O shroud */}
      <mesh position={[surfaceX + 0.13, topY - 0.34, rearZ + 0.22]}>
        <boxGeometry args={[0.26, 0.58, 0.4]} />
        <meshStandardMaterial color="#20242e" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* VRM heatsinks */}
      <mesh position={[surfaceX + 0.06, topY - 0.2, bz - boardDepth * 0.1]}>
        <boxGeometry args={[0.12, 0.3, boardDepth * 0.34]} />
        <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.45} metalness={0.75} />
      </mesh>

      {/* Chipset heatsink */}
      <mesh position={[surfaceX + 0.05, by - boardHeight * 0.3, bz + boardDepth * 0.14]}>
        <boxGeometry args={[0.1, 0.5, 0.5]} />
        <meshStandardMaterial color="#2b303c" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* PCIe slots */}
      {[0, 1].map((index) => (
        <mesh
          key={`pcie-${index}`}
          position={[
            surfaceX + 0.02,
            by - boardHeight * (0.3 + index * 0.16),
            rearZ + boardDepth * 0.42,
          ]}
        >
          <boxGeometry args={[0.04, 0.05, boardDepth * 0.5]} />
          <meshStandardMaterial color="#1d2633" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* DIMM slots */}
      {layout.ram.map((slot, index) => (
        <mesh
          key={`dimm-${index}`}
          position={[surfaceX + 0.015, slot.position[1] - slot.size[1] / 2 - 0.03, slot.position[2]]}
        >
          <boxGeometry args={[0.03, 0.06, 0.085]} />
          <meshStandardMaterial color="#20242e" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* Board accent lighting (only when the board advertises RGB) */}
      {rgb ? (
        <RgbSurface
          position={[surfaceX + 0.02, topY - 0.06, bz]}
          args={[0.02, 0.04, boardDepth * 0.72]}
          phase={1.1}
        />
      ) : null}
    </Part>
  );
}
