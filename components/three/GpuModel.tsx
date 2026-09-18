'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { Fan, PALETTE, Part, RgbSurface } from './shared';

/** Shroud, backplate, I/O bracket and downward-facing fans. */
export function GpuModel({
  layout,
  name,
  rgb,
}: {
  layout: SceneLayout;
  name: string;
  rgb: boolean;
}) {
  const { body, bracket, fans } = layout.gpu;
  const [x, y, z] = body.position;
  const [sx, sy, sz] = body.size;

  return (
    <Part
      id="gpu"
      label="GPU"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.gpu}
      hideKey="gpu"
    >
      {/* Shroud */}
      <mesh position={body.position} castShadow>
        <boxGeometry args={body.size} />
        <meshStandardMaterial color="#1c202a" roughness={0.45} metalness={0.65} />
      </mesh>

      {/* Backplate (top face) */}
      <mesh position={[x, y + sy / 2 + 0.012, z]}>
        <boxGeometry args={[sx * 0.98, 0.025, sz * 0.98]} />
        <meshStandardMaterial color="#2a2f3b" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* PCB edge visible below the shroud */}
      <mesh position={[x - sx * 0.05, y - sy / 2 - 0.02, z]}>
        <boxGeometry args={[sx * 0.9, 0.035, sz * 0.96]} />
        <meshStandardMaterial color={PALETTE.pcbDark} roughness={0.8} />
      </mesh>

      {/* PCIe gold fingers */}
      <mesh position={[x - sx / 2 + 0.06, y - sy / 2 - 0.05, z - sz * 0.18]}>
        <boxGeometry args={[0.16, 0.05, sz * 0.32]} />
        <meshStandardMaterial color={PALETTE.gold} roughness={0.25} metalness={1} />
      </mesh>

      {/* Rear I/O bracket */}
      <mesh position={bracket.position}>
        <boxGeometry args={bracket.size} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.4} metalness={0.85} />
      </mesh>

      {fans.map((fan, index) => (
        <Fan
          key={index}
          position={fan.position}
          rotation={fan.rotation}
          radius={fan.radius}
          depth={fan.depth}
          rgb={false}
          speed={1.1}
          blades={11}
        />
      ))}

      {rgb ? (
        <RgbSurface
          position={[x + sx / 2 + 0.012, y, z]}
          args={[0.02, sy * 0.5, sz * 0.72]}
          phase={1.6}
        />
      ) : null}
    </Part>
  );
}
