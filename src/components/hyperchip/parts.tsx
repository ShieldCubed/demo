"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  makePcbColorMap,
  makePcbNormalMap,
  makePcbRoughnessMap,
  makeBrushedNormalMap,
  makeBrushedRoughnessMap,
  makeGoldNormalMap,
  makeCeramicNormalMap,
  makeSiliconColorMap,
  makeIridescenceMap,
  makeTextTexture,
} from "./textures";

// Shared colours (hex)
export const COLORS = {
  pcb: 0x0a1a14,
  pcbTrace: 0x1a4838,
  gold: 0xd4af37,
  goldDark: 0x8a6f1f,
  bracket: 0xc0c4cc,
  bracketDark: 0x6a6e74,
  muMetal: 0xa0a8b0,
  muMetalDark: 0x4a525a,
  yigBase: 0x1a0508,
  yigGlow: 0xff3030,
  photonSub: 0x0e1620,
  photonGlow: 0x00d4ff,
  cmosTop: 0x1a1a20,
  cmosTrim: 0xffcc55,
  laserBase: 0x14080a,
  laserDot: 0xff8030,
  fiberBody: 0x1a2028,
  fiberTip: 0xfff0a0,
  qmemBase: 0x0e0618,
  qmemGlow: 0xb060ff,
  qmemCyan: 0x30e0ff,
};

