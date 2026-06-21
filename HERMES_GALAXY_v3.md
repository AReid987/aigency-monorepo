# HERMES GALAXY v3: Practical Deployment

## The Refined Architecture

You are right. The original v1 plan was already correct. The v2 container architecture was over-engineered. Here is the clean, practical architecture:

### The Core Insight

- **Hermes** (on VPS) = CEO. Receives venture ideas, orchestrates business, manages Paperclip, syncs GBrain.
- **Oh My Pi** (on your MacBook Pro) = CTO. The primary coding engine. LSP, DAP, debugger, 53 language servers, 14 debug adapters, eval kernels, time-traveling stream rules.
- **Claude Code** (spawned by OMP) = Specialist delegate. When OMP needs gstack skills, it spawns Claude Code as a sub-agent. Claude Code runs gstack, PAUL, CARL, SEED inside its session. Results flow back to OMP.
- **Paperclip + GBrain + Galaxy Canvas + DenchClaw** (on VPS) = Always-on services. Memory, business OS, visual canvas, CRM.

This is the right separation: heavy compute (coding) runs on your local machine with your files. Orchestration and memory run on the VPS. Everything connects via Tailscale.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ORACLE CLOUD ARM INSTANCE (Always Free Tier)                              │
│  4 OCPU, 24 GB RAM, 200 GB block storage                                    │
│  Tailscale: galaxy-oracle (100.x.x.x)                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Hermes (Python) — CEO / Base Agent                               │       │
│  │  Port: 8080 (tailnet only)                                       │       │
│  │  MCP server, API, cron, sub-agents, 60+ tools                     │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Hermes Workspace (React + Node.js) — Web Control Plane           │       │
│  │  Port: 3000 → tailscale serve https://workspace.tailxx.ts.net    │       │
│  │  Chat, Files, Terminal, Swarm, Conductor, Dashboard               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Galaxy Canvas (React + Fastify) — Spatial SDLC Workbench        │       │
│  │  Port: 3001 → tailscale serve https://canvas.tailxx.ts.net       │       │
│  │  7 lanes, real-time sync, venture zones, knowledge pins           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Paperclip (Node.js + SQLite) — Venture Orchestration            │       │
│  │  Port: 3100 → tailscale serve https://paperclip.tailxx.ts.net    │       │
│  │  Org charts, budgets, goals, tickets, heartbeats, governance      │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  GBrain (Bun + PGLite) — Persistent Knowledge + Graph            │       │
│  │  Port: 50051 (gRPC MCP), 3002 (HTTP)                            │       │
│  │  Hybrid search, auto-link graph, dream cycle, synthesis           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  DenchClaw (Node.js + OpenClaw) — CRM Satellite                  │       │
│  │  Port: 3200 → tailscale serve https://denchclaw.tailxx.ts.net    │       │
│  │  Contacts, deals, pipelines, bridged to Paperclip via REST        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  All services run as Docker containers on a single docker-compose           │
│  No public IPs. No firewall rules. Tailscale handles all access.           │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Tailscale WireGuard (encrypted)
                              │ No public internet exposure
                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER'S DEVICES (same tailnet)                                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  MacBook Pro (M-series) — Primary Development Machine             │       │
