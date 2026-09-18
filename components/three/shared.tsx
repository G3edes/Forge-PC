'use client';

/**
 * Building blocks shared by every 3D part: the selectable/explodable group
 * wrapper, the RGB-driven material and the generic fan primitive.
 */

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';

import type { Triple } from '@/lib/three-layout';
import { useBuildStore } from '@/store/build-store';
import { useViewerStore, type ViewerSelection } from '@/store/viewer-store';
import type { ComponentCategory } from '@/types/components';

export const PALETTE = {
  chassis: '#1a1e29',
  chassisEdge: '#2a3040',
  glass: '#9fb6d8',
  pcb: '#123024',
  pcbDark: '#0d2019',
  metal: '#7c8494',
  darkMetal: '#3a4152',
  plastic: '#15181f',
  heatsink: '#b9c0cd',
  copper: '#c98a4b',
  gold: '#d6b46a',
  label: '#e8ecf5',
} as const;

const ZERO: Triple = [0, 0, 0];
const tmpColor = new THREE.Color();

/**
 * Animates a material's emissive channel from the build's RGB settings.
 * Reads the store imperatively so lighting changes never re-render the scene.
 */
export function useRgbMaterial(
  ref: React.RefObject<THREE.MeshStandardMaterial | null>,
  phase = 0,
  enabled = true,
) {
  useFrame(({ clock }) => {
    const material = ref.current;
    if (!material) return;

    const rgb = useBuildStore.getState().rgb;
    if (!enabled || !rgb.enabled) {
      material.emissiveIntensity = 0;
      return;
    }

    const time = clock.getElapsedTime();
    let intensity = rgb.intensity;
    tmpColor.set(rgb.color);

    switch (rgb.effect) {
      case 'breathing':
        intensity *= 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 1.5 + phase));
        break;
      case 'pulse':
        intensity *= 0.15 + 0.85 * Math.pow(0.5 + 0.5 * Math.sin(time * 4 + phase), 4);
        break;
      case 'rainbow':
        tmpColor.setHSL((time * 0.11 + phase * 0.09) % 1, 0.85, 0.55);
        break;
      case 'static':
      default:
        break;
    }

    material.emissive.copy(tmpColor);
    material.emissiveIntensity = intensity * 1.7;
  });
}

/** A light-emitting strip/ring driven by the RGB settings. */
export function RgbSurface({
  position,
  rotation,
  args,
  phase = 0,
  geometry = 'box',
  radius = 0.5,
}: {
  position: Triple;
  rotation?: Triple;
  args?: Triple;
  phase?: number;
  geometry?: 'box' | 'ring';
  radius?: number;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  useRgbMaterial(materialRef, phase);

  return (
    <mesh position={position} rotation={rotation}>
      {geometry === 'box' ? (
        <boxGeometry args={args ?? [0.1, 0.1, 0.1]} />
      ) : (
        <torusGeometry args={[radius, 0.035, 8, 32]} />
      )}
      <meshStandardMaterial
        ref={materialRef}
        color="#0a0c12"
        emissive="#000000"
        emissiveIntensity={0}
        roughness={0.35}
        metalness={0.1}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Generic case/cooler/GPU fan: hub, blades and an optional RGB ring.
 * The airflow axis is +Y by default; callers rotate it into place
 * (front/rear mounts use `rotation={[Math.PI / 2, 0, 0]}`).
 */
export function Fan({
  position,
  rotation = ZERO,
  radius,
  depth,
  rgb = false,
  phase = 0,
  speed = 1,
  blades = 9,
}: {
  position: Triple;
  rotation?: Triple;
  radius: number;
  depth: number;
  rgb?: boolean;
  phase?: number;
  speed?: number;
  blades?: number;
}) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.y += delta * speed * 2.4;
    }
  });

  const bladeGeometry = useMemo(
    () => new THREE.BoxGeometry(radius * 0.86, depth * 0.22, radius * 0.34),
    [radius, depth],
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[radius * 2, depth, radius * 2]} />
        <meshStandardMaterial color={PALETTE.plastic} roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Bore */}
      <mesh>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, depth * 1.02, 28]} />
        <meshStandardMaterial color="#0a0c11" roughness={0.9} />
      </mesh>

      <group ref={bladesRef}>
        <mesh>
          <cylinderGeometry args={[radius * 0.3, radius * 0.3, depth * 0.5, 20]} />
          <meshStandardMaterial color="#23272f" roughness={0.6} metalness={0.3} />
        </mesh>
        {Array.from({ length: blades }, (_, index) => {
          const angle = (index / blades) * Math.PI * 2;
          return (
            <mesh
              key={index}
              geometry={bladeGeometry}
              position={[Math.cos(angle) * radius * 0.48, 0, Math.sin(angle) * radius * 0.48]}
              rotation={[0, -angle, 0.38]}
            >
              <meshStandardMaterial
                color="#2e333d"
                roughness={0.5}
                metalness={0.2}
                transparent
                opacity={0.92}
              />
            </mesh>
          );
        })}
      </group>

      {rgb ? (
        <RgbSurface
          geometry="ring"
          radius={radius * 0.82}
          position={[0, depth * 0.52, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          phase={phase}
        />
      ) : null}
    </group>
  );
}

