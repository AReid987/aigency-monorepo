# RepoAtlas CLI

Upload project analysis output to RepoAtlas.

## Install

```bash
pnpm --global add @repoatlas/cli
# or locally
pnpm add -D @repoatlas/cli
```

## Usage

```bash
repoatlas login <server-url> <api-token>
repoatlas init [path] --id <project-id> --name "Project Name" --remote-url <repo-url>
repoatlas sync [path]            # analyze, generate wiki, upload
repoatlas sync [path] --no-analyze   # upload existing .gitnexus
repoatlas logout
```

## How it works

1. Scans git-tracked files, groups them into modules, and generates wiki pages.
2. Writes `.gitnexus/meta.json`, `.gitnexus/wiki/meta.json`, `.gitnexus/wiki/module_tree.json`, and `.gitnexus/wiki/*.md`.
3. Packs `.gitnexus/` into a tarball.
4. POSTs it to `<server-url>/api/projects/<id>/sync`.
5. Server upserts project metadata and wiki pages.

## CI/CD

Add these secrets/variables to your repository for `.github/workflows/repoatlas-sync.yml`:

| Secret / Variable | Required | Description |
|---|---|---|
| `REPOATLAS_API_URL` | yes | RepoAtlas server URL |
| `REPOATLAS_API_TOKEN` | yes | RepoAtlas `API_TOKEN` |
| `REPOATLAS_PROJECT_ID` | no | Project ID (defaults to repository name) |
| `REPOATLAS_PROJECT_NAME` | no | Display name (defaults to repository name) |

The workflow runs on every push to `main`/`master` and keeps the wiki/graph in sync.
