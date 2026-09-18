'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { PALETTE, Part } from './shared';

/** M.2 stick lying on the board, or a 2.5" drive sitting on the PSU shroud. */
export function StorageModel({ layout, name }: { layout: SceneLayout; name: string }) {
  const { storage, storageKind } = layout;
  const [x, y, z] = storage.position;
  const [sx, sy, sz] = storage.size;

  return (
    <Part
      id="storage"
      label="Storage"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.storage}
      hideKey="storage"
    >
      {storageKind === 'm2' ? (
        <>
          {/* Heatsink cover */}
          <mesh position={[x + sx, y, z]}>
            <boxGeometry args={[sx * 1.6, sy * 1.15, sz * 1.02]} />
            <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.45} metalness={0.75} />
          </mesh>
          {/* Module */}
          <mesh position={storage.position}>
            <boxGeometry args={storage.size} />
            <meshStandardMaterial color={PALETTE.pcbDark} roughness={0.75} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={storage.position} castShadow>
            <boxGeometry args={storage.size} />
            <meshStandardMaterial color="#20242e" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* SATA connectors on the rear edge */}
          <mesh position={[x, y, z - sz / 2 - 0.02]}>
            <boxGeometry args={[sx * 0.55, sy * 0.7, 0.04]} />
            <meshStandardMaterial color="#0e1116" roughness={0.9} />
          </mesh>
        </>
      )}
    </Part>
  );
}
