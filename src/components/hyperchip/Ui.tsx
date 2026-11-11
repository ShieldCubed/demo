"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChipStore, PRESETS, type PresetName } from "./store";

// ============================================================
// Splash screen — auto-hides after mount
// ============================================================
export function Splash() {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHide(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div id="splash" className={hide ? "hide" : ""}>
      <div className="splash-inner">
        <div className="brand">AUMNIUM</div>
        <div className="sub">{"// INITIALIZING QUANTUM PERSISTENT MEMORY · AGH-Ω01-MPX"}</div>
        <div className="bar" />
      </div>
    </div>
  );
}

// ============================================================
// Top rail — brand + status pill
// ============================================================
export function TopRail() {
  return (
    <div id="top-rail">
      <div id="brand-block">
        <div id="brand-mark">AUMNIUM</div>
        <div id="brand-sub">
          {"// GÖDEL HYPERCHIP · AGH-Ω01-MPX · QUANTUM BIRTHMARK MEMORY"}
        </div>
      </div>
      <div id="status-pill">
        <span className="dot" />
        LIVE READOUT
        <span className="nda">· NDA</span>
      </div>
    </div>
  );
}

// ============================================================
// Stats panel — live operational readout
// ============================================================
export function StatsPanel() {
  const [pop, setPop] = useState("1.00 POP/s");
  const [syn, setSyn] = useState("1.00e15 /s");
  const [mag, setMag] = useState("24.0 GHz");
  const [tmp, setTmp] = useState("41.2 °C");
  const [eop, setEop] = useState("0.82 fJ");
  const [mem, setMem] = useState("0.94");
  const [ergo, setErgo] = useState("3.12×");
  const [hilb, setHilb] = useState("8.9k");
  const qmem = useChipStore((s) => s.qmem);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      const popV = 0.96 + 0.06 * Math.sin(t * 0.7) + 0.02 * Math.sin(t * 2.1);
      const magV = 18 + 22 * (0.5 + 0.5 * Math.sin(t * 0.35));
      const tmpV = 39.4 + 3.2 * (0.5 + 0.5 * Math.sin(t * 0.22));
      const eopV = 0.72 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.5 + 1.2));
      const synV = (0.92 + 0.12 * Math.sin(t * 0.9)) * 1e15;
      const memTrace = 0.92 + 0.05 * Math.sin(t * 0.15) + 0.02 * Math.sin(t * 1.3);
      const rqb = qmem ? 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.4)) : 0;
      const ergoV = 2.0 + rqb * 1.8 + 0.1 * Math.sin(t * 0.7);
      const hilbV = 8.9 + 0.3 * Math.sin(t * 0.25) + (qmem ? 0.5 : 0);
      setPop(popV.toFixed(2) + " POP/s");
      setMag(magV.toFixed(1) + " GHz");
      setTmp(tmpV.toFixed(1) + " °C");
      setEop(eopV.toFixed(2) + " fJ");
      setSyn(synV.toExponential(2) + " /s");
      setMem(memTrace.toFixed(3));
      setErgo(ergoV.toFixed(2) + "×");
      setHilb(hilbV.toFixed(1) + "k");
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [qmem]);

  return (
    <div id="stats">
      <div className="header">
        <div className="h-l">{"// LIVE READOUT"}</div>
        <div className="pulse" />
      </div>
      <div className="stat-row">
        <span className="label">BRAIN THROUGH.</span>
        <span className="value">{pop}</span>
      </div>
      <div className="stat-row">
        <span className="label">SYNAPTIC EV.</span>
        <span className="value">{syn}</span>
      </div>
      <div className="stat-row">
        <span className="label">MAGNONIC f</span>
        <span className="value">{mag}</span>
      </div>
      <div className="stat-row">
        <span className="label">PHOTONIC λ</span>
        <span className="value">1310/1550 nm</span>
      </div>
      <div className="stat-row">
        <span className="label">ENERGY/OP</span>
        <span className="value">{eop}</span>
      </div>
      <div className="stat-row">
        <span className="label">CORE TEMP</span>
        <span className="value">{tmp}</span>
      </div>
      <div className="stat-row">
        <span className="label">HOST BUS</span>
        <span className="value">PCIe Gen5 ×16</span>
      </div>
      <div className="stat-row">
        <span className="label">FORM FACTOR</span>
        <span className="value">FHFL CARRIER</span>
      </div>
      <div
        className="stat-row"
        style={{
          marginTop: "6px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "8px",
        }}
      >
        <span className="label" style={{ color: "var(--qmem)" }}>
          MEMORY TRACE
        </span>
        <span className="value qmem">{mem}</span>
      </div>
      <div className="stat-row">
        <span className="label" style={{ color: "var(--qmem)" }}>
          ERGO RATIO
        </span>
        <span className="value qmem">{ergo}</span>
      </div>
      <div className="stat-row">
        <span className="label" style={{ color: "var(--qmem)" }}>
          HILBERT DIM
        </span>
        <span className="value cyan">{hilb}</span>
      </div>
      <MemoryTrace />
    </div>
  );
}

