"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  PCB,
  GoldFingers,
  Bracket,
  YIGCore,
  PhotonicMesh,
  CMOS,
  Lasers,
  FiberCouplers,
  QuantumMemoryLayer,
  Heatspreader,
} from "./parts";
import { useChipStore } from "./store";

interface LayerRig {
  pos: [number, number, number];
  off: [number, number, number];
}

const LAYER_RIG: Record<string, LayerRig> = {
  goldFingers: { pos: [0, 0, 0], off: [0, -2.4, 1.6] },
  pcb: { pos: [0, 0, 0], off: [0, -0.8, 0] },
  yig: { pos: [-7.5, 0, 0], off: [-1.2, 3.2, 0] },
  photonic: { pos: [-1.5, 0, 0], off: [0.2, 5.4, 0] },
  qmem: { pos: [-1.5, 0.9, 0], off: [0.2, 7.6, 0] },
  cmos: { pos: [4.5, 0, -1.5], off: [1.4, 10.2, -1.2] },
  laser: { pos: [4.5, 0, 1.5], off: [1.4, 10.2, 1.2] },
  fiber: { pos: [0, 0, 0], off: [2.8, 12.4, 0] },
  bracket: { pos: [0, 0, 0], off: [3.6, 2.0, 0] },
  heatsink: { pos: [1.2, 1.25, 0], off: [0, 15.4, 0] },
};

interface LabelData {
  tag: string;
  text: string;
  anchor: [number, number, number];
  off: [number, number, number];
  qmem?: boolean;
  cutawayOnly?: boolean;
}

