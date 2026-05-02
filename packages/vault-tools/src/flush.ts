// vault-tools/flush.ts — port of flush.py
// Syncs session logs from agents/<callsign>/session-logs/ to the timeline table in SurrealDB.
// Placeholder implementation — requires @aigency/surreal to be wired up.

import type { VaultConfig } from "./config.js";

export async function flush(config: VaultConfig): Promise<{ flushed: number }> {
  // TODO: wire up @aigency/surreal SurrealClient
  // 1. Walk agents/<callsign>/session-logs/*.md
  // 2. Parse frontmatter for event_type, agent, summary, metadata
  // 3. INSERT INTO timeline (id, event_type, agent, summary, metadata, created_at)
  //    if not already present (deduplication on file hash)
  console.warn("[flush] Not yet implemented — requires @aigency/surreal");
  return { flushed: 0 };
}
