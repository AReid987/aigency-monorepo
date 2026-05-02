// src/lib/logging/logger.ts
import pino from 'pino';

export let logger: pino.Logger;

export function initLogger(options: { level: string }) {
  logger = pino({
    level: options.level || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
}

// Initialize with default level
initLogger({ level: 'info' });
