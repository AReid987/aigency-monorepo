import { LocalOmpTransport, OmpRpcClient, SshOmpTransport } from "@aigency/galaxy-bridge";
import { HermesClient } from "@aigency/hermes-client";
import { loadConfig } from "./config.js";
import { GalaxyOrchestrator } from "./orchestrator.js";

// ─── Factory ─────────────────────────────────────────────────────────────────

export interface GalaxyInstance {
  orchestrator: GalaxyOrchestrator;
  hermes: HermesClient;
  ompClient: OmpRpcClient;
  dispose: () => void;
}

/**
 * Create a Galaxy instance — connects Hermes (VPS) and OMP (MacBook).
 *
 * Usage:
 *   const galaxy = await createGalaxy();
 *   const result = await galaxy.orchestrator.executeTask({
 *     ventureId: "notetaker-2026-001",
 *     task: "implement auth flow",
 *   });
 *   galaxy.dispose();
 */
export async function createGalaxy(
  overrides?: Partial<ReturnType<typeof loadConfig>>
): Promise<GalaxyInstance> {
  const config = { ...loadConfig(), ...overrides };

  // ── Hermes client ──────────────────────────────────────────────────────

  const hermes = new HermesClient({
    baseUrl: config.hermes.baseUrl,
    apiKey: config.hermes.apiKey,
  });

  // ── OMP transport + client ─────────────────────────────────────────────

  const isLocal = config.omp.host === "localhost" || config.omp.host === "127.0.0.1";

  const transport = isLocal
    ? new LocalOmpTransport(config.omp.ompCommand.split(" ").slice(1))
    : new SshOmpTransport({
        host: config.omp.host,
        user: config.omp.user,
        keyPath: config.omp.keyPath,
        port: config.omp.port,
        ompCommand: config.omp.ompCommand,
      });

  const ompClient = new OmpRpcClient({ transport });

  // Connect transport
  if (transport instanceof SshOmpTransport) {
    transport.connect();
  } else {
    (transport as LocalOmpTransport).spawn();
  }

  // Wait for OMP ready signal
  await ompClient.waitForReady();

  // ── Orchestrator ───────────────────────────────────────────────────────

  const orchestrator = new GalaxyOrchestrator({
    hermes,
    ompClient,
    config,
  });

  return {
    orchestrator,
    hermes,
    ompClient,
    dispose: () => ompClient.dispose(),
  };
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export { GalaxyOrchestrator } from "./orchestrator.js";
export type { Venture, VentureTask, OrchestratorEvent } from "./orchestrator.js";
export { loadConfig } from "./config.js";
export type { GalaxyConfig } from "./config.js";
