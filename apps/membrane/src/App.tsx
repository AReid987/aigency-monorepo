// App — root component for the Membraned Interface
// Layout: fullscreen Three.js canvas + floating glass panels

import { Canvas } from "@react-three/fiber";
import { tokens } from "@aigency/design-tokens";

export function App() {
  const bg = tokens.atoms.color.base.canvas.$value as string;

  return (
    <div style={{ width: "100vw", height: "100vh", background: bg, position: "relative" }}>
      {/* SynapTree — 3D knowledge graph */}
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        camera={{ position: [0, 0, 50], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* TODO: <SynapTree /> — CIPHER implementation */}
        <ambientLight intensity={0.1} />
      </Canvas>

      {/* Floating glass panels — rendered above the canvas */}
      <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
        {/* TODO: <QuerySurface /> — Cmd+K ORACLE query bar */}
        {/* TODO: <DirectiveFeed /> — left-edge active directives */}
        {/* TODO: <TimelineRail /> — bottom timeline scrubber */}
      </div>
    </div>
  );
}