│  │                                                                   │       │
│  │  ┌────────────────────────────────────────────────────────────┐  │       │
│  │  │  Oh My Pi (Rust) — CTO / Primary Coding Engine               │  │       │
│  │  │                                                              │  │       │
│  │  │  • 53 LSP language servers                                   │  │       │
│  │  │  • 14 DAP debug adapters (lldb, dlv, debugpy)              │  │       │
│  │  │  • Python + JS eval kernels with agent tool callbacks        │  │       │
│  │  │  • Time-traveling stream rules (TTSR)                        │  │       │
│  │  │  • 40+ LLM providers                                        │  │       │
│  │  │  • Sub-agent spawning (Claude Code, Codex, etc.)             │  │       │
│  │  │                                                              │  │       │
│  │  │  Connects to Hermes on VPS:                                  │  │       │
│  │  │  grpc://galaxy-oracle:8080 (Tailscale)                       │  │       │
│  │  └────────────────────────────────────────────────────────────┘  │       │
│  │                              │                                   │       │
│  │  ┌────────────────────────────────────────────────────────────┐  │       │
│  │  │  Claude Code (spawned by OMP as sub-agent)                  │  │       │
│  │  │                                                              │  │       │
│  │  │  • gstack skills (23+ specialists)                           │  │       │
│  │  │  • PAUL execution loop (Plan-Apply-Unify)                   │  │       │
│  │  │  • CARL dynamic rule injection                              │  │       │
│  │  │  • SEED venture incubator                                   │  │       │
│  │  │  • AEGIS quality audit (when triggered)                     │  │       │
│  │  │                                                              │  │       │
│  │  │  OMP spawns Claude Code when:                               │  │       │
│  │  │  - gstack skill needed (e.g., /office-hours, /review)        │  │       │
│  │  │  - PAUL loop required for complex project                   │  │       │
│  │  │  - CARL rules needed for context-aware guidance              │  │       │
│  │  │  - Browser automation (/qa, /browse) required                 │  │       │
│  │  │                                                              │  │       │
│  │  │  Claude Code returns results to OMP.                         │  │       │
│  │  │  OMP integrates, runs LSP/DAP checks, commits.               │  │       │
│  │  └────────────────────────────────────────────────────────────┘  │       │
│  │                                                                   │       │
│  │  GBrain sync client (reads local cache, syncs to VPS)            │       │
│  │  Local working directory: ~/galaxy/ventures/{id}/                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Intel MacBook Pro #1 — Overflow / Parallel Sessions             │       │
│  │  Can run additional OMP sessions for parallel ventures           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Intel MacBook Pro #2 — QA / Testing Machine                     │       │
│  │  Browser automation, mobile testing, staging environments        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Intel MacBook Pro #3 — Design / Content Machine                   │       │
│  │  Design tools, content generation, video, image editing          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  iPhone / iPad — Mobile Access                                     │       │
│  │  Tailscale app → access all services on tailnet                  │       │
│  │  Hermes Telegram/Discord/Slack bot for voice/text commands     │       │
│  │  Paperclip PWA (read-only dashboard)                             │       │
│  │  Galaxy Canvas view (limited interaction)                        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why This Architecture Works

| Component | Location | Why | Access |
|-----------|----------|-----|--------|
| Hermes | Oracle VPS | Must be always-on for heartbeats, cron, webhooks | Tailscale: `grpc://galaxy-oracle:8080` |
| Paperclip | Oracle VPS | Must be always-on for budget tracking, ticket system | Tailscale: `https://paperclip.tailxx.ts.net` |
| GBrain | Oracle VPS | Must be always-on for dream cycle, sync, search | Tailscale: `grpc://galaxy-oracle:50051` |
| Galaxy Canvas | Oracle VPS | Must be always-on for real-time collaboration | Tailscale: `https://canvas.tailxx.ts.net` |
| DenchClaw | Oracle VPS | Must be always-on for CRM data, deal tracking | Tailscale: `https://denchclaw.tailxx.ts.net` |
| Hermes Workspace | Oracle VPS | Web UI for management, always accessible | Tailscale: `https://workspace.tailxx.ts.net` |
| Oh My Pi | Local MacBook | Needs file access, LSP servers, debuggers, IDE integration | Native: `~/galaxy/ventures/` |
| Claude Code | Local MacBook (spawned by OMP) | Needs gstack skills, browser automation, local git | Spawned by OMP subprocess |
| GBrain cache | Local MacBook | Fast local reads, syncs to VPS | `~/.gbrain/` |
| Working files | Local MacBook | Code lives where you edit it | `~/galaxy/ventures/{id}/` |

