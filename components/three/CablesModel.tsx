'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

import type { SceneLayout } from '@/lib/three-layout';

/**
 * Simplified power cabling (PSU → motherboard / GPU / storage).
 * Purely decorative: routes come from `computeLayout`, no physics involved.
 */
export function CablesModel({ layout }: { layout: SceneLayout }) {
  const tubes = useMemo(
    () =>
      layout.cables.map((cable) => {
        const curve = new THREE.CatmullRomCurve3(
          cable.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        );
        return {
          id: cable.id,
          color: cable.color,
          geometry: new THREE.TubeGeometry(curve, 40, 0.045, 8, false),
        };
      }),
    [layout.cables],
  );

  return (
    <group>
      {tubes.map((tube) => (
        <mesh key={tube.id} geometry={tube.geometry}>
          <meshStandardMaterial color={tube.color} roughness={0.85} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}
