import { z } from "zod";

// ─── Config Schema ───────────────────────────────────────────────────────────

const GalaxyConfigSchema = z.object({
  // Hermes (VPS)
  hermes: z.object({
    baseUrl: z.string().url(),
    apiKey: z.string().optional(),
  }),

  // OMP (MacBook)
  omp: z.object({
    host: z.string(),
    user: z.string().optional(),
    keyPath: z.string().optional(),
    port: z.number().default(22),
    ompCommand: z.string().default("omp --mode rpc"),
  }),

  // Ventures
  ventures: z.object({
    /** Base directory for venture working directories. */
    baseDir: z.string().default("~/galaxy/ventures"),
  }),

  // Default skills to load for coding tasks
  defaultSkills: z.array(z.string()).default(["gstack", "paul", "carl"]),

  // Task defaults
  task: z.object({
    timeoutMs: z.number().default(600_000),
    budgetLimit: z.number().optional(),
    defaultModel: z
      .object({
        provider: z.string(),
        modelId: z.string(),
      })
      .optional(),
  }),
});

export type GalaxyConfig = z.infer<typeof GalaxyConfigSchema>;

// ─── Config Loading ──────────────────────────────────────────────────────────

export function loadConfig(): GalaxyConfig {
  const raw = {
    hermes: {
      baseUrl: process.env.HERMES_BASE_URL ?? "http://galaxy-oracle:8080",
      apiKey: process.env.HERMES_API_KEY,
    },
    omp: {
      host: process.env.OMP_SSH_HOST ?? "macbook-pro",
      user: process.env.OMP_SSH_USER,
      keyPath: process.env.OMP_SSH_KEY_PATH,
      port: process.env.OMP_SSH_PORT ? Number.parseInt(process.env.OMP_SSH_PORT, 10) : 22,
      ompCommand: process.env.OMP_COMMAND ?? "omp --mode rpc",
    },
    ventures: {
      baseDir: process.env.GALAXY_VENTURES_DIR ?? "~/galaxy/ventures",
    },
    defaultSkills: process.env.GALAXY_DEFAULT_SKILLS?.split(",") ?? ["gstack", "paul", "carl"],
    task: {
      timeoutMs: process.env.GALAXY_TASK_TIMEOUT
        ? Number.parseInt(process.env.GALAXY_TASK_TIMEOUT, 10)
        : 600_000,
      budgetLimit: process.env.GALAXY_BUDGET_LIMIT
        ? Number.parseFloat(process.env.GALAXY_BUDGET_LIMIT)
        : undefined,
      defaultModel: process.env.GALAXY_DEFAULT_MODEL
        ? (() => {
            const [provider, modelId] = process.env.GALAXY_DEFAULT_MODEL.split("/");
            return { provider: provider ?? "", modelId: modelId ?? "" };
          })()
        : undefined,
    },
  };

  return GalaxyConfigSchema.parse(raw);
}
