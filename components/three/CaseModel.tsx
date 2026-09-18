'use client';

import * as THREE from 'three';

import type { SceneLayout } from '@/lib/three-layout';
import { useViewerStore } from '@/store/viewer-store';

import { PALETTE, Part, RgbSurface } from './shared';

/**
 * The chassis: structure, PSU shroud, front mesh and the tempered-glass panel.
 * Built from primitives so the viewer never depends on an external model file.
 */
export function CaseModel({ layout, name }: { layout: SceneLayout; name: string }) {
  const xray = useViewerStore((state) => state.xray);
  const panelOpen = useViewerStore((state) => state.panelOpen);

  const [width, height, depth] = layout.caseSize;
  const half = layout.caseHalf;
  const t = layout.wallThickness;

  const solidOpacity = xray ? 0.12 : 1;
  const glassOpacity = xray ? 0.04 : 0.15;

  const slatCount = 7;

  return (
    <Part
      id="case"
      label="Gabinete"
      caption={name}
      explodedOffset={[0, 0, 0]}
    >
      {/* Bottom */}
      <mesh position={[0, -half.y, 0]} receiveShadow>
        <boxGeometry args={[width, t, depth]} />
        <meshStandardMaterial
          color={PALETTE.chassis}
          roughness={0.75}
          metalness={0.35}
          transparent={xray}
          opacity={solidOpacity}
        />
      </mesh>

      {/* Top */}
      <mesh position={[0, half.y, 0]}>
        <boxGeometry args={[width, t, depth]} />
        <meshStandardMaterial
          color={PALETTE.chassis}
          roughness={0.75}
          metalness={0.35}
          transparent
          opacity={xray ? 0.1 : 0.85}
        />
      </mesh>

      {/* Motherboard tray side (solid) */}
      <mesh position={[-half.x, 0, 0]}>
        <boxGeometry args={[t, height, depth]} />
        <meshStandardMaterial
          color={PALETTE.chassis}
          roughness={0.8}
          metalness={0.3}
          transparent={xray}
          opacity={solidOpacity}
        />
      </mesh>

      {/* Rear panel */}
      <mesh position={[0, 0, -half.z]}>
        <boxGeometry args={[width, height, t]} />
        <meshStandardMaterial
          color={PALETTE.chassisEdge}
          roughness={0.7}
          metalness={0.45}
          transparent={xray}
          opacity={solidOpacity}
        />
      </mesh>

      {/* Front mesh panel: a dark plate plus slats, evoking an airflow front. */}
      <group position={[0, 0, half.z]}>
        <mesh>
          <boxGeometry args={[width, height, t]} />
          <meshStandardMaterial
            color="#0d1017"
            roughness={0.9}
            metalness={0.2}
            transparent
            opacity={xray ? 0.06 : 0.55}
          />
        </mesh>
        {Array.from({ length: slatCount }, (_, index) => (
          <mesh
            key={index}
            position={[0, -half.y + (height / (slatCount + 1)) * (index + 1), t * 0.8]}
          >
            <boxGeometry args={[width * 0.84, 0.035, t * 0.6]} />
            <meshStandardMaterial
              color={PALETTE.chassisEdge}
              roughness={0.6}
              metalness={0.5}
              transparent={xray}
              opacity={solidOpacity}
            />
          </mesh>
        ))}
      </group>

      {/* Tempered-glass side panel — removed when the case is "open". */}
      {!panelOpen ? (
        <mesh position={[half.x, 0, 0]}>
          <boxGeometry args={[t * 0.6, height * 0.98, depth * 0.98]} />
          <meshStandardMaterial
            color={PALETTE.glass}
            transparent
            opacity={glassOpacity}
            roughness={0.05}
            metalness={0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}

      {/* PSU shroud */}
      <mesh position={layout.shroud.position}>
        <boxGeometry args={layout.shroud.size} />
        <meshStandardMaterial
          color="#14171f"
          roughness={0.85}
          metalness={0.25}
          transparent={xray}
          opacity={xray ? 0.25 : 1}
        />
      </mesh>

      {/* Accent strip along the glass-side edge of the shroud */}
      <RgbSurface
        position={[
          layout.shroud.position[0] + layout.shroud.size[0] / 2 - 0.09,
          layout.shroud.position[1] + layout.shroud.size[1] / 2 + 0.012,
          layout.shroud.position[2],
        ]}
        args={[0.12, 0.02, layout.shroud.size[2] * 0.88]}
        phase={0.4}
      />

      {/* Corner beams for a bit of structure */}
      {[
        [-half.x + t, half.y - t, -half.z + t],
        [-half.x + t, half.y - t, half.z - t],
        [half.x - t, half.y - t, -half.z + t],
        [half.x - t, half.y - t, half.z - t],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, 0, z]} scale={[1, 1, 1]} visible={!xray}>
          <boxGeometry args={[t * 1.4, Math.abs(y) * 2 + t, t * 1.4]} />
          <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.6} metalness={0.6} />
        </mesh>
      ))}
    </Part>
  );
}
