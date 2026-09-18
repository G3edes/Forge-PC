'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { PALETTE, Part, RgbSurface } from './shared';

/** One box per module, with an RGB diffuser along the top edge. */
export function RamModel({
  layout,
  name,
  rgb,
}: {
  layout: SceneLayout;
  name: string;
  rgb: boolean;
}) {
  return (
    <Part
      id="ram"
      label="RAM"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.ram}
      hideKey="ram"
    >
      {layout.ram.map((module, index) => {
        const [x, y, z] = module.position;
        const [sx, sy, sz] = module.size;
        return (
          <group key={index}>
            {/* Heatspreader */}
            <mesh position={module.position} castShadow>
              <boxGeometry args={module.size} />
              <meshStandardMaterial
                color="#262b36"
                roughness={0.38}
                metalness={0.72}
              />
            </mesh>
            {/* PCB peeking under the heatspreader */}
            <mesh position={[x, y - sy / 2 + 0.03, z]}>
              <boxGeometry args={[sx * 0.98, 0.06, sz * 0.55]} />
              <meshStandardMaterial color={PALETTE.pcbDark} roughness={0.8} />
            </mesh>
            {rgb ? (
              <RgbSurface
                position={[x, y + sy / 2 + 0.015, z]}
                args={[sx * 0.85, 0.03, sz * 0.85]}
                phase={index * 0.7}
              />
            ) : null}
          </group>
        );
      })}
    </Part>
  );
}