---

## Task Delegation Flow

```
User: "Build auth flow for NoteTaker"
  │
  ▼
Hermes (VPS) receives message via Telegram/Discord/Workspace
  │
  ▼
Hermes checks GBrain: "What do I know about NoteTaker?"
  │
  ▼
Hermes updates Paperclip: Create ticket "Implement auth flow"
  │
  ▼
Hermes sends gRPC task to OMP:
  {
    "task": "implement auth flow",
    "venture": "notetaker-2026-001",
    "context": { ... from GBrain ... },
    "budget_remaining": 182.57,
    "skills_available": ["gstack", "paul", "carl", "aegis"]
  }
  │
  ▼ (Tailscale encrypted tunnel)
OMP (MacBook) receives task
  │
  ▼
OMP evaluates: "This needs gstack skills. Spawning Claude Code."
  │
  ▼
OMP spawns Claude Code as sub-agent:
  `claude -p --task "implement auth flow for NoteTaker"     --context ~/galaxy/ventures/notetaker-2026-001/     --skills gstack,paul,carl`
  │
  ▼
Claude Code (sub-agent) initializes:
  - Loads gstack skills from ~/.claude/skills/gstack/
  - Initializes PAUL in .paul/ directory
  - CARL loads DEVELOPMENT domain rules
  - GBrain MCP connected for context
  │
  ▼
Claude Code runs gstack /autoplan:
  - Generates implementation plan
  - Writes to .paul/plan.md
  │
  ▼
Claude Code implements (PAUL Apply phase):
  - Writes code
  - Runs tests
  - Commits
  │
  ▼
Claude Code runs gstack /review:
  - Finds 2 issues, auto-fixes 1
  - Flags 1 for OMP decision
  │
  ▼
Claude Code returns to OMP:
  - Results, diffs, test output, commit hashes
  - Cost report: $4.56 (54K tokens)
  │
  ▼
OMP integrates results:
  - Runs LSP checks on new code
  - Runs DAP debugger if needed
  - Validates with local test suite
  - Final commit
  │
  ▼
OMP sends results back to Hermes:
  - Code: committed, 3 files changed
  - Tests: 42 passing, coverage 87%
  - Cost: $4.56
  - Status: DONE
  │
  ▼
Hermes updates Paperclip:
  - Ticket: "Implement auth flow" → DONE
  - Budget: $4.56 deducted from venture
  │
  ▼
Hermes updates GBrain:
  - Write: "Auth flow implemented for NoteTaker"
  - Auto-link: `notetaker` → `has_feature` → `auth`
  - Sync code changes
  │
  ▼
Hermes updates Galaxy Canvas:
  - Card in BUILD lane: "Auth flow" → ✅ DONE
  - Move to REVIEW lane if /review flagged issues
  │
  ▼
Hermes sends user message:
  "Auth flow done. 3 files, 42 tests passing. $4.56 spent. Review found 1 minor issue — want me to fix it?"
```

---

## Oracle Cloud Always Free Deployment

### What You Get (Free Forever)

| Resource | Spec | Cost |
|----------|------|------|
| ARM Ampere A1 | 4 OCPU, 24 GB RAM | $0 |
| AMD x86 VM #1 | 1/8 OCPU, 1 GB RAM | $0 |
| AMD x86 VM #2 | 1/8 OCPU, 1 GB RAM | $0 |
| Block Storage | 200 GB total | $0 |
| Egress | 10 TB/month | $0 |
| Boot Volume | 200 GB (Oracle Linux / Ubuntu) | $0 |

**Recommendation:** Use the ARM instance as the primary server. The 2 AMD instances are too small (1GB RAM) for the core services, but could be used for:
- A lightweight cache/proxy
- A backup node
- Or just leave them unused and focus all resources on the ARM instance

### Resource Allocation (ARM: 4 OCPU, 24 GB RAM)

