"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SMAA,
  BrightnessContrast,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import * as THREE from "three";
import { Chip } from "./Chip";
import { useChipStore, PRESETS, type PresetName } from "./store";

// ============================================================
// Camera rig — smoothly interpolates to the active preset
// ============================================================
function CameraRig() {
  const { camera } = useThree();
  const activePreset = useChipStore((s) => s.activePreset);
  const autoRotate = useChipStore((s) => s.autoRotate);
  const targetPos = useRef(new THREE.Vector3().copy(PRESETS.hero.pos));
  const targetLook = useRef(new THREE.Vector3().copy(PRESETS.hero.look));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize camera
  useEffect(() => {
    camera.position.copy(PRESETS.hero.pos);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  // Update targets when preset changes
  useEffect(() => {
    const p = PRESETS[activePreset as PresetName];
    if (p) {
      targetPos.current.copy(p.pos);
      targetLook.current.copy(p.look);
    }
  }, [activePreset]);

  useFrame((_, delta) => {
    const lerpFactor = Math.min(1, delta * 2.4);
    camera.position.lerp(targetPos.current, lerpFactor);
    currentLook.current.lerp(targetLook.current, lerpFactor);
    camera.lookAt(currentLook.current);
  });

  return null;
}

// ============================================================
// Ground — dark reflective floor + grid
// ============================================================
function Ground() {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color={0x04040a}
          roughness={0.55}
          metalness={0.35}
          envMapIntensity={0.3}
        />
      </mesh>
      <gridHelper
        args={[150, 75, 0x141420, 0x0a0a14]}
        position={[0, -0.49, 0]}
      />
    </>
  );
}

// ============================================================
// Studio lighting — key + rim + fill + accent lights
// ============================================================
function StudioLights() {
  const fx = useChipStore((s) => s.fx);
  const qmem = useChipStore((s) => s.qmem);

  // Pulse the qmem lights when fx is on
  const qmemLightRef = useRef<THREE.PointLight>(null);
  const qmemLight2Ref = useRef<THREE.PointLight>(null);
  const yigLightRef = useRef<THREE.PointLight>(null);
  const photonLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (yigLightRef.current) {
      yigLightRef.current.intensity = fx ? 1.5 + Math.sin(t * 2.4) * 0.8 : 0.4;
    }
    if (photonLightRef.current) {
      photonLightRef.current.intensity = fx ? 1.2 + Math.sin(t * 3.1) * 0.6 : 0.3;
    }
    if (qmemLightRef.current) {
      qmemLightRef.current.intensity = qmem ? 1.8 + Math.sin(t * 1.8) * 0.9 : 0.2;
    }
    if (qmemLight2Ref.current) {
      qmemLight2Ref.current.intensity = qmem ? 1.0 + Math.sin(t * 2.2) * 0.5 : 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} color={0x181820} />
      <hemisphereLight intensity={0.5} color={0x3a3a50} groundColor={0x1a0a0e} />

      {/* Key light — top-front, warm white */}
      <directionalLight
        position={[18, 28, 18]}
        intensity={1.4}
        color={0xfff4e6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      {/* Rim light — back-right, AUMNIUM red */}
      <directionalLight
        position={[-22, 12, -20]}
        intensity={1.2}
        color={0xc8102e}
      />
      {/* Fill light — back-left, cool blue */}
      <directionalLight
        position={[-18, 8, 18]}
        intensity={0.6}
        color={0x4a6f9c}
      />
      {/* Bounce — warm from below */}
      <directionalLight
        position={[0, -8, 0]}
        intensity={0.3}
        color={0x3a2010}
      />

      {/* Local point lights for component glow */}
      <pointLight
        ref={yigLightRef}
        position={[-7.5, 2.5, 0]}
        color={0xff4028}
        intensity={2.5}
        distance={18}
        decay={2}
      />
      <pointLight
        ref={photonLightRef}
        position={[-1.5, 1.5, 0]}
        color={0x00d4ff}
        intensity={1.8}
        distance={16}
        decay={2}
      />
      <pointLight
        ref={qmemLightRef}
        position={[-1.5, 2.5, 0]}
        color={0xb060ff}
        intensity={2.0}
        distance={20}
        decay={2}
      />
      <pointLight
        ref={qmemLight2Ref}
        position={[-1.5, 1.6, 0]}
        color={0x30e0ff}
        intensity={1.2}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[4.5, 1.0, 0]}
        color={0xff8030}
        intensity={1.2}
        distance={12}
        decay={2}
      />
      {/* Top white fill */}
      <pointLight
        position={[0, 18, 0]}
        intensity={0.4}
        distance={40}
        decay={2}
        color={0xffffff}
      />
    </>
  );
}

// ============================================================
// Custom procedural environment — studio HDRI built on a canvas
// ============================================================
function CustomEnvironment() {
  // Use drei's Environment with a studio preset (loads from network).
  // We use the "studio" preset to give rich reflections for PBR materials.
  return (
    <Environment
      preset="studio"
      background={false}
      resolution={256}
      frames={1}
    />
  );
}

// ============================================================
// Orbit controls wrapper that respects preset changes & auto-rotate
// ============================================================
function Controls() {
  const autoRotate = useChipStore((s) => s.autoRotate);
  const setAutoRotate = useChipStore((s) => s.set);
  // When user starts interacting, stop auto-rotate
  return (
    <OrbitControls
      enablePan={false}
      enableZoom
      enableRotate
      minDistance={8}
      maxDistance={90}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      target={[0, 0, 0]}
      onStart={() => {
        if (autoRotate) setAutoRotate("autoRotate", false);
      }}
    />
  );
}

// ============================================================
// Main Scene
// ============================================================
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{
        position: [24, 18, 30],
        fov: 36,
        near: 0.1,
        far: 500,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x020208, 1);
      }}
    >
      <fog attach="fog" args={[0x020208, 70, 180]} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Suspense fallback={null}>
        <StudioLights />
        <CustomEnvironment />
        <Chip />
        <Ground />
        <ContactShadows
          position={[0, -0.45, 0]}
          opacity={0.45}
          scale={70}
          blur={3.2}
          far={18}
          color="#000000"
        />
        <Preload all />
      </Suspense>

      <CameraRig />
      <Controls />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.36}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.28}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0005, 0.0005]}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.78} />
        <BrightnessContrast brightness={0.0} contrast={0.05} />
        <HueSaturation saturation={0.05} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