// ============================================================
// Memory trace — animated canvas showing ergodic ratio over time
// ============================================================
function MemoryTrace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qmem = useChipStore((s) => s.qmem);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const trail: number[] = [];
    const LEN = 120;
    for (let i = 0; i < LEN; i++) trail.push(2.0 + Math.random() * 1.5);

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const rqb = qmem ? 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.4)) : 0;
      const ergoRatio = 2.0 + rqb * 1.8 + 0.1 * Math.sin(t * 0.7);
      trail.push(ergoRatio);
      if (trail.length > LEN) trail.shift();
      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (i / 4) * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const valToY = (v: number) => H - (Math.min(v, 5) / 5) * H;
      // Ergodic limit line
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, valToY(1));
      ctx.lineTo(W, valToY(1));
      ctx.stroke();
      // UQB lower bound
      ctx.strokeStyle = "rgba(200,16,46,0.4)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, valToY(2));
      ctx.lineTo(W, valToY(2));
      ctx.stroke();
      ctx.setLineDash([]);
      // Trace curve
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgba(176,96,255,0.15)");
      grad.addColorStop(1, "rgba(48,224,255,0.9)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.forEach((v, i) => {
        const x = (i / (LEN - 1)) * W;
        const y = valToY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Last point marker
      const lastV = trail[trail.length - 1];
      const lastY = valToY(lastV);
      ctx.fillStyle = "#b060ff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#b060ff";
      ctx.beginPath();
      ctx.arc(W - 2, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Labels
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "9px monospace";
      ctx.fillText("ERGO LIMIT", 4, valToY(1) - 3);
      ctx.fillStyle = "rgba(200,16,46,0.6)";
      ctx.fillText("UQB ≥ 2", 4, valToY(2) - 3);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [qmem]);

  return (
    <div id="memtrace">
      <div className="mt-label">
        <span className="k">PERSISTENT MEMORY TRACE</span>
        <span className="v" id="mt-val">
          {qmem ? "3.47×" : "2.10×"}
        </span>
      </div>
      <canvas ref={canvasRef} id="memtrace-canvas" width={460} height={120} />
      <div className="mt-note">
        NON-ERGODIC MEMORY PERSISTS IN INFINITE-TIME LIMIT · NO EXTERNAL REFRESH
      </div>
    </div>
  );
}

// ============================================================
// View controls panel
// ============================================================
const TOGGLES: {
  id: "autoRotate" | "labels" | "fx" | "cutaway" | "heatsink" | "explode" | "qmem";
  label: string;
}[] = [
  { id: "autoRotate", label: "AUTO-ROTATE" },
  { id: "labels", label: "COMPONENT LABELS" },
  { id: "fx", label: "ACTIVITY FX" },
  { id: "cutaway", label: "CUTAWAY CORE" },
  { id: "heatsink", label: "HEATSINK" },
  { id: "explode", label: "EXPLODE LAYERS" },
  { id: "qmem", label: "PERSISTENT QMEM" },
];

