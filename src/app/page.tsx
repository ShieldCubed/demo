"use client";

import dynamic from "next/dynamic";
import {
  Splash,
  TopRail,
  StatsPanel,
  ControlPanel,
  ComponentsList,
  BottomRail,
  useKeyboardShortcuts,
} from "@/components/hyperchip/Ui";

// Three.js scene is heavy and uses WebGL — load only on client.
const Scene = dynamic(
  () => import("@/components/hyperchip/Scene").then((m) => m.Scene),
  { ssr: false },
);

export default function Home() {
  useKeyboardShortcuts();
  return (
    <main>
      <Splash />
      <div id="scene">
        <Scene />
      </div>
      <TopRail />
      <StatsPanel />
      <ControlPanel />
      <ComponentsList />
      <BottomRail />
    </main>
  );
}
