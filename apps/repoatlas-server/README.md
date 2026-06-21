# RepoAtlas Server

Central Postgres-backed API for RepoAtlas projects and wiki pages.

## Stack

- Node 20+ + Hono
- `postgres` driver
- Docker Compose for local Postgres

## Local dev

```bash
docker compose up -d   # Postgres on 127.0.0.1:5433
pnpm dev               # http://localhost:4747
```

## Environment

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://repoatlas:repoatlas@localhost:5433/repoatlas` |
| `API_TOKEN` | yes | none |
| `PORT` | no | `4747` |
| `APPLY_MIGRATIONS` | no | `true` |
| `CORS_ORIGIN` | no | `*` |

## API

- `GET /health`
- `GET /api/repos` – list projects
- `GET /api/repo/:id/meta`
- `GET /api/repo/:id/tree`
- `GET /api/repo/:id/wiki`
- `GET /api/repo/:id/wiki/:slug`
- `POST /api/projects` – create/upsert project (Bearer token)
- `POST /api/projects/:id/sync` – upload `.gitnexus.tar.gz` (Bearer token)

## Deploy to Render

Use the `render.yaml` Blueprint in the repo root, or create a Render Web Service with:

- Root directory: `apps/repoatlas-server`
- Build command: `pnpm install && pnpm build`
- Start command: `node dist/index.js`
- Add a Postgres database and set `API_TOKEN`.
