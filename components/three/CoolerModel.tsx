'use client';

import type { SceneLayout } from '@/lib/three-layout';
import { EXPLODED_OFFSETS } from '@/lib/three-layout';

import { Fan, PALETTE, Part, RgbSurface } from './shared';

/** Air tower (fins + heatpipes + fan) or AIO (pump block + radiator + fans). */
export function CoolerModel({
  layout,
  name,
  rgb,
}: {
  layout: SceneLayout;
  name: string;
  rgb: boolean;
}) {
  const { cooler } = layout;

  return (
    <Part
      id="cooler"
      label="Cooler"
      caption={name}
      explodedOffset={EXPLODED_OFFSETS.cooler}
      hideKey="cooler"
    >
      {cooler.kind === 'air' ? <AirCooler layout={layout} rgb={rgb} /> : <LiquidCooler layout={layout} rgb={rgb} />}
    </Part>
  );
}

function AirCooler({ layout, rgb }: { layout: SceneLayout; rgb: boolean }) {
  if (layout.cooler.kind !== 'air') return null;
  const { tower, fan } = layout.cooler;
  const [x, y, z] = tower.position;
  const [towerX, towerY, towerZ] = tower.size;

  const finCount = 14;

  return (
    <group>
      {/* Base block */}
      <mesh position={[layout.cpu.position[0] + 0.12, layout.cpu.position[1], layout.cpu.position[2]]}>
        <boxGeometry args={[0.16, 0.5, 0.5]} />
        <meshStandardMaterial color={PALETTE.copper} roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Heatpipes */}
      {[-0.3, -0.1, 0.1, 0.3].map((offset, index) => (
        <mesh
          key={index}
          position={[x - towerX * 0.1, y - towerY * 0.15, z + offset]}
        >
          <cylinderGeometry args={[0.035, 0.035, towerY * 1.05, 12]} />
          <meshStandardMaterial color={PALETTE.copper} roughness={0.25} metalness={0.95} />
        </mesh>
      ))}

      {/* Fin stack */}
      {Array.from({ length: finCount }, (_, index) => (
        <mesh
          key={`fin-${index}`}
          position={[x, y + towerY / 2 - (towerY / finCount) * (index + 0.5), z]}
        >
          <boxGeometry args={[towerX * 0.92, towerY / finCount / 2.4, towerZ]} />
          <meshStandardMaterial color={PALETTE.heatsink} roughness={0.35} metalness={0.9} />
        </mesh>
      ))}

      <Fan
        position={fan.position}
        rotation={fan.rotation}
        radius={fan.radius}
        depth={fan.depth}
        rgb={rgb}
        phase={0.6}
        speed={1.4}
      />

      {rgb ? (
        <RgbSurface
          position={[x + towerX / 2 + 0.02, y + towerY / 2 + 0.03, z]}
          args={[towerX * 0.8, 0.03, towerZ * 0.7]}
          phase={0.9}
        />
      ) : null}
    </group>
  );
}

function LiquidCooler({ layout, rgb }: { layout: SceneLayout; rgb: boolean }) {
  if (layout.cooler.kind !== 'liquid') return null;
  const { pump, radiator, fans } = layout.cooler;
  const [rx, ry, rz] = radiator.position;
  const [, radH, radLength] = radiator.size;

  return (
    <group>
      {/* Pump block */}
      <mesh position={pump.position}>
        <boxGeometry args={pump.size} />
        <meshStandardMaterial color="#1b1f28" roughness={0.4} metalness={0.6} />
      </mesh>
      {rgb ? (
        <RgbSurface
          position={[pump.position[0] + pump.size[0] / 2 + 0.01, pump.position[1], pump.position[2]]}
          args={[0.02, pump.size[1] * 0.7, pump.size[2] * 0.7]}
          phase={0.2}
        />
      ) : null}

      {/* Tubes */}
      {[-0.18, 0.18].map((offset, index) => (
        <mesh
          key={index}
          position={[
            pump.position[0],
            (pump.position[1] + ry) / 2,
            pump.position[2] + offset,
          ]}
        >
          <cylinderGeometry args={[0.055, 0.055, Math.abs(ry - pump.position[1]), 10]} />
          <meshStandardMaterial color="#14171d" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}

      {/* Radiator body + fins */}
      <mesh position={radiator.position}>
        <boxGeometry args={radiator.size} />
        <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.55} metalness={0.7} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh
          key={`radfin-${index}`}
          position={[rx, ry, rz - radLength / 2 + (radLength / 12) * (index + 0.5)]}
        >
          <boxGeometry args={[radiator.size[0] * 0.98, radH * 0.88, radLength / 12 / 2.6]} />
          <meshStandardMaterial color={PALETTE.heatsink} roughness={0.4} metalness={0.85} />
        </mesh>
      ))}

      {fans.map((fan, index) => (
        <Fan
          key={index}
          position={fan.position}
          rotation={fan.rotation}
          radius={fan.radius}
          depth={fan.depth}
          rgb={rgb}
          phase={index * 0.5}
          speed={1.2}
        />
      ))}
    </group>
  );
}