Using **PGLite** for GBrain (no separate Postgres) and **SQLite** for Paperclip (no separate Postgres):

| Service | OCPU | RAM | Storage | Why This Much |
|---------|------|-----|---------|--------------|
| Hermes | 0.5 | 2 GB | 5 GB | Moderate Python process, mostly idle |
| Hermes Workspace | 0.5 | 2 GB | 5 GB | React + Node.js, moderate traffic |
| Galaxy Canvas | 0.25 | 1 GB | 2 GB | Fastify + WebSocket, lightweight |
| Paperclip | 0.5 | 2 GB | 5 GB | Node.js + SQLite, moderate traffic |
| GBrain | 1.0 | 6 GB | 50 GB | Bun + PGLite + embeddings + graph ops |
| DenchClaw | 0.25 | 1 GB | 5 GB | Node.js + OpenClaw, lightweight |
| Tailscale | 0.25 | 1 GB | 1 GB | WireGuard tunnel, minimal |
| OS + Docker | 0.5 | 2 GB | 20 GB | Ubuntu + Docker overhead |
| **Headroom** | **0.25** | **7 GB** | **107 GB** | For spikes, growth, scaling |
| **Total** | **4.0** | **24 GB** | **200 GB** | Fits perfectly |

**If you want full Postgres instead of PGLite/SQLite:**
- Add Postgres: 0.5 OCPU, 4 GB RAM, 20 GB storage
- Reduce GBrain to 0.5 OCPU, 4 GB RAM (it uses Postgres instead of PGLite)
- Total still fits: 4.25 OCPU, 24 GB RAM (slight overcommit on CPU, OK for burst)

**Recommendation:** Start with PGLite + SQLite. Migrate to Postgres when you hit 10K+ pages in GBrain or 10+ ventures in Paperclip. The migration paths are built into both tools.

### Step-by-Step Oracle Setup

**Step 1: Create Oracle Cloud Account**
```
1. Go to https://www.oracle.com/cloud/free/
2. Sign up with your email (credit card required for verification, but not charged)
3. Choose your home region (e.g., US East Ashburn, US West Phoenix, UK London)
4. Wait for account activation (usually instant, sometimes up to 24 hours)
```

**Step 2: Create ARM Instance**
```
1. Console → Compute → Instances → Create Instance
2. Name: galaxy-oracle
3. Image: Ubuntu 22.04 (or Oracle Linux 8, but Ubuntu is easier for Docker)
4. Shape: VM.Standard.A1.Flex
5. OCPU: 4
6. Memory: 24 GB
7. Boot Volume: 200 GB
8. Network: Create new VCN (Virtual Cloud Network)
   - VCN name: galaxy-vcn
   - Subnet: public subnet
   - Security list: allow SSH (port 22) from your IP only
   - **Important:** Do NOT open ports 3000, 3100, 8080, 50051 to the internet
   - These will be accessed ONLY via Tailscale (encrypted tunnel)
9. SSH key: Generate or upload your public key
10. Create
```

**Step 3: Install Docker + Docker Compose**
```bash
# SSH into the instance (from your MacBook)
ssh -i ~/.ssh/your-key ubuntu@<instance-public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version  # 24.x or higher
docker-compose --version  # 2.20 or higher

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker
```

**Step 4: Install Tailscale**
```bash
# One-line install (Linux)
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate with your tailnet
sudo tailscale up
# You will see a URL. Open it in your browser and authenticate.
# The VPS will join your existing tailnet.

# Verify
sudo tailscale status
# Should show: galaxy-oracle (your VPS) + your MacBooks + iPhone + iPad

# Set a friendly name
sudo tailscale set --hostname galaxy-oracle
```

**Step 5: Clone Galaxy Repo**
```bash
git clone https://github.com/your-org/galaxy.git
cd galaxy
```

