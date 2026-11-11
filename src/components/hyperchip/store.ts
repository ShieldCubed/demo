"use client";

import { create } from "zustand";
import * as THREE from "three";

export type PresetName =
  | "hero"
  | "top"
  | "side"
  | "yig"
  | "photonic"
  | "optics"
  | "qmem"
  | "explode";

export interface Preset {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export const PRESETS: Record<PresetName, Preset> = {
  hero: { pos: new THREE.Vector3(24, 18, 30), look: new THREE.Vector3(0, 0, 0) },
  top: { pos: new THREE.Vector3(0, 42, 0.01), look: new THREE.Vector3(0, 0, 0) },
  side: { pos: new THREE.Vector3(0, 4, 40), look: new THREE.Vector3(0, 0, 0) },
  yig: { pos: new THREE.Vector3(-12, 11, 14), look: new THREE.Vector3(-7.5, 0, 0) },
  photonic: { pos: new THREE.Vector3(0, 10, 13), look: new THREE.Vector3(-1.5, 0, 0) },
  optics: { pos: new THREE.Vector3(12, 12, 18), look: new THREE.Vector3(8.5, 0, 0) },
  qmem: { pos: new THREE.Vector3(2, 10, 14), look: new THREE.Vector3(-1.5, 0.9, 0) },
  explode: { pos: new THREE.Vector3(9, 32, 40), look: new THREE.Vector3(0, 7, 0) },
};

interface ChipState {
  autoRotate: boolean;
  labels: boolean;
  fx: boolean;
  cutaway: boolean;
  heatsink: boolean;
  explode: boolean;
  qmem: boolean;
  activePreset: PresetName;
  set: <K extends keyof ChipState>(k: K, v: ChipState[K]) => void;
  toggle: (
    k: "autoRotate" | "labels" | "fx" | "cutaway" | "heatsink" | "explode" | "qmem",
  ) => void;
  applyPreset: (p: PresetName) => void;
}

export const useChipStore = create<ChipState>((set) => ({
  autoRotate: true,
  labels: true,
  fx: true,
  cutaway: false,
  heatsink: true,
  explode: false,
  qmem: true,
  activePreset: "hero",
  set: (k, v) => set({ [k]: v } as Partial<ChipState>),
  toggle: (k) => set((s) => ({ [k]: !s[k] } as Partial<ChipState>)),
  applyPreset: (p) =>
    set((s) => ({
      activePreset: p,
      autoRotate: false,
      explode: p === "explode" ? true : s.explode,
    } as Partial<ChipState>)),
}));
