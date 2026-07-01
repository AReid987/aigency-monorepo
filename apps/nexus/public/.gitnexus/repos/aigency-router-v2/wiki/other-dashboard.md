# Dashboard

## Overview
The **Dashboard** is a standalone React 18 application that provides a 3D Holo-CRT telemetry view of the Aigency router. It visualizes live worker telemetry and swarm status using Three.js and React Three Fiber. The dashboard is built with Vite and styled with Tailwind CSS using a custom CRT/phosphor theme.

Key responsibilities:
- Render a WebGL-based observability deck (`RadarCanvas`, `SwarmTelemetry`, `ObservabilityDeck`).
- Display a bottom console for logs and telemetry.
- Consume telemetry events via shared Zustand stores and hooks.

## File Overview

| File | Purpose |
|------|---------|
| `dashboard/package.json` | Project manifest, scripts (`dev`, `build`), and dependencies (React, Three.js, Vite, Tailwind). |
| `dashboard/index.html` | Entry HTML with a full-screen `#root` and Courier-based CRT defaults. |
| `dashboard/vite.config.ts` | Vite + React plugin configuration, dev server on port `5173`. |
| `dashboard/tailwind.config.js` | Tailwind theme extension with phosphor colors (`phosphor-amber`, `phosphor-green`), mono font, and CRT glow shadows. |
| `dashboard/postcss.config.js` | Tailwind CSS + Autoprefixer PostCSS setup. |
| `dashboard/tsconfig.json` | TypeScript config targeting ES2020, React JSX, bundler module resolution. |
| `dashboard/src/index.css` | Tailwind directives plus global styles. |

## Technology Stack
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 5
- **3D rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **State management**: Zustand
- **Styling**: Tailwind CSS v3 + custom CRT color tokens

## Scripts
- `pnpm dev` – start the Vite dev server on `http://localhost:5173`.
- `pnpm build` – typecheck with `tsc -b` and bundle for production.

## Theme
The dashboard uses a retro CRT aesthetic:
- Background: near-black (`#050505`).
- Primary phosphor colors: amber (`#FFB000`) and green.
- Monospace typography: `'Courier New'`.
- Glow effects via Tailwind `boxShadow` utilities.

## Integration Points
- **Sugar DB Worker**: telemetry events are forwarded to the dashboard through a shared SSE/telemetry hook.
- **TUI / CLI**: the dashboard can run alongside the terminal UI as a complementary visual surface.

## Notes
- The dashboard is a separate Vite app from the Aigency Nexus wiki/dashboard.
- Its build is verified by `scripts/verify-s05.sh` and `scripts/verify-s06.sh`.
