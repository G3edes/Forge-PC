'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { Fan, PALETTE, Part } from './shared';

/** PSU body with its intake fan facing down and a modular connector plate. */
export function PsuModel({ layout, name }: { layout: SceneLayout; name: string }) {
  const { psu } = layout;
  const [x, y, z] = psu.position;
  const [sx, sy, sz] = psu.size;

  return (
    <Part
      id="psu"
      label="PSU"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.psu}
      hideKey="psu"
    >
      <mesh position={psu.position} castShadow>
        <boxGeometry args={psu.size} />
        <meshStandardMaterial color="#171a22" roughness={0.6} metalness={0.55} />
      </mesh>

      {/* Intake fan on the underside */}
      <Fan
        position={[x, y - sy / 2 + 0.03, z + sz * 0.05]}
        rotation={[0, 0, 0]}
        radius={Math.min(0.55, sx * 0.34)}
        depth={0.1}
        speed={0.7}
        blades={11}
      />

      {/* Modular connector plate facing the front of the case */}
      <mesh position={[x, y, z + sz / 2 + 0.01]}>
        <boxGeometry args={[sx * 0.8, sy * 0.72, 0.02]} />
        <meshStandardMaterial color="#0d1016" roughness={0.9} />
      </mesh>
      {Array.from({ length: 4 }, (_, index) => (
        <mesh
          key={index}
          position={[x - sx * 0.26 + index * (sx * 0.17), y + sy * 0.12, z + sz / 2 + 0.03]}
        >
          <boxGeometry args={[sx * 0.11, 0.09, 0.03]} />
          <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </Part>
  );
}
