# RepoAtlas CLI

Upload GitNexus analysis output to RepoAtlas.

## Install

```bash
pnpm --global add @repoatlas/cli
# or locally
pnpm add -D @repoatlas/cli
```

## Usage

```bash
repoatlas login <server-url> <api-token>
repoatlas init [path] --id <project-id> --name "Project Name"
repoatlas sync [path]            # analyze, generate wiki, upload
repoatlas sync [path] --no-analyze   # upload existing .gitnexus
repoatlas logout
```

## How it works

1. Runs `gitnexus analyze` and `gitnexus wiki` (unless `--no-analyze`).
2. Packs `.gitnexus/` into a tarball.
3. POSTs it to `<server-url>/api/projects/<id>/sync`.
4. Server upserts project metadata and wiki pages.