**Step 6: Configure Secrets**
```bash
mkdir -p shared/secrets

# Add your API keys (these are the keys for the services running on the VPS)
echo "YOUR_ANTHROPIC_KEY" > shared/secrets/anthropic.key      # For Hermes model routing
echo "YOUR_OPENROUTER_KEY" > shared/secrets/openrouter.key    # For Hermes multi-model
echo "YOUR_OPENAI_KEY" > shared/secrets/openai.key            # Optional: for Codex reviews
chmod 600 shared/secrets/*
```

**Step 7: Start Core Services**
```bash
# The docker-compose file is optimized for Oracle ARM
docker-compose -f docker-compose.oracle.yml up -d

# This starts: Hermes, Workspace, Canvas, Paperclip, GBrain, DenchClaw
# All in one command. Takes ~2-3 minutes on first run.
```

**Step 8: Verify**
```bash
# All services should be healthy
docker ps

# Hermes API
curl http://localhost:8080/health

# GBrain MCP
gbrain doctor --remote localhost:50051

# From your MacBook (on the tailnet):
curl http://galaxy-oracle:8080/health
```

**Step 9: Configure Tailscale Serve (HTTPS)**
```bash
# On the VPS, run these commands to expose each web UI via HTTPS:

# Hermes Workspace
sudo tailscale serve --https=443 --target=localhost:3000
# Now accessible at: https://galaxy-oracle.tailxx.ts.net

# Paperclip
sudo tailscale serve --https=443 --target=localhost:3100
# Accessible at: https://paperclip.galaxy-oracle.tailxx.ts.net
# Wait — actually tailscale serve only supports one port per hostname.
# For multiple services, use subdomains or different ports.

# Alternative: Use tailscale funnel for public HTTPS (if needed)
# But for tailnet-only access, use direct IPs:
# http://galaxy-oracle:3000 (Workspace)
# http://galaxy-oracle:3100 (Paperclip)
# http://galaxy-oracle:3001 (Canvas)
# http://galaxy-oracle:3200 (DenchClaw)
# http://galaxy-oracle:8080 (Hermes API)
# grpc://galaxy-oracle:50051 (GBrain MCP)
```

Actually, for multiple HTTPS services, the cleanest approach is:

```bash
# Option A: Different ports on the same hostname (simplest)
# Tailscale gives you a stable IP. Use different ports:
# https://galaxy-oracle.tailxx.ts.net:3000 (Workspace)
# https://galaxy-oracle.tailxx.ts.net:3100 (Paperclip)
# etc.

# Option B: Use a simple reverse proxy on the VPS (e.g., Caddy)
# Caddy handles HTTPS automatically with Tailscale certificates
# docker-compose includes Caddy as a service
# Then: https://workspace.galaxy-oracle.tailxx.ts.net
#       https://paperclip.galaxy-oracle.tailxx.ts.net
#       https://canvas.galaxy-oracle.tailxx.ts.net
# etc.

# Option C: Just use HTTP on the tailnet (it's already encrypted by WireGuard)
# http://galaxy-oracle:3000 is perfectly safe inside your tailnet
# No HTTPS needed because Tailscale encrypts the transport
# This is the simplest and most common approach for internal tools
```

**Recommendation:** Use **Option C** (HTTP on tailnet). Tailscale's WireGuard encryption means HTTP inside the tailnet is as secure as HTTPS on the public internet. No certificate management, no reverse proxy, no configuration. Just `http://galaxy-oracle:3000` from any device on your tailnet.

---

## Tailscale Integration: The Right Way

### TSD Proxy vs. Direct Tailscale

