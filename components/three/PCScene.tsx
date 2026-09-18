'use client';

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';

import { computeLayout } from '@/lib/three-layout';
import { useViewerStore } from '@/store/viewer-store';
import type { BuildSelection } from '@/types/build';

import { CablesModel } from './CablesModel';
import { CaseFansModel } from './CaseFansModel';
import { CaseModel } from './CaseModel';
import { CoolerModel } from './CoolerModel';
import { CpuModel } from './CpuModel';
import { GpuModel } from './GpuModel';
import { MotherboardModel } from './MotherboardModel';
import { PsuModel } from './PsuModel';
import { RamModel } from './RamModel';
import { StorageModel } from './StorageModel';

type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

function CameraRig({
  home,
  target,
}: {
  home: [number, number, number];
  target: [number, number, number];
}) {
  const controlsRef = useRef<OrbitControlsRef>(null);
  const resetToken = useViewerStore((state) => state.cameraResetToken);
  const autoRotate = useViewerStore((state) => state.autoRotate);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...home);
    controls.target.set(...target);
    controls.update();
    // `home` is stable per case size; resetToken forces a re-run on demand.
  }, [resetToken, home, target]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={home} near={0.1} far={100} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minDistance={2.2}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.92}
      />
    </>
  );
}

function SceneContents({ build }: { build: BuildSelection }) {
  const layout = useMemo(() => computeLayout(build), [build]);
  const showCables = useViewerStore((state) => state.showCables);

  const home = useMemo<[number, number, number]>(() => {
    const [width, height, depth] = layout.caseSize;
    const radius = Math.max(width, height, depth);
    return [radius * 1.25, radius * 0.55, radius * 1.4];
  }, [layout.caseSize]);

  const target = useMemo<[number, number, number]>(() => [0, 0, 0], []);

  return (
    <>
      <CameraRig home={home} target={target} />

      {/* Key / fill / rim rig. Bright enough to read the chassis, dim enough
          that the RGB accents still stand out. */}
      <ambientLight intensity={1.1} />
      <hemisphereLight args={['#9fb6d8', '#0a0c14', 0.9]} />
      <directionalLight position={[7, 9, 7]} intensity={2.6} castShadow />
      <directionalLight position={[-6, 4, -5]} intensity={0.9} color="#8ea2ff" />
      <pointLight position={[3, 1.5, 4]} intensity={18} distance={14} color="#ffffff" />
      <pointLight position={[-2, -1, 3]} intensity={8} distance={9} color="#22d3ee" />

      {/* Procedural environment: no external HDRI download, works offline. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -4]} scale={[12, 5, 1]} color="#9fb0ff" />
        <Lightformer form="rect" intensity={2} position={[6, 2, 4]} scale={[8, 5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.1} position={[-6, 1, 3]} scale={[8, 5, 1]} color="#22d3ee" />
        <Lightformer form="ring" intensity={1.4} position={[0, 6, 2]} scale={6} color="#ffffff" />
      </Environment>

      <group>
        <CaseModel layout={layout} name={build.case?.name ?? 'Gabinete padrão (pré-visualização)'} />

        {build.motherboard ? (
          <MotherboardModel
            layout={layout}
            name={build.motherboard.name}
            rgb={build.motherboard.specifications.rgb}
          />
        ) : null}

        {build.cpu ? <CpuModel layout={layout} name={build.cpu.name} /> : null}

        {build.cooler ? (
          <CoolerModel
            layout={layout}
            name={build.cooler.name}
            rgb={build.cooler.specifications.rgb}
          />
        ) : null}

        {build.ram ? (
          <RamModel layout={layout} name={build.ram.name} rgb={build.ram.specifications.rgb} />
        ) : null}

        {build.gpu ? (
          <GpuModel layout={layout} name={build.gpu.name} rgb={build.gpu.specifications.rgb} />
        ) : null}

        {build.psu ? <PsuModel layout={layout} name={build.psu.name} /> : null}

        {build.storage ? <StorageModel layout={layout} name={build.storage.name} /> : null}

        {build.fans.length > 0 ? (
          <CaseFansModel
            layout={layout}
            name={build.fans.map((fan) => `${fan.quantity}x ${fan.component.name}`).join(' + ')}
            rgb={build.fans.some((fan) => fan.component.specifications.rgb)}
          />
        ) : null}

        {showCables ? <CablesModel layout={layout} /> : null}
      </group>

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -layout.caseHalf.y - 0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#070910" roughness={0.95} metalness={0.1} />
      </mesh>

      <ContactShadows
        position={[0, -layout.caseHalf.y - 0.015, 0]}
        opacity={0.55}
        scale={14}
        blur={2.4}
        far={5}
        resolution={512}
        color="#000000"
      />
    </>
  );
}

/** The R3F canvas. Rendered client-side only (see `Viewer3D`). */
export default function PCScene({ build }: { build: BuildSelection }) {
  const select = useViewerStore((state) => state.select);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // Clicking empty space clears the selection.
      onPointerMissed={() => select(null)}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#070910']} />
      <fog attach="fog" args={['#070910', 12, 30]} />
      <SceneContents build={build} />
    </Canvas>
  );
}
