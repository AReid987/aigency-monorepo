// SurrealClient — singleton connection manager for Aigency
// Connects to SurrealDB 3.0 over WebSocket (ws://) or HTTP.

import Surreal from "surrealdb";

export interface SurrealClientConfig {
  url: string;          // e.g. "ws://localhost:8000/rpc"
  namespace: string;    // e.g. "aigency"
  database: string;     // e.g. "mem_brain"
  username: string;
  password: string;
}

let _instance: Surreal | null = null;
let _config: SurrealClientConfig | null = null;

export class SurrealClient {
  static async connect(config: SurrealClientConfig): Promise<Surreal> {
    if (_instance) return _instance;

    _config = config;
    _instance = new Surreal();

    await _instance.connect(config.url);
    await _instance.signin({ username: config.username, password: config.password });
    await _instance.use({ namespace: config.namespace, database: config.database });

    console.log(`[surreal] Connected → ${config.url} / ${config.namespace}:${config.database}`);
    return _instance;
  }

  static get db(): Surreal {
    if (!_instance) throw new Error("[surreal] Not connected. Call SurrealClient.connect() first.");
    return _instance;
  }

  static async disconnect(): Promise<void> {
    if (_instance) {
      await _instance.close();
      _instance = null;
      _config = null;
    }
  }

  /** Re-connect using the last config (useful after network drop). */
  static async reconnect(): Promise<Surreal> {
    if (!_config) throw new Error("[surreal] No config to reconnect with.");
    _instance = null;
    return SurrealClient.connect(_config);
  }
}
