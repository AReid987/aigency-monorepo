// LIVE query helpers — wraps SurrealDB LIVE SELECT for Aigency event streams
// Use these to subscribe to real-time updates in Membrane / Oracle.

import { SurrealClient } from "./client.js";

type LiveCallback<T> = (action: "CREATE" | "UPDATE" | "DELETE", data: T) => void;

/**
 * Subscribe to LIVE changes on a SurrealDB table.
 *
 * @example
 * const unsub = await LIVE.subscribe<TimelineRecord>("timeline", (action, record) => {
 *   console.log(action, record);
 * });
 * // later...
 * unsub();
 */
export const LIVE = {
  async subscribe<T>(
    table: string,
    callback: LiveCallback<T>,
    where?: string
  ): Promise<() => void> {
    const db = SurrealClient.db;
    const query = where
      ? `LIVE SELECT * FROM ${table} WHERE ${where}`
      : `LIVE SELECT * FROM ${table}`;

    const [uuid] = await db.query<[string]>(query);

    // biome-ignore lint/suspicious/noExplicitAny: SurrealDB SDK type compatibility
    db.subscribeLive(uuid as any, (action: any, data: any) => {
      callback(action as "CREATE" | "UPDATE" | "DELETE", data as T);
    });

    return async () => {
      // biome-ignore lint/suspicious/noExplicitAny: SurrealDB SDK kill() accepts string UUID
      await db.kill(uuid as any);
    };
  },

  /** Convenience: subscribe to the timeline for a specific event_type. */
  async onEvent<T>(eventType: string, callback: LiveCallback<T>): Promise<() => void> {
    return LIVE.subscribe<T>("timeline", callback, `event_type = '${eventType}'`);
  },

  /** Convenience: subscribe to agent status changes. */
  async onAgentStatus(
    callback: LiveCallback<{ callsign: string; status: string }>
  ): Promise<() => void> {
    return LIVE.subscribe("agent", callback);
  },
};