interface PartProps {
  id: ViewerSelection;
  label: string;
  /** Sub-label shown in the in-scene tag, usually the part name. */
  caption?: string;
  explodedOffset: Triple;
  children: ReactNode;
  /** Categories can be hidden from the viewer; `case` uses its own toggle. */
  hideKey?: ComponentCategory;
}

/**
 * Wraps one logical part of the PC. Handles the exploded-view animation,
 * hover/click selection, the selection outline and the floating label.
 */
export function Part({ id, label, caption, explodedOffset, children, hideKey }: PartProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [bounds, setBounds] = useState<{ center: Triple; size: Triple } | null>(null);

  const selected = useViewerStore((state) => state.selected === id);
  const select = useViewerStore((state) => state.select);
  const hidden = useViewerStore((state) =>
    hideKey ? state.hidden.includes(hideKey) : false,
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const exploded = useViewerStore.getState().exploded;
    const target = exploded ? explodedOffset : ZERO;
    const lambda = 3.2;
    group.position.x = THREE.MathUtils.damp(group.position.x, target[0], lambda, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, target[1], lambda, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target[2], lambda, delta);
  });

  const outlineGeometry = useMemo(() => {
    if (!bounds) return null;
    const box = new THREE.BoxGeometry(
      Math.max(bounds.size[0], 0.05) * 1.04,
      Math.max(bounds.size[1], 0.05) * 1.04,
      Math.max(bounds.size[2], 0.05) * 1.04,
    );
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [bounds]);

  const measure = () => {
    const inner = innerRef.current;
    const group = groupRef.current;
    if (!inner || !group) return;
    const box = new THREE.Box3().setFromObject(inner);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    group.worldToLocal(center);
    setBounds({ center: [center.x, center.y, center.z], size: [size.x, size.y, size.z] });
  };

  if (hidden) return null;

  const active = selected || hovered;

  return (
    <group ref={groupRef}>
      <group
        ref={innerRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          measure();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(event) => {
          event.stopPropagation();
          measure();
          select(id);
        }}
      >
        {children}
      </group>

      {active && outlineGeometry && bounds ? (
        <lineSegments position={bounds.center} geometry={outlineGeometry} renderOrder={2}>
          <lineBasicMaterial
            color={selected ? '#7c5cff' : '#5d647a'}
            transparent
            opacity={selected ? 0.95 : 0.5}
            depthTest={false}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}

      {selected && bounds ? (
        <Html
          position={[bounds.center[0], bounds.center[1] + bounds.size[1] / 2 + 0.22, bounds.center[2]]}
          center
          distanceFactor={9}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-md border border-accent/50 bg-void/90 px-2 py-1 text-center backdrop-blur">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-soft">
              {label}
            </div>
            {caption ? <div className="text-[10px] text-ink">{caption}</div> : null}
          </div>
        </Html>
      ) : null}
    </group>
  );
}
