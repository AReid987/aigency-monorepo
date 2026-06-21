import process from "node:process";

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? "3000"),
  databaseUrl: requireEnv("DATABASE_URL"),
  apiToken: requireEnv("API_TOKEN"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  applyMigrations: process.env.APPLY_MIGRATIONS !== "false",
};
