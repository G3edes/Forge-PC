'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { Fan, Part } from './shared';

/** Front, rear and top case fans, placed by `computeLayout`. */
export function CaseFansModel({
  layout,
  name,
  rgb,
}: {
  layout: SceneLayout;
  name: string;
  rgb: boolean;
}) {
  if (layout.fans.length === 0) return null;

  return (
    <Part
      id="fans"
      label="Fans"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.fans}
      hideKey="fans"
    >
      {layout.fans.map((fan, index) => (
        <Fan
          key={`${fan.mount}-${index}`}
          position={fan.position}
          rotation={fan.rotation}
          radius={fan.radius}
          depth={fan.depth}
          rgb={rgb}
          phase={index * 0.55}
          speed={fan.mount === 'rear' ? 1.3 : 1}
        />
      ))}
    </Part>
  );
}
