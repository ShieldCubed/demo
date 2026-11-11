# GÖDEL HYPERCHIP — Photorealistic Quantum Persistent Memory Render

Interactive photorealistic 3D render of the **AUMNIUM GÖDEL Hyperchip** (AGH-Ω01-MPX) — a quantum persistent memory PCIe carrier featuring a YIG magnonic core, Si₃N₄ photonic mesh, DFB laser bank, and a UQB+RQB-inspired non-ergodic memory substrate.

Built with **Next.js 16 + React Three Fiber + drei + postprocessing**.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **3D**: three.js (r187) via @react-three/fiber v9, @react-three/drei v10
- **Post-processing**: @react-three/postprocessing v3 (Bloom, SSAO, Vignette, ChromaticAberration, SMAA)
- **State**: Zustand
- **Styling**: Hand-rolled CSS (AUMNIUM aesthetic — deep black, mono labels, red accent, quantum purple/cyan glow)

## Photorealism features

- **MeshPhysicalMaterial** with clearcoat, transmission, IOR, iridescence, specularIntensity
- **Procedural PBR textures** generated on canvas (no external assets):
  - PCB fibreglass weave + copper trace normal/roughness maps
  - Brushed metal normal map (anisotropic grain) for heatsink, μ-metal can, bracket
  - Gold grain + wipe normal map for PCIe fingers
  - Sandblasted ceramic normal map for YIG substrate and CMOS package
  - Iridescence map for quantum memory substrate
  - Silicon die top with subtle iridescent layering
- **Studio HDR environment** via drei `<Environment preset="studio">` for PBR reflections
- **Contact shadows** under the chip (soft ground occlusion)
- **ACES Filmic tone mapping** + sRGB output encoding
- **Bloom** (mipmap blur, large kernel) with high luminance threshold so only the brightest emissive elements glow
- **Vignette + chromatic aberration + SMAA** for cinematic finish
- **5-light setup**: warm key (cast shadows), red rim, blue fill, warm bounce, plus 5 local point lights for component glow (YIG red, photonic cyan, qmem purple/cyan, laser orange)

## Chip components (10)

1. YIG Magnonic Core (emissive red film in μ-metal can)
2. Si₃N₄ Photonic Mesh (transmissive glass with travelling light pulses)
3. CMOS PLL Driver (ceramic package with silicon die + BGA solder balls)
4. DFB Laser Bank (8 pulsing laser dots with halos)
5. 8× Fibre Couplers (cylindrical couplers with glowing beams)
6. PCIe Gen5 ×16 Bracket (stainless steel with fiber ports)
7. PCIe Gold Fingers (64 gold edge contacts)
8. μ-Metal Shield Can (only labeled in cutaway mode)
9. Heatsink / Cold Plate (16 brushed-metal fins + 2 heat pipes)
10. Quantum Persistent Memory (iridescent substrate with birthmark rings, bow-tie scars, orbiting particles, glowing core)

## Interactivity

- **Orbit**: drag to rotate, wheel to zoom (damped)
- **Toggles**: Auto-rotate, Component Labels, Activity FX, Cutaway Core, Heatsink, Explode Layers, Persistent QMEM
- **Camera presets**: HERO, TOP, SIDE, YIG, PHOTONIC, OPTICS, QMEM, EXPLODE
- **Keyboard**: `Space` rotate · `L` labels · `C` cutaway · `E` explode · `Q` qmem · `R` reset · `1-7` presets
- **Live readout panel**: real-time animated Brain Throughput, Synaptic Events, Magnonic frequency, Core Temp, Energy/Op, Memory Trace, Ergodic Ratio, Hilbert Dim
- **Memory trace sparkline**: animated ergodic ratio vs UQB lower bound (≥2) and ergodic limit (=1)

## Deploy to `aumnium.tech/demo` on Vercel

This project is configured with `basePath: "/demo"` and `assetPrefix: "/demo/"` in `next.config.ts` so all assets resolve correctly under the `/demo` subpath.

### Option A — Vercel Dashboard

1. Push this repo to GitHub (e.g. `ShieldCubed/demo`).
2. In Vercel, **Import Project** from the GitHub repo.
3. Framework preset: **Next.js**.
4. Build command: `next build` (auto-detected).
5. Output: leave blank (uses default `.next`).
6. Add a **Production Domain** `aumnium.tech` to your Vercel team.
7. In your DNS provider, add a CNAME from `aumnium.tech` to `cname.vercel-dns.com`.
8. In Vercel, go to **Project → Settings → Domains → Add**, enter `aumnium.tech/demo`.
   Vercel will treat `/demo` as a path-based rewrites config — since your `next.config.ts` already declares `basePath: "/demo"`, every route resolves under `/demo/`.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link              # link to your existing ShieldCubed/demo project
vercel --prod            # deploy to production
```

After deploy, set up the `aumnium.tech` domain in the Vercel dashboard as above.

## Local development

```bash
bun install
bun run dev              # starts on port 3000
```

Visit `http://localhost:3000/demo` (the basePath is active in dev too).

## Project structure

```
src/
├── app/
│   ├── layout.tsx            # root layout + metadata
│   ├── page.tsx              # main page: Scene + UI overlay
│   └── globals.css           # AUMNIUM aesthetic CSS
└── components/hyperchip/
    ├── store.ts              # Zustand store (view toggles + presets)
    ├── textures.ts           # Procedural PBR texture generators
    ├── parts.tsx             # All 10 chip sub-components
    ├── Chip.tsx              # Chip orchestrator + 3D labels + explode rig
    ├── Scene.tsx             # R3F Canvas + lights + env + postprocessing
    └── Ui.tsx                # Splash, TopRail, StatsPanel, ControlPanel,
                              # ComponentsList, BottomRail, keyboard shortcuts
```

## Credits

AUMNIUM Technology Pvt Ltd · Bengaluru · IN · Hardware-native quantum memory.