export function ControlPanel() {
  const store = useChipStore();

  const handleCutaway = useCallback(() => {
    if (!store.cutaway) {
      // Turning cutaway on turns off heatsink
      store.set("heatsink", false);
    }
    store.toggle("cutaway");
  }, [store]);

  const handleExplode = useCallback(() => {
    if (!store.explode) {
      // Turn ON: ensure heatsink visible, then apply explode preset
      // (applyPreset("explode") already sets explode=true)
      store.set("heatsink", true);
      store.applyPreset("explode");
    } else {
      // Turn OFF: explicitly set explode=false, then return to hero preset
      store.set("explode", false);
      store.applyPreset("hero");
    }
  }, [store]);

  return (
    <div id="panel">
      <div className="panel-section">
        <div className="panel-label">VIEW CONTROLS</div>
        {TOGGLES.map((t) => {
          const on = store[t.id];
          const onClick = () => {
            if (t.id === "cutaway") handleCutaway();
            else if (t.id === "explode") handleExplode();
            else if (t.id === "autoRotate") {
              store.toggle("autoRotate");
            } else store.toggle(t.id);
          };
          return (
            <button
              key={t.id}
              className={`toggle ${on ? "on" : ""}`}
              onClick={onClick}
              type="button"
            >
              <span>{t.label}</span>
              <span className="state">{on ? "ON" : "OFF"}</span>
            </button>
          );
        })}
        <button
          id="btn-reset"
          onClick={() => {
            store.applyPreset("hero");
            store.set("autoRotate", true);
            store.set("explode", false);
          }}
          type="button"
        >
          ⟲ RESET VIEW
        </button>
      </div>
      <div className="panel-section">
        <div className="panel-label">CAMERA PRESETS</div>
        <div className="preset-grid">
          {(Object.keys(PRESETS) as PresetName[]).map((p) => (
            <button
              key={p}
              className={store.activePreset === p ? "active" : ""}
              onClick={() => store.applyPreset(p)}
              data-preset={p}
              type="button"
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Components list (bottom-left)
// ============================================================
const COMPONENTS: { num: string; text: string; qmem?: boolean }[] = [
  { num: "01", text: "YIG MAGNONIC CORE" },
  { num: "02", text: "Si₃N₄ PHOTONIC MESH" },
  { num: "03", text: "CMOS PLL DRIVER" },
  { num: "04", text: "DFB LASER BANK" },
  { num: "05", text: "8× FIBRE COUPLERS" },
  { num: "06", text: "PCIe Gen5 ×16" },
  { num: "07", text: "PCIe GOLD FINGERS" },
  { num: "08", text: "μ-METAL SHIELD" },
  { num: "09", text: "HEATSINK / COLD PLATE" },
  { num: "10", text: "QUANTUM PERSISTENT MEMORY", qmem: true },
];

export function ComponentsList() {
  return (
    <div id="components">
      <div className="panel-section">
        <div className="panel-label">COMPONENTS</div>
        {COMPONENTS.map((c) => (
          <div key={c.num} className={`comp-item ${c.qmem ? "qmem" : ""}`}>
            <span className="num">{c.num}</span>
            {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Bottom rail — interaction hints + branding
// ============================================================
export function BottomRail() {
  return (
    <>
      <div id="hint-chip">DRAG · WHEEL · SPACE · E · C · R · Q</div>
      <div id="bottom-rail">
        <div className="hint">
          <span>
            <b>DRAG</b> ORBIT
          </span>
          <span>
            <b>WHEEL</b> ZOOM
          </span>
          <span>
            <b>SPACE</b> ROTATE
          </span>
          <span>
            <b>E</b> EXPLODE
          </span>
          <span>
            <b>C</b> CUTAWAY
          </span>
          <span>
            <b>R</b> RESET
          </span>
          <span>
            <b>Q</b> QMEM
          </span>
        </div>
        <div className="footer-co">
          AUMNIUM TECHNOLOGY PVT LTD · BENGALURU · IN · HARDWARE-NATIVE QUANTUM MEMORY
        </div>
      </div>
    </>
  );
}

// ============================================================
// Keyboard shortcuts
// ============================================================
export function useKeyboardShortcuts() {
  const store = useChipStore();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          store.toggle("autoRotate");
          break;
        case "l":
        case "L":
          store.toggle("labels");
          break;
        case "c":
        case "C":
          if (!store.cutaway) store.set("heatsink", false);
          else store.set("heatsink", true);
          store.toggle("cutaway");
          break;
        case "e":
        case "E":
          if (!store.explode) {
            store.set("heatsink", true);
            store.applyPreset("explode");
          } else {
            store.set("explode", false);
            store.applyPreset("hero");
          }
          break;
        case "q":
        case "Q":
          store.toggle("qmem");
          break;
        case "r":
        case "R":
          store.applyPreset("hero");
          store.set("autoRotate", true);
          store.set("explode", false);
          break;
        case "1":
          store.applyPreset("hero");
          break;
        case "2":
          store.applyPreset("top");
          break;
        case "3":
          store.applyPreset("side");
          break;
        case "4":
          store.applyPreset("yig");
          break;
        case "5":
          store.applyPreset("photonic");
          break;
        case "6":
          store.applyPreset("optics");
          break;
        case "7":
          store.applyPreset("qmem");
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);
}