const LABELS: LabelData[] = [
  { tag: "01", text: "YIG MAGNONIC CORE", anchor: [-5.5, 3.4, 3.0], off: [-1.2, 4.6, 0] },
  { tag: "02", text: "Si₃N₄ PHOTONIC MESH", anchor: [-1.5, 1.8, 2.8], off: [0.2, 5.4, 0] },
  { tag: "03", text: "CMOS PLL DRIVER", anchor: [4.5, 1.6, -3.0], off: [1.4, 10.2, -1.2] },
  { tag: "04", text: "DFB LASER BANK", anchor: [4.5, 1.6, 3.0], off: [1.4, 10.2, 1.2] },
  { tag: "05", text: "8× FIBRE COUPLERS", anchor: [10.0, 1.6, -3.5], off: [2.8, 12.4, 0] },
  { tag: "06", text: "PCIe Gen5 ×16 BRACKET", anchor: [13.5, 2.8, 4.5], off: [3.6, 2.0, 0] },
  { tag: "07", text: "PCIe GOLD FINGERS", anchor: [-5, -0.6, 5.5], off: [0, -2.4, 1.6] },
  {
    tag: "08",
    text: "μ-METAL SHIELD CAN",
    anchor: [-10.5, 0.4, -3.5],
    off: [-1.2, 3.2, 0],
    cutawayOnly: true,
  },
  { tag: "09", text: "HEATSINK / COLD PLATE", anchor: [-3.0, 3.4, 0], off: [0, 15.4, 0] },
  {
    tag: "10",
    text: "QUANTUM PERSISTENT MEMORY",
    anchor: [-1.5, 0.6, 1.8],
    off: [0.2, 7.6, 0],
    qmem: true,
  },
];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Layer wrapper that smoothly translates its child along the explode offset
function Layer({
  name,
  children,
}: {
  name: keyof typeof LAYER_RIG;
  children: React.ReactNode;
}) {
  const explode = useChipStore((s) => s.explode);
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef(0);
  const current = useRef(0);

  useFrame((_, delta) => {
    target.current = explode ? 1 : 0;
    if (Math.abs(current.current - target.current) > 0.001) {
      current.current += (target.current - current.current) * Math.min(1, delta * 2.4);
    } else {
      current.current = target.current;
    }
    const k = easeInOut(current.current);
    const rig = LAYER_RIG[name];
    if (groupRef.current) {
      groupRef.current.position.set(
        rig.pos[0] + rig.off[0] * k,
        rig.pos[1] + rig.off[1] * k,
        rig.pos[2] + rig.off[2] * k,
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// 3D label using drei <Html> overlay, position smoothly tracks explode.
// Self-hides when projected outside the central viewport (so it doesn't
// overlap the side panels) or when behind the camera.
function Label3D({ data }: { data: LabelData }) {
  const explode = useChipStore((s) => s.explode);
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const { camera, size } = useThree();

  useFrame((state, delta) => {
    target.current = explode ? 1 : 0;
    if (Math.abs(current.current - target.current) > 0.001) {
      current.current += (target.current - current.current) * Math.min(1, delta * 2.4);
    } else {
      current.current = target.current;
    }
    const k = easeInOut(current.current);
    if (groupRef.current) {
      groupRef.current.position.set(
        data.anchor[0] + data.off[0] * k,
        data.anchor[1] + data.off[1] * k,
        data.anchor[2] + data.off[2] * k,
      );
      // Project to screen & hide if outside central safe area
      const world = groupRef.current.getWorldPosition(new THREE.Vector3());
      const projected = world.clone().project(camera);
      if (projected.z < -1 || projected.z > 1) {
        if (htmlRef.current) htmlRef.current.style.display = "none";
        return;
      }
      const x = (projected.x * 0.5 + 0.5) * size.width;
      // Safe horizontal range: leave wide margins on each side for panels
      const isMobile = size.width < 900;
      const safeLeft = isMobile ? 0 : 300;
      const safeRight = isMobile ? size.width : size.width - 340;
      if (htmlRef.current) {
        htmlRef.current.style.display =
          x < safeLeft || x > safeRight ? "none" : "block";
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        zIndexRange={[15, 0]}
        style={{ pointerEvents: "none" }}
        wrapperClass="label3d-wrapper"
      >
        <div
          ref={htmlRef}
          className={`label3d ${data.qmem ? "qmem" : ""}`}
        >
          <span className="tag">{data.tag}</span>
          {data.text}
        </div>
      </Html>
    </group>
  );
}

export function Chip() {
  const chipRef = useRef<THREE.Group>(null);
  const autoRotate = useChipStore((s) => s.autoRotate);
  const labels = useChipStore((s) => s.labels);
  const fx = useChipStore((s) => s.fx);
  const cutaway = useChipStore((s) => s.cutaway);
  const heatsink = useChipStore((s) => s.heatsink);
  const qmem = useChipStore((s) => s.qmem);
  const explode = useChipStore((s) => s.explode);

  // Filter labels based on state — μ-metal shield label only in cutaway mode
  const visibleLabels = useMemo(
    () => LABELS.filter((l) => !l.cutawayOnly || cutaway),
    [cutaway],
  );

  useFrame((_, delta) => {
    if (chipRef.current && autoRotate) {
      chipRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={chipRef}>
      <Layer name="goldFingers">
        <GoldFingers />
      </Layer>
      <Layer name="pcb">
        <PCB />
      </Layer>
      <Layer name="yig">
        <YIGCore cutaway={cutaway} fx={fx} explodeAmt={explode ? 1 : 0} />
      </Layer>
      <Layer name="photonic">
        <PhotonicMesh fx={fx} />
      </Layer>
      <Layer name="qmem">
        <QuantumMemoryLayer qmem={qmem} fx={fx} />
      </Layer>
      <Layer name="cmos">
        <CMOS />
      </Layer>
      <Layer name="laser">
        <Lasers fx={fx} />
      </Layer>
      <Layer name="fiber">
        <FiberCouplers fx={fx} />
      </Layer>
      <Layer name="bracket">
        <Bracket />
      </Layer>
      <Layer name="heatsink">
        <Heatspreader visible={heatsink} />
      </Layer>

      {labels && visibleLabels.map((l) => <Label3D key={l.tag} data={l} />)}
    </group>
  );
}