| Approach | What It Is | When to Use | For Galaxy? |
|----------|-----------|-------------|-------------|
| **TSD Proxy** | Tailscale's proxy service. Makes a device accessible via a public URL through a Tailscale proxy. | Sharing with people NOT on your tailnet | **No** — everything is on your tailnet |
| **tailscale serve** | Built-in HTTPS server. Exposes one port as HTTPS on your tailnet hostname. | Single web service, public HTTPS | **Maybe** — only if you want browser HTTPS warnings gone |
| **tailscale funnel** | Like `serve` but public internet. Anyone can access. | Public-facing service | **No** — Galaxy is private |
| **Direct HTTP on tailnet** | Just access `http://hostname:port` from any tailnet device. Transport is WireGuard-encrypted. | Internal tools, private networks | **YES** — This is the right choice |

**Why direct HTTP is correct for Galaxy:**
- Your tailnet is already private (only your devices + the VPS)
- WireGuard encryption is military-grade
- No certificate management headaches
- No reverse proxy to configure
- All your devices (MacBooks, iPhone, iPad) can access everything immediately
- It's how Tailscale is designed to be used

### Your Tailnet Setup

You already have:
- MacBook Pro (M-series)
- Intel MacBook Pro #1
- Intel MacBook Pro #2
- Intel MacBook Pro #3
- iPhone
- iPad

After adding the VPS:
- galaxy-oracle (VPS)

**Access from any device:**
```bash
# From your MacBook:
open http://galaxy-oracle:3000          # Hermes Workspace
open http://galaxy-oracle:3100          # Paperclip
open http://galaxy-oracle:3001          # Galaxy Canvas
open http://galaxy-oracle:3200          # DenchClaw

# From iPhone (Tailscale app installed):
# Safari → http://galaxy-oracle:3000
# All services work immediately. No VPN config needed.
```

**Tailscale DNS:**
- Tailscale automatically assigns DNS names: `galaxy-oracle`, `macbook-pro`, etc.
- No need to remember IPs
- MagicDNS works across all devices

**Tailscale ACLs (Access Control Lists):**
```json
// In your Tailscale admin console (https://login.tailscale.com/admin/acls)
// Restrict which devices can access which ports

{
  "acls": [
    // MacBooks (admin devices) can access everything
    {
      "action": "accept",
      "src": ["tag:admin"],
      "dst": ["tag:galaxy:*"]
    },
    // iPhone/iPad can only access web UIs (not APIs)
    {
      "action": "accept",
      "src": ["tag:mobile"],
      "dst": ["tag:galaxy:3000", "tag:galaxy:3100", "tag:galaxy:3001", "tag:galaxy:3200"]
    }
  ],
  "tagOwners": {
    "tag:admin": ["your-email@example.com"],
    "tag:mobile": ["your-email@example.com"]
  }
}
```

---

## MacBook Pro Setup: OMP as CTO

### Install Oh My Pi

```bash
# On your primary MacBook Pro (M-series)
curl -fsSL https://omp.sh/install | sh

# Or via Homebrew
brew install can1357/tap/omp

# Or via Bun
bun install -g @oh-my-pi/pi-coding-agent

# Verify
omp --version
```

### Configure OMP to Connect to Hermes

Create `~/.omp/config.toml`:
```toml
[hermes]
endpoint = "grpc://galaxy-oracle:8080"
api_key = "YOUR_HERMES_API_KEY"
venture_dir = "~/galaxy/ventures"

[subagents]
# Define which sub-agents OMP can spawn
claude = { command = "claude", args = ["-p"], skills = ["gstack", "paul", "carl", "seed"] }
codex = { command = "codex", args = [], skills = ["gstack"] }

[gstack]
enabled = true
skills_dir = "~/.claude/skills/gstack"
auto_update = true

[brain]
# Local GBrain cache (syncs with VPS)
cache_dir = "~/.gbrain"
sync_endpoint = "grpc://galaxy-oracle:50051"
```

### Install gstack, PAUL, CARL, SEED for Claude Code

When OMP spawns Claude Code as a sub-agent, Claude Code needs the skills installed:

