"use client";

import * as THREE from "three";

/**
 * Procedural PBR texture generators.
 * These build normal / roughness / specular maps on a canvas so we get
 * photorealistic surface micro-detail (PCB copper trace relief, brushed
 * metal, gold grain, sandblasted ceramic) without shipping external assets.
 */

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function toTexture(
  canvas: HTMLCanvasElement,
  repeat: [number, number] = [1, 1],
  srgb = false,
): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Add monochromatic noise to a canvas (for surface micro-detail)
function noise(ctx: Ctx, w: number, h: number, amt: number, alpha = 1) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    if (alpha < 1) d[i + 3] = Math.min(255, d[i + 3] * alpha);
  }
  ctx.putImageData(img, 0, 0);
}

// =========================================================================
// PCB — fibreglass weave + copper trace relief (normal map) + roughness map
// =========================================================================
export function makePcbNormalMap(repeat: [number, number] = [4, 2]): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 512);
  // Base flat
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 1024, 512);

  // Fibreglass weave — fine crosshatch
  ctx.strokeStyle = "rgba(120,120,120,0.5)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  for (let x = 0; x < 1024; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Copper trace relief — horizontal & vertical bands raised (+z = lighter)
  ctx.fillStyle = "#d8d8d8";
  for (let i = 0; i < 24; i++) {
    const y = 20 + i * 20;
    ctx.fillRect(0, y, 1024, 3);
  }
  // Random short copper segments
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const w = 20 + Math.random() * 80;
    ctx.fillRect(x, y, w, 3);
  }

  // SMD pad squares (raised)
  ctx.fillStyle = "#e8e8e8";
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 8, 6);
  }

  // Vias — small dots
  ctx.fillStyle = "#404040";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  noise(ctx, 1024, 512, 8);
  return toTexture(c, repeat);
}

export function makePcbRoughnessMap(repeat: [number, number] = [4, 2]): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 512);
  // Substrate: high roughness (solder mask)
  ctx.fillStyle = "#a0a0a0";
  ctx.fillRect(0, 0, 1024, 512);

  // Copper traces: lower roughness (shinier)
  ctx.fillStyle = "#404040";
  for (let i = 0; i < 24; i++) {
    const y = 20 + i * 20;
    ctx.fillRect(0, y, 1024, 3);
  }
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const w = 20 + Math.random() * 80;
    ctx.fillRect(x, y, w, 3);
  }

  // Pads
  ctx.fillStyle = "#303030";
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 8, 6);
  }

  noise(ctx, 1024, 512, 12);
  return toTexture(c, repeat);
}

// PCB solder mask color texture — dark greenish-black with subtle variation
export function makePcbColorMap(repeat: [number, number] = [4, 2]): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = "#0a1a14";
  ctx.fillRect(0, 0, 1024, 512);
  // Subtle silkscreen white text fragments
  ctx.fillStyle = "rgba(230,230,238,0.12)";
  ctx.font = "bold 14px monospace";
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillText(["R12", "C34", "U1", "J2", "TP1", "AGH", "AUM", "Ω01"][i % 8], x, y);
  }
  // Copper hint along trace bands
  ctx.fillStyle = "rgba(180,140,40,0.08)";
  for (let i = 0; i < 24; i++) {
    const y = 20 + i * 20;
    ctx.fillRect(0, y, 1024, 3);
  }
  noise(ctx, 1024, 512, 6);
  return toTexture(c, repeat, true);
}

// =========================================================================
// Brushed metal (heatsink, μ-metal) — anisotropic horizontal grain
// =========================================================================
export function makeBrushedNormalMap(
  repeat: [number, number] = [3, 1],
  direction: "h" | "v" = "h",
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(160,160,160,0.6)";
  ctx.lineWidth = 1;
  if (direction === "h") {
    for (let y = 0; y < 512; y += 1) {
      const offset = Math.random() * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(1024, y + offset);
      ctx.stroke();
    }
  } else {
    for (let x = 0; x < 1024; x += 1) {
      const offset = Math.random() * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset, 512);
      ctx.stroke();
    }
  }
  noise(ctx, 1024, 512, 6);
  return toTexture(c, repeat);
}

export function makeBrushedRoughnessMap(
  repeat: [number, number] = [3, 1],
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = "#606060";
  ctx.fillRect(0, 0, 1024, 512);
  // Streaks of varying roughness
  for (let y = 0; y < 512; y += 1) {
    const v = 80 + Math.random() * 60;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 1024, 1);
  }
  noise(ctx, 1024, 512, 10);
  return toTexture(c, repeat);
}

// =========================================================================
// Gold grain — micro-texture for gold fingers / contacts
// =========================================================================
export function makeGoldNormalMap(repeat: [number, number] = [8, 1]): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 64);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 64);
  // Fine grain
  noise(ctx, 512, 64, 14);
  // Horizontal brushing (gold contact wipes)
  ctx.strokeStyle = "rgba(150,150,150,0.3)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 64; y += 1) {
    if (Math.random() > 0.7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }
  return toTexture(c, repeat);
}

// =========================================================================
// Sandblasted ceramic (YIG substrate, CMOS top) — fine isotropic grain
// =========================================================================
export function makeCeramicNormalMap(repeat: [number, number] = [2, 2]): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);
  noise(ctx, 512, 512, 22);
  return toTexture(c, repeat);
}

// =========================================================================
// Silicon die top — rainbow refraction pattern (CMOS PLL die)
// =========================================================================
export function makeSiliconColorMap(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  // Subtle iridescent silicon
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#1a1a25");
  grad.addColorStop(0.5, "#252535");
  grad.addColorStop(1, "#1a1a25");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  // Layer lines
  ctx.strokeStyle = "rgba(120,140,180,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 6);
    ctx.lineTo(256, i * 6 + 2);
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, 0);
    ctx.lineTo(i * 6 + 2, 256);
    ctx.stroke();
  }
  noise(ctx, 256, 256, 8);
  return toTexture(c, [1, 1], true);
}

// =========================================================================
// Quantum memory iridescence — interference colour shift
// =========================================================================
export function makeIridescenceMap(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 512);
  // Concentric interference rings — purple → cyan
  const cx = 256, cy = 256;
  for (let r = 0; r < 360; r += 1) {
    const phase = (r / 36) % 1;
    const hue = 280 + Math.sin(phase * Math.PI * 2) * 60;
    const sat = 80 + Math.sin(phase * Math.PI * 4) * 10;
    const lit = 30 + Math.sin(phase * Math.PI * 2) * 15;
    ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  noise(ctx, 512, 512, 6);
  return toTexture(c, [1, 1], true);
}

// =========================================================================
// Text silk texture — for silkscreen labels
// =========================================================================
export function makeTextTexture(
  text: string,
  color: string,
  bg: string,
  w: number,
  h: number,
  big = false,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = `${big ? "900" : "700"} ${big ? 34 : 18}px ${
    big ? "Inter, Helvetica" : "Courier New"
  }`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(canvas);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
