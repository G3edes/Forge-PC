'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { PALETTE, Part } from './shared';

/** Socket retention frame, substrate and IHS. */
export function CpuModel({ layout, name }: { layout: SceneLayout; name: string }) {
  const { cpu } = layout;
  const [x, y, z] = cpu.position;
  const [thickness, sizeY, sizeZ] = cpu.size;

  return (
    <Part
      id="cpu"
      label="CPU"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.cpu}
      hideKey="cpu"
    >
      {/* Socket frame */}
      <mesh position={[x - thickness * 0.4, y, z]}>
        <boxGeometry args={[thickness * 0.5, sizeY * 1.25, sizeZ * 1.25]} />
        <meshStandardMaterial color="#20242e" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Substrate */}
      <mesh position={cpu.position}>
        <boxGeometry args={[thickness * 0.5, sizeY, sizeZ]} />
        <meshStandardMaterial color={PALETTE.pcbDark} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Integrated heat spreader */}
      <mesh position={[x + thickness * 0.45, y, z]} castShadow>
        <boxGeometry args={[thickness * 0.45, sizeY * 0.82, sizeZ * 0.82]} />
        <meshStandardMaterial color={PALETTE.heatsink} roughness={0.22} metalness={0.95} />
      </mesh>
    </Part>
  );
}