// ============================================================
// 1. PCB — fibreglass carrier with copper traces, SMD, vias, holes
// ============================================================
export function PCB() {
  const pcbNormal = useMemo(() => makePcbNormalMap([6, 3]), []);
  const pcbRough = useMemo(() => makePcbRoughnessMap([6, 3]), []);
  const pcbColor = useMemo(() => makePcbColorMap([6, 3]), []);
  const silkTex = useMemo(
    () => makeTextTexture("// AGH-Ω01-MPX  ·  REV. α  ·  AUMNIUM", "#e6e6ee", "rgba(0,0,0,0)", 512, 32),
    [],
  );
  const markTex = useMemo(
    () => makeTextTexture("AUMNIUM", "#c8102e", "rgba(0,0,0,0)", 256, 48, true),
    [],
  );

  // Pre-generate SMD layout
  const smdLayout = useMemo(() => {
    const arr: { x: number; z: number; w: number; d: number; cap: boolean }[] = [];
    for (let i = 0; i < 36; i++) {
      const isCap = i % 4 === 0;
      const lane = i < 12 ? -4.2 : i < 24 ? 4.2 : 0;
      const x = -12 + (i % 12) * 2.2;
      arr.push({
        x,
        z: lane + (i >= 24 ? (Math.floor((i - 24) / 4) - 1.5) * 0.6 : 0),
        w: isCap ? 0.55 : 0.32,
        d: isCap ? 0.28 : 0.18,
        cap: isCap,
      });
    }
    return arr;
  }, []);

  const tracePaths = useMemo(() => {
    const arr: THREE.Vector3[][] = [];
    for (let i = 0; i < 14; i++) {
      const z = -4.8 + i * 0.75;
      arr.push([
        new THREE.Vector3(-13, 0.21, z),
        new THREE.Vector3(-3 + Math.random() * 2, 0.21, z),
        new THREE.Vector3(Math.random() * 2, 0.21, z + 0.2),
        new THREE.Vector3(13, 0.21, z + 0.2),
      ]);
    }
    return arr;
  }, []);

  return (
    <group>
      {/* PCB substrate — rounded edges for realism */}
      <RoundedBox
        args={[26.7, 0.4, 11.1]}
        radius={0.04}
        smoothness={3}
        receiveShadow
        castShadow
        position={[0, -0.2, 0]}
      >
        <meshPhysicalMaterial
          color={COLORS.pcb}
          map={pcbColor}
          normalMap={pcbNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughnessMap={pcbRough}
          roughness={0.78}
          metalness={0.1}
          clearcoat={0.25}
          clearcoatRoughness={0.7}
          envMapIntensity={0.6}
        />
      </RoundedBox>

      {/* Silkscreen text on top of PCB */}
      <mesh position={[-9, 0.008, -4.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 0.5]} />
        <meshBasicMaterial map={silkTex} transparent />
      </mesh>
      <mesh position={[8.5, 0.008, 4.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.7]} />
        <meshBasicMaterial map={markTex} transparent />
      </mesh>

      {/* Copper traces as raised lines */}
      {tracePaths.map((pts, i) => (
        <line key={`trace-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={0x2a5a48} transparent opacity={0.55} />
        </line>
      ))}

      {/* SMD components — capacitors (tan) and resistors (black) */}
      {smdLayout.map((s, i) => (
        <RoundedBox
          key={`smd-${i}`}
          args={[s.w, 0.14, s.d]}
          radius={0.02}
          smoothness={2}
          position={[s.x, 0.09, s.z]}
          castShadow
        >
          {s.cap ? (
            <meshPhysicalMaterial
              color={0xc8b48a}
              metalness={0.75}
              roughness={0.32}
              clearcoat={0.6}
              envMapIntensity={1.0}
            />
          ) : (
            <meshPhysicalMaterial
              color={0x14141a}
              metalness={0.35}
              roughness={0.45}
              clearcoat={0.4}
              envMapIntensity={0.5}
            />
          )}
        </RoundedBox>
      ))}

      {/* Mounting holes — gold-plated rings with black barrels */}
      {[
        [-13.0, -5.3],
        [13.0, -5.3],
        [-13.0, 5.3],
        [13.0, 5.3],
      ].map(([x, z], i) => (
        <group key={`hole-${i}`} position={[x, 0, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.45, 24]} />
            <meshPhysicalMaterial
              color={COLORS.gold}
              metalness={1.0}
              roughness={0.22}
              clearcoat={1.0}
              envMapIntensity={1.5}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.5, 24]} />
            <meshStandardMaterial color={0x000000} roughness={0.6} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================
// 2. Gold Fingers — PCIe edge contacts
// ============================================================
export function GoldFingers() {
  const goldNormal = useMemo(() => makeGoldNormalMap([16, 1]), []);
  const goldMat = (
    <meshPhysicalMaterial
      color={COLORS.gold}
      metalness={1.0}
      roughness={0.18}
      clearcoat={1.0}
      clearcoatRoughness={0.08}
      normalMap={goldNormal}
      normalScale={new THREE.Vector2(0.3, 0.3)}
      envMapIntensity={2.0}
      emissive={0x1a1204}
      emissiveIntensity={0.18}
    />
  );

  return (
    <group>
      {/* Base strip under fingers */}
      <mesh position={[0, -0.21, 5.05]} castShadow>
        <boxGeometry args={[20, 0.42, 1.0]} />
        <meshPhysicalMaterial
          color={COLORS.goldDark}
          metalness={0.85}
          roughness={0.32}
          clearcoat={0.5}
          envMapIntensity={1.0}
        />
      </mesh>
      {/* 64 individual fingers */}
      {Array.from({ length: 64 }, (_, i) => (
        <mesh
          key={`finger-${i}`}
          position={[-9.5 + i * 0.3, -0.2, 5.05]}
          castShadow
          material={undefined}
        >
          <boxGeometry args={[0.18, 0.45, 0.85]} />
          {goldMat}
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// 3. PCIe bracket — stainless steel with fiber ports
// ============================================================
export function Bracket() {
  const brushedN = useMemo(() => makeBrushedNormalMap([1, 2], "v"), []);
  const brushedR = useMemo(() => makeBrushedRoughnessMap([1, 2]), []);
  return (
    <group>
      <RoundedBox
        args={[0.4, 1.6, 11.5]}
        radius={0.04}
        smoothness={2}
        position={[13.5, 0.5, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={COLORS.bracket}
          metalness={0.95}
          roughness={0.3}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
          normalMap={brushedN}
          roughnessMap={brushedR}
          envMapIntensity={1.2}
        />
      </RoundedBox>
      {/* Fiber ports — black anodized cylinders */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`port-${i}`} position={[13.5, 0.5, -3.5 + i * 1.0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.55, 20]} />
            <meshPhysicalMaterial
              color={0x080810}
              metalness={0.7}
              roughness={0.4}
              clearcoat={0.6}
              envMapIntensity={0.8}
            />
          </mesh>
          {/* Inner bore */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
            <meshStandardMaterial color={0x000000} roughness={1.0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================
// 4. YIG Magnonic Core — μ-metal can with glowing YIG film
// ============================================================
export function YIGCore({
  cutaway,
  fx,
  explodeAmt: explodeAmtProp = 0,
}: {
  cutaway: boolean;
  fx: boolean;
  explodeAmt?: number;
}) {
  const filmRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const brushedN = useMemo(() => makeBrushedNormalMap([2, 1], "h"), []);
  const ceramicN = useMemo(() => makeCeramicNormalMap([2, 1]), []);

  const w = 4.5, d = 3.5, h = 1.4, wallT = 0.2;
  // Local explode amount — animated toward the boolean target
  const explodeAmtRef = useRef(explodeAmtProp);

  useFrame((state, delta) => {
    const target = explodeAmtProp;
    if (Math.abs(explodeAmtRef.current - target) > 0.001) {
      explodeAmtRef.current += (target - explodeAmtRef.current) * Math.min(1, delta * 2.4);
    } else {
      explodeAmtRef.current = target;
    }
    const explodeAmt = explodeAmtRef.current;
    const t = state.clock.getElapsedTime();
    if (filmRef.current) {
      const mat = filmRef.current.material as THREE.MeshStandardMaterial;
      const pulse = fx ? 1.6 + Math.sin(t * 2.4) * 0.8 + Math.sin(t * 4.1) * 0.25 : 0.7;
      mat.emissiveIntensity = pulse;
      filmRef.current.position.y = h - 0.2 + explodeAmt * 1.6;
    }
    if (ringsRef.current) {
      ringsRef.current.position.y = h - 0.05 + explodeAmt * 1.7;
      if (fx) {
        ringsRef.current.children.forEach((ring, idx) => {
          const phase = (t * 0.7 + idx * 0.33) % 1.0;
          const scale = 0.4 + phase * 1.6;
          ring.scale.setScalar(scale);
          const m = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
          m.opacity = (1 - phase) * 0.6;
        });
      }
    }
  });

  return (
    <group position={[-7.5, 0, 0]}>
      {/* μ-metal base */}
      {!cutaway && (
        <mesh position={[0, wallT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, wallT, d]} />
          <meshPhysicalMaterial
            color={COLORS.muMetal}
            metalness={0.96}
            roughness={0.22}
            clearcoat={0.7}
            clearcoatRoughness={0.18}
            normalMap={brushedN}
            normalScale={new THREE.Vector2(0.3, 0.3)}
            envMapIntensity={1.5}
          />
        </mesh>
      )}
      {/* Walls — hidden when cutaway is on */}
      {!cutaway &&
        [
          [w / 2 - wallT / 2, h / 2, 0],
          [-(w / 2 - wallT / 2), h / 2, 0],
        ].map(([x, y, z], i) => (
          <mesh key={`wall-x-${i}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[wallT, h, d]} />
            <meshPhysicalMaterial
              color={COLORS.muMetal}
              metalness={0.96}
              roughness={0.24}
              clearcoat={0.7}
              envMapIntensity={1.4}
              normalMap={brushedN}
              normalScale={new THREE.Vector2(0.25, 0.25)}
            />
          </mesh>
        ))}
      {!cutaway &&
        [
          [0, h / 2, d / 2 - wallT / 2],
          [0, h / 2, -(d / 2 - wallT / 2)],
        ].map(([x, y, z], i) => (
          <mesh key={`wall-z-${i}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, wallT]} />
            <meshPhysicalMaterial
              color={COLORS.muMetal}
              metalness={0.96}
              roughness={0.24}
              clearcoat={0.7}
              envMapIntensity={1.4}
              normalMap={brushedN}
              normalScale={new THREE.Vector2(0.25, 0.25)}
            />
          </mesh>
        ))}

      {/* YIG film — glowing red magnonic substrate */}
      <mesh ref={filmRef} position={[0, h - 0.2, 0]} castShadow>
        <boxGeometry args={[w - 0.6, 0.18, d - 0.6]} />
        <meshStandardMaterial
          color={COLORS.yigBase}
          emissive={COLORS.yigGlow}
          emissiveIntensity={2.0}
          metalness={0.3}
          roughness={0.35}
          envMapIntensity={0.5}
          normalMap={ceramicN}
          normalScale={new THREE.Vector2(0.4, 0.4)}
        />
      </mesh>

      {/* Pulse rings */}
      <group ref={ringsRef} position={[0, h - 0.05, 0]}>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={`ring-${i}`} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4 + i * 0.5, 0.5 + i * 0.5, 48]} />
            <meshBasicMaterial
              color={0xff8030}
              transparent
              opacity={0.5 - i * 0.13}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Glow trim line at base */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[w + 0.05, 0.05, d + 0.05]} />
        <meshBasicMaterial color={COLORS.yigGlow} />
      </mesh>

      {/* YIG point light */}
      <pointLight
        position={[0, 1.0, 0]}
        color={0xff4028}
        intensity={2.5}
        distance={18}
        decay={2}
      />
    </group>
  );
}

// ============================================================
// 5. Photonic Mesh — Si3N4 waveguides on glass substrate
// ============================================================
export function PhotonicMesh({ fx }: { fx: boolean }) {
  const pulsesRef = useRef<
    { mesh: THREE.Mesh; t: number; speed: number; start: THREE.Vector3; end: THREE.Vector3 }[]
  >([]);
  const pulsesInit = useRef(false);

  const guides = useMemo(() => {
    const arr: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const numLanes = 10;
    for (let i = 0; i < numLanes; i++) {
      const z = -1.7 + i * (3.4 / (numLanes - 1));
      arr.push({
        start: new THREE.Vector3(-3.3, 0.4, z),
        end: new THREE.Vector3(3.3, 0.4, z),
      });
    }
    return arr;
  }, []);

  // Initialize pulse meshes after mount
  const pulseMeshes = useMemo(() => {
    return guides.flatMap((path, idx) =>
      Array.from({ length: 3 }, (_, p) => ({
        path,
        t0: p / 3 + (idx % 2) * 0.18,
        speed: 0.16 + Math.random() * 0.04,
        idx,
      })),
    );
  }, [guides]);

  useFrame((state, delta) => {
    if (!fx) return;
    pulsesRef.current.forEach((p) => {
      p.t += delta * p.speed * 2.0;
      if (p.t > 1) p.t -= 1;
      p.mesh.position.lerpVectors(p.start, p.end, p.t);
      p.mesh.position.x -= 1.5; // offset because group is at -1.5
    });
  });

  return (
    <group position={[-1.5, 0, 0]}>
      {/* Substrate — semi-transparent silicon nitride on glass */}
      <RoundedBox
        args={[7, 0.32, 4]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.16, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={0x0a1620}
          metalness={0.05}
          roughness={0.03}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          transmission={1.0}
          thickness={3.0}
          ior={2.0}
          attenuationColor={0x104060}
          attenuationDistance={4.0}
          specularIntensity={1.0}
          envMapIntensity={2.2}
          reflectivity={0.5}
        />
      </RoundedBox>

      {/* Waveguides — emissive cyan Si3N4 cores */}
      {guides.map((g, i) => (
        <mesh key={`wg-${i}`} position={[0, 0.34, g.start.z]}>
          <boxGeometry args={[6.6, 0.04, 0.05]} />
          <meshBasicMaterial color={COLORS.photonGlow} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Cross waveguides */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = -2.7 + i * 0.9;
        return (
          <mesh key={`xwg-${i}`} position={[x, 0.38, 0]}>
            <boxGeometry args={[0.045, 0.035, 3.5]} />
            <meshBasicMaterial color={COLORS.photonGlow} transparent opacity={0.85} />
          </mesh>
        );
      })}

      {/* Photonic pulses — travelling light spheres */}
      {pulseMeshes.map((p, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => {
            if (el && !pulsesInit.current) {
              pulsesRef.current.push({
                mesh: el,
                t: p.t0,
                speed: p.speed,
                start: p.path.start,
                end: p.path.end,
              });
            }
          }}
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={0xa0f0ff} transparent opacity={0.95} />
        </mesh>
      ))}

      {/* Coupling dots */}
      {Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (
          <mesh
            key={`dot-${i}-${j}`}
            position={[-2.5 + i * 1.0, 0.36, -1.5 + j * 1.0]}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={0xff8030} />
          </mesh>
        )),
      )}

      <pointLight
        position={[0, 1.0, 0]}
        color={0x00d4ff}
        intensity={1.8}
        distance={16}
        decay={2}
      />
    </group>
  );
}

// ============================================================
// 6. CMOS PLL Driver — ceramic package with silicon die
// ============================================================
export function CMOS() {
  const siliconTex = useMemo(() => makeSiliconColorMap(), []);
  const ceramicN = useMemo(() => makeCeramicNormalMap([1, 1]), []);
  return (
    <group position={[4.5, 0, -1.5]}>
      {/* Ceramic package base */}
      <RoundedBox
        args={[2.2, 0.45, 1.6]}
        radius={0.03}
        smoothness={2}
        position={[0, 0.225, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={COLORS.cmosTop}
          metalness={0.25}
          roughness={0.55}
          clearcoat={0.5}
          clearcoatRoughness={0.4}
          normalMap={ceramicN}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          envMapIntensity={0.8}
        />
      </RoundedBox>
      {/* Silicon die top */}
      <mesh position={[0, 0.465, 0]}>
        <boxGeometry args={[1.6, 0.02, 1.1]} />
        <meshPhysicalMaterial
          map={siliconTex}
          metalness={0.4}
          roughness={0.25}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Trim accent line */}
      <mesh position={[0, 0.46, 0.5]}>
        <boxGeometry args={[2.0, 0.02, 0.18]} />
        <meshBasicMaterial color={COLORS.cmosTrim} />
      </mesh>
      {/* Solder balls (BGA) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`ball-${i}`} position={[-1.0 + i * 0.28, 0.02, 0.7]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial
            color={0xc0c0c8}
            metalness={0.85}
            roughness={0.28}
            clearcoat={0.6}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// 7. DFB Lasers — emissive laser dots with halos
// ============================================================
export function Lasers({ fx }: { fx: boolean }) {
  const lasersRef = useRef<
    { dot: THREE.Mesh; halo: THREE.Mesh; phase: number }[]
  >([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    lasersRef.current.forEach((l) => {
      if (!l.dot || !l.halo) return;
      const v = fx ? 0.7 + Math.sin(t * 6 + l.phase) * 0.3 : 0.4;
      const dotMat = l.dot.material as THREE.MeshBasicMaterial;
      dotMat.opacity = v;
      dotMat.transparent = true;
      const haloMat = l.halo.material as THREE.MeshBasicMaterial;
      haloMat.opacity = (1 - v) * 0.5 + 0.2;
      l.halo.scale.setScalar(0.9 + (1 - v) * 0.5);
    });
  });

  return (
    <group position={[4.5, 0, 1.5]}>
      <RoundedBox
        args={[2.2, 0.45, 1.6]}
        radius={0.03}
        smoothness={2}
        position={[0, 0.225, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={COLORS.laserBase}
          metalness={0.55}
          roughness={0.4}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          envMapIntensity={1.0}
        />
      </RoundedBox>
      {Array.from({ length: 8 }, (_, i) => {
        const x = -0.85 + i * 0.24;
        return (
          <group key={`laser-${i}`}>
            <mesh
              position={[x, 0.46, 0]}
              ref={(el) => {
                if (el) {
                  while (lasersRef.current.length <= i) lasersRef.current.push({} as never);
                  lasersRef.current[i] = {
                    ...(lasersRef.current[i] || {}),
                    dot: el,
                    phase: i * 0.34,
                  } as never;
                }
              }}
            >
              <sphereGeometry args={[0.09, 14, 14]} />
              <meshBasicMaterial color={COLORS.laserDot} />
            </mesh>
            <mesh
              position={[x, 0.47, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              ref={(el) => {
                if (el && lasersRef.current[i]) {
                  lasersRef.current[i].halo = el;
                }
              }}
            >
              <ringGeometry args={[0.1, 0.16, 24]} />
              <meshBasicMaterial color={0xff6020} transparent opacity={0.55} />
            </mesh>
          </group>
        );
      })}
      <pointLight
        position={[0, 0.6, 0]}
        color={0xff8030}
        intensity={1.2}
        distance={12}
        decay={2}
      />
    </group>
  );
}

// ============================================================
// 8. Fiber Couplers — black cylinders with glowing tips + beams
// ============================================================
export function FiberCouplers({ fx }: { fx: boolean }) {
  const beamsRef = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    if (!fx) return;
    const t = state.clock.getElapsedTime();
    beamsRef.current.forEach((beam, i) => {
      if (!beam) return;
      const v = 0.32 + Math.sin(t * 3 + i * 0.7) * 0.1;
      const m = beam.material as THREE.MeshBasicMaterial;
      m.opacity = v;
    });
  });

  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => {
        const z = -3.5 + i * 1.0;
        return (
          <group key={`fiber-${i}`}>
            <mesh
              position={[11.6, 0.2, z]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.18, 0.18, 1.1, 20]} />
              <meshPhysicalMaterial
                color={COLORS.fiberBody}
                metalness={0.7}
                roughness={0.3}
                clearcoat={0.7}
                envMapIntensity={1.0}
              />
            </mesh>
            <mesh position={[12.3, 0.2, z]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.04, 0.25, 16]} />
              <meshBasicMaterial color={0xffcc70} transparent opacity={0.85} />
            </mesh>
            <mesh
              position={[14.5, 0.2, z]}
              rotation={[0, 0, -Math.PI / 2]}
              ref={(el) => {
                if (el) beamsRef.current[i] = el;
              }}
            >
              <cylinderGeometry args={[0.04, 0.16, 4.0, 16]} />
              <meshBasicMaterial color={0xffa040} transparent opacity={0.32} />
            </mesh>
            {/* Feed line back to chip */}
            <mesh position={[7, 0.42, z]}>
              <boxGeometry args={[8.5, 0.04, 0.05]} />
              <meshBasicMaterial color={0xff8030} transparent opacity={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================================
// 9. Quantum Memory Layer — iridescent persistent substrate
// ============================================================
export function QuantumMemoryLayer({
  qmem,
  fx,
}: {
  qmem: boolean;
  fx: boolean;
}) {
  const subRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const scarsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const iridMap = useMemo(() => makeIridescenceMap(), []);

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.random() * 2.8,
        speed: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        baseY: 0.09 + Math.random() * 0.04,
      })),
    [],
  );

  const scarPaths = useMemo(
    () => [
      [
        [-2.6, -1.2],
        [-1.2, -0.4],
        [0, 0],
        [1.2, 0.4],
        [2.6, 1.2],
      ],
      [
        [-2.6, 1.2],
        [-1.2, 0.4],
        [0, 0],
        [1.2, -0.4],
        [2.6, -1.2],
      ],
      [
        [-2.6, 0],
        [0, 0],
        [2.6, 0],
      ],
      [
        [0, -1.6],
        [0, 0],
        [0, 1.6],
      ],
    ],
    [],
  );

  useFrame((state, delta) => {
    if (!qmem) return;
    const t = state.clock.getElapsedTime();
    if (subRef.current) {
      const mat = subRef.current.material as THREE.MeshStandardMaterial;
      const pulse = fx ? 0.85 + 0.25 * Math.sin(t * 1.6) + 0.1 * Math.sin(t * 3.7) : 0.6;
      mat.emissiveIntensity = pulse;
    }
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const phase = (t * 0.3 + i * 0.25) % 1.0;
        const scale = 0.7 + phase * 0.6;
        ring.scale.setScalar(scale);
        const m = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.15 + (1 - phase) * 0.25;
      });
    }
    if (scarsRef.current && fx) {
      scarsRef.current.children.forEach((scar, i) => {
        const m = (scar as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.2 + i));
      });
    }
    if (particlesRef.current) {
      particlesRef.current.children.forEach((p, i) => {
        const d = particles[i];
        if (!d) return;
        d.angle += delta * d.speed * 0.4;
        const wobble = Math.sin(t * 0.8 + d.phase) * 0.15;
        p.position.x = Math.cos(d.angle) * (d.r + wobble);
        p.position.z = Math.sin(d.angle) * (d.r + wobble);
        p.position.y = d.baseY + Math.sin(t * 1.5 + d.phase) * 0.03;
        const m = (p as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.6 + 0.35 * Math.sin(t * 2 + d.phase);
      });
    }
    if (coreRef.current) {
      const s = 1.0 + 0.15 * Math.sin(t * 2.5);
      coreRef.current.scale.setScalar(s);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.8;
      const m = haloRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + 0.2 * Math.sin(t * 1.5);
    }
  });

  if (!qmem) return null;

  return (
    <group position={[-1.5, 0.9, 0]}>
      {/* Iridescent substrate */}
      <mesh ref={subRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.1, 3.6]} />
        <meshPhysicalMaterial
          color={COLORS.qmemBase}
          metalness={0.4}
          roughness={0.12}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.55}
          thickness={0.8}
          ior={1.6}
          iridescence={1.0}
          iridescenceThicknessMinimum={100}
          iridescenceThicknessMaximum={800}
          emissive={0x2a0e4a}
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
          envMapIntensity={1.5}
          map={iridMap}
        />
      </mesh>

      {/* Concentric birthmark rings */}
      <group ref={ringsRef} position={[0, 0.06, 0]}>
        {Array.from({ length: 5 }, (_, i) => {
          const r = 0.6 + i * 0.55;
          return (
            <mesh key={`qring-${i}`} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r, r + 0.08, 64]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? COLORS.qmemGlow : COLORS.qmemCyan}
                transparent
                opacity={0.35 - i * 0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>

      {/* Bow-tie quantum scar paths */}
      <group ref={scarsRef} position={[0, 0.07, 0]}>
        {scarPaths.map((path, i) => (
          <line key={`scar-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array(path.flatMap(([x, z]) => [x, 0, z])),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={COLORS.qmemGlow} transparent opacity={0.55} />
          </line>
        ))}
      </group>

      {/* Orbiting persistent particles */}
      <group ref={particlesRef}>
        {particles.map((_, i) => (
          <mesh
            key={`qp-${i}`}
            position={[
              Math.cos(particles[i].angle) * particles[i].r,
              particles[i].baseY,
              Math.sin(particles[i].angle) * particles[i].r,
            ]}
          >
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color={COLORS.qmemCyan} transparent opacity={0.95} />
          </mesh>
        ))}
      </group>

      {/* Memory core */}
      <mesh ref={coreRef} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {/* Halo */}
      <mesh ref={haloRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.42, 48]} />
        <meshBasicMaterial
          color={COLORS.qmemGlow}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        position={[0, 1.0, 0]}
        color={COLORS.qmemGlow}
        intensity={2.0}
        distance={20}
        decay={2}
      />
      <pointLight
        position={[0, 0.4, 0]}
        color={COLORS.qmemCyan}
        intensity={1.2}
        distance={16}
        decay={2}
      />
    </group>
  );
}

// ============================================================
// 10. Heatspreader — anisotropic brushed metal fins + heat pipes
// ============================================================
export function Heatspreader({ visible }: { visible: boolean }) {
  const brushedN = useMemo(() => makeBrushedNormalMap([4, 2], "h"), []);
  const brushedR = useMemo(() => makeBrushedRoughnessMap([4, 2]), []);
  if (!visible) return null;
  return (
    <group position={[1.2, 1.25, 0]}>
      {/* Base cold plate */}
      <RoundedBox
        args={[16.5, 0.18, 8.2]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.1, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={0x2a3038}
          metalness={0.9}
          roughness={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          normalMap={brushedN}
          roughnessMap={brushedR}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          envMapIntensity={1.5}
        />
      </RoundedBox>
      {/* 16 cooling fins */}
      {Array.from({ length: 16 }, (_, i) => (
        <RoundedBox
          key={`fin-${i}`}
          args={[16.2, 1.15, 0.16]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.78, -3.6 + i * 0.48]}
          castShadow
        >
          <meshPhysicalMaterial
            color={0x30363e}
            metalness={0.92}
            roughness={0.25}
            clearcoat={0.5}
            normalMap={brushedN}
            roughnessMap={brushedR}
            normalScale={new THREE.Vector2(0.4, 0.4)}
            envMapIntensity={1.4}
          />
        </RoundedBox>
      ))}
      {/* Heat pipes */}
      {[
        [-5.5, 2.2],
        [5.5, -2.2],
      ].map(([x, z], i) => (
        <mesh
          key={`pipe-${i}`}
          position={[x, 1.35, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.16, 0.16, 3.2, 16]} />
          <meshPhysicalMaterial
            color={0x8a96a4}
            metalness={0.95}
            roughness={0.18}
            clearcoat={0.7}
            envMapIntensity={1.6}
          />
        </mesh>
      ))}
    </group>
  );
}