```bash
# Install gstack (Claude Code skill pack)
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --host claude

# Install PAUL (execution loop)
npx paul-framework --install

# Install CARL (dynamic rules)
npx carl-core --install

# Install SEED (venture incubator)
npm i -g @chrisai/seed
```

### OMP Sub-Agent Workflow

```bash
# OMP receives task from Hermes
omp task --from-hermes "implement auth flow for notetaker-2026-001"

# OMP evaluates: needs gstack skills
# OMP spawns Claude Code sub-agent:
omp subagent spawn claude   --task "implement auth flow"   --context ~/galaxy/ventures/notetaker-2026-001   --skills gstack,paul,carl   --budget 50

# Inside the sub-agent session:
# Claude Code loads gstack, runs /autoplan, implements, runs /review
# Claude Code returns results to OMP

# OMP integrates:
# - Runs LSP checks on new code
# - Runs DAP debugger if needed
# - Runs local test suite
# - Commits final code

# OMP reports back to Hermes:
omp report --to-hermes --status DONE --cost 4.56
```

### OMP Can Also Work Directly

For tasks that don't need gstack (e.g., quick fixes, refactoring):
```bash
# OMP handles directly without spawning Claude Code
omp edit --file src/auth.ts --instruction "add JWT validation"
omp test --run
omp commit --message "feat: add JWT validation"
```

OMP's LSP, DAP, and eval kernels handle this natively. No sub-agent needed.

---

## The 2 AMD Instances (What to Do With Them)

The 2 AMD x86 instances (1/8 OCPU, 1 GB RAM each) are too small for the core services. Here are practical uses:

**Option 1: Warm Worker Nodes (Recommended)**
```
AMD Instance #1: galaxy-worker-1
- Pre-installed with OMP dependencies
- On standby for overflow when your MacBook is busy
- Hermes can dispatch lightweight tasks here

AMD Instance #2: galaxy-worker-2
- Pre-installed with browser automation dependencies (Playwright)
- Dedicated QA/testing node
- Runs /qa, /benchmark without competing with your main work
```

**Option 2: Monitoring & Backup**
```
AMD Instance #1: galaxy-monitor
- Prometheus + Grafana (lightweight monitoring)
- Alerts if ARM instance goes down

AMD Instance #2: galaxy-backup
- Nightly backup of GBrain, Paperclip, venture repos
- Off-instance storage for disaster recovery
```

**Option 3: Just Ignore Them**
- The ARM instance handles everything comfortably
- The AMD instances are a nice-to-have but not critical
- You can spin them up later if needed

**Recommendation:** Start with Option 1. Pre-configure them as warm workers. When you have 5+ ventures running in parallel, your MacBook might max out. Hermes can overflow to the AMD instances. They're x86, so some tools might behave slightly differently — but OMP is cross-platform.

---

## Docker Compose for Oracle ARM

