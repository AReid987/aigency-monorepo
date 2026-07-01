# Scripts

## Overview
The `scripts/` directory contains orchestration and verification shell scripts. They start the III engine, launch workers, wait for registration, run integration checks, and clean up background processes. These scripts are the primary manual gates for proving that milestones S01, S02, S05, and S06 work end-to-end.

## File Overview

| Script | Purpose |
|--------|---------|
| `scripts/parallel-start.sh` | Launch the III engine + all workers in parallel and verify each `::status` function returns healthy. |
| `scripts/verify-s01.sh` | S01 gate: worker topology, engine console, and integration tests. |
| `scripts/verify-s02.sh` | S02 gate: SugarVault crypto, key storage/retrieval, selector classification, and TUI launch. |
| `scripts/verify-s05.sh` | S05 gate: SugarDB telemetry, SSE streaming, and dashboard production build. |
| `scripts/verify-s06.sh` | S06 gate: full HTTP gateway routing pipeline, unit tests, and dashboard build. |

## Common Patterns

### Process lifecycle
1. `trap cleanup EXIT` kills all background PIDs and removes `data/` directories.
2. Start the III engine on `ws://127.0.0.1:49134` / HTTP `http://127.0.0.1:3111`.
3. Start workers in parallel.
4. `wait_for_port` and `wait_for_workers` poll until registration is complete.
5. Trigger `::status` functions to confirm health.
6. Run assertions, integration tests, and builds.
7. Cleanup runs automatically on script exit.

### Helpers
- `wait_for_port <port> <label> [timeout]` – polls `nc -z` until a port accepts connections.
- `wait_for_workers <expected_count> [timeout]` – counts registered workers via `iii trigger engine::workers::list`.
- `wait_for_function <function_id> <worker> [timeout]` – triggers a status function and checks the worker field.

## Milestone Coverage

| Milestone | Script | What it proves |
|-----------|--------|----------------|
| S01 | `verify-s01.sh` | All workers register; engine console is reachable; integration tests pass. |
| S02 | `verify-s02.sh` | Vault encrypts and stores keys; no plaintext leaks to disk; selector returns classifications; TUI starts. |
| S05 | `verify-s05.sh` | SugarDB stores telemetry; SSE endpoint streams events; dashboard builds. |
| S06 | `verify-s06.sh` | Full `curl → gateway → brain → translator → vault → provider` pipeline works with SSE; unit tests pass. |

## Usage
```bash
bash scripts/parallel-start.sh   # quick parallel smoke test
bash scripts/verify-s01.sh       # run S01 milestone gate
bash scripts/verify-s02.sh       # run S02 milestone gate
bash scripts/verify-s05.sh       # run S05 milestone gate
bash scripts/verify-s06.sh       # run S06 milestone gate
```

## Notes
- All scripts use `set -euo pipefail` for strict error handling.
- Colored PASS/FAIL output is produced by helper functions.
- Scripts assume `iii` CLI is available on `PATH`.
- Temporary `data/` directories are always removed on exit, even after failures.