```yaml
# docker-compose.oracle.yml
version: '3.8'

services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: galaxy-hermes
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2G
    volumes:
      - ./shared/secrets:/secrets:ro
      - ./shared/gbrain:/gbrain:rw
      - ./shared/paperclip:/paperclip:rw
      - ./shared/ventures:/ventures:rw
    environment:
      - HERMES_API_PORT=8080
      - HERMES_GBRAIN_MCP=grpc://localhost:50051
      - HERMES_PAPERCLIP_API=http://localhost:3100
      - HERMES_CANVAS_API=http://localhost:3001
      - HERMES_MODEL_PROVIDER=openrouter
      - HERMES_OPENROUTER_KEY_FILE=/secrets/openrouter.key
    ports:
      - "8080:8080"
    networks:
      - galaxy-internal
    restart: unless-stopped

  hermes-workspace:
    image: galaxy/hermes-workspace:latest
    container_name: galaxy-workspace
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2G
    environment:
      - HERMES_API_URL=http://galaxy-hermes:8080
      - GBRAIN_API_URL=http://galaxy-gbrain:3002
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3100
      - CANVAS_API_URL=http://galaxy-canvas:3001
    ports:
      - "3000:3000"
    networks:
      - galaxy-internal
    restart: unless-stopped

  galaxy-canvas:
    image: galaxy/galaxy-canvas:latest
    container_name: galaxy-canvas
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 1G
    environment:
      - DATABASE_URL=sqlite:///data/canvas.db
      - HERMES_API_URL=http://galaxy-hermes:8080
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3100
      - GBRAIN_API_URL=http://galaxy-gbrain:3002
    volumes:
      - ./shared/canvas:/data:rw
    ports:
      - "3001:3001"
    networks:
      - galaxy-internal
    restart: unless-stopped

  paperclip:
    image: paperclipai/paperclip:latest
    container_name: galaxy-paperclip
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2G
    environment:
      - DATABASE_URL=sqlite:///data/paperclip.db
      - HERMES_API_URL=http://galaxy-hermes:8080
      - DENCHCLAW_API_URL=http://galaxy-denchclaw:3200
    volumes:
      - ./shared/paperclip:/data:rw
    ports:
      - "3100:3100"
    networks:
      - galaxy-internal
    restart: unless-stopped

  gbrain:
    image: garrytan/gbrain:latest
    container_name: galaxy-gbrain
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 6G
    environment:
      - GBRAIN_ENGINE=pglite
      - GBRAIN_DATA_DIR=/brain
      - MCP_SERVER_PORT=50051
      - HTTP_SERVER_PORT=3002
    volumes:
      - ./shared/gbrain:/brain:rw
    ports:
      - "50051:50051"
      - "3002:3002"
    networks:
      - galaxy-internal
    restart: unless-stopped

  denchclaw:
    image: denchhq/denchclaw:latest
    container_name: galaxy-denchclaw
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 1G
    environment:
      - DENCHCLAW_WEB_PORT=3200
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3100
    volumes:
      - ./shared/denchclaw:/data:rw
    ports:
      - "3200:3200"
    networks:
      - galaxy-internal
    restart: unless-stopped

  # Tailscale runs as a sidecar to provide tailnet access
  # Alternatively, install Tailscale directly on the host (recommended)
  # This service is optional if host Tailscale is configured
  tailscale:
    image: tailscale/tailscale:latest
    container_name: galaxy-tailscale
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - TS_AUTHKEY_FILE=/secrets/tailscale.key
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_HOSTNAME=galaxy-oracle
    volumes:
      - ./shared/tailscale:/var/lib/tailscale
      - ./shared/secrets:/secrets:ro
    networks:
      - galaxy-internal
    restart: unless-stopped

networks:
  galaxy-internal:
    driver: bridge
```

---

## Summary: What Changed from v2

| v2 (Over-Engineered) | v3 (Practical) | Why |
|----------------------|----------------|-----|
| Core Plane + Worker Plane containers | Single ARM VPS + local MacBooks | Coding belongs on your machine, not in a container |
| Claude Code as primary coding engine | **Oh My Pi as primary**, Claude Code as sub-agent | OMP is the best-in-class coding surface |
| Claude Code runs gstack directly | OMP spawns Claude Code as sub-agent when gstack needed | OMP manages the full workflow, delegates only when skills required |
| 15 parallel worker containers | OMP sub-agents + local MacBooks for overflow | OMP already has sub-agent support |
| Complex gRPC between containers | Simple gRPC over Tailscale | Tailscale handles everything |
| TSD Proxy for access | Direct HTTP on tailnet (WireGuard encrypted) | Simpler, no extra config, already secure |
| Public IPs + firewall rules | No public exposure except SSH | Tailscale is the only entry point |
| 2 AMD instances unused | AMD instances as warm overflow workers | Put the free resources to work |

---

*Document: HERMES GALAXY v3. Architecture: OMP-First with Oracle Cloud + Tailscale.*
*Last updated: 2026-05-01*
