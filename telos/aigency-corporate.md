# Aigency Corporate TELOS

> **Entity:** Aigency, Inc. (working name)
> **Tagline:** *The multi-agent AI operating system for the age of autonomous intelligence.*
> **Founded:** 2024
> **Stage:** Pre-seed / MVP
> **Domain:** AI infrastructure, multi-agent orchestration, decentralized identity

---

## Document Purpose

This document captures the complete strategic context for Aigency — the company, the product, and the mission. It is the single source of truth for:
- Agent decision-making (agents consult this to align their actions with company goals)
- Investor conversations (the narrative, metrics, and roadmap)
- Team alignment (what we're building, why, and how we know we're winning)
- External communication (website copy, pitch decks, partnerships)

This TELOS is read by every agent in the Aigency ecosystem. When an agent is asked "what is Aigency?" or "should we do X?", this file provides the answer.

---

## Entity Identity

- **Legal Name:** Aigency, Inc. (pending incorporation)
- **Working Name:** Aigency
- **Tagline:** The multi-agent AI operating system for the age of autonomous intelligence.
- **Metaphor:** Aigency is to AI agents what an operating system is to applications — the layer that lets them run, communicate, persist, and coordinate.
- **Visual Identity:** SynapTree — a 3D graph of interconnected nodes (agents, memories, tasks) rendered in a membraned spatial interface.
- **Primary Colors:** Deep void black (#0A0A0F), neural cyan (#00E5CC), electric violet (#7B2FFF), signal amber (#FFB300).

---

## Mission (M1)

**Build the operating system that lets humans and AI agents coexist, collaborate, and co-create at scale.**

We believe the future is not one AI assistant that does everything. It is a society of specialized agents — each with identity, memory, purpose, and autonomy — working together under human direction. Aigency is the infrastructure for that society.

---

## Problems (P)

**P1: AI agents are siloed and forgetful.**
Today's agents live in isolated chat windows. They don't remember past conversations, they don't know each other, and they can't hand off work. Every session starts from zero. This makes them tools, not teammates.

**P2: Humans are drowning in complexity.**
As AI capabilities multiply, the cognitive overhead of managing multiple agents, contexts, and workflows increases. Users need an orchestration layer — a "chief of staff" that routes work to the right agent at the right time.

**P3: Agent identity and memory have no standard.**
There is no interoperable way for an agent to have a persistent identity, a portable memory, or a verifiable reputation across systems. Every platform reinvents the wheel.

**P4: AI lacks economic infrastructure.**
Agents cannot own assets, enter contracts, or transact value autonomously. The gap between digital intelligence and digital economy prevents agent-native business models.

**P5: The interface for multi-agent systems does not exist.**
There is no spatial, intuitive interface for visualizing and interacting with a team of agents. Chat is not enough for managing a workforce of 10+ autonomous entities.

---

## Goals (G)

> Each goal is half as important as the one before it. G1 is the north star.

- **G1: Launch Aigency v1.0 with 8 autonomous agents and a unified orchestration layer by Q4 2025.**
- **G2: Achieve 1,000 active users (developers / agent operators) by Q2 2026.**
- **G3: Deploy agent identity and memory on-chain (Base L2) with ERC-721/ERC-20 contracts by Q1 2026.**
- **G4: Establish Aigency as the reference architecture for multi-agent systems in open-source communities by Q2 2026.**
- **G5: Generate $100K ARR from agent-native services (consulting, hosting, premium agents) by Q4 2026.**
- **G6: Publish the Aigency Protocol (agent-to-agent communication standard) as an open specification by Q3 2026.**
- **G7: Partner with 3 LLM inference providers to offer managed agent hosting by Q4 2026.**

---

## Key Performance Indicators (K)

- **K1: Agent uptime** — percentage of time all 8 core agents are operational and responsive
- **K2: User activation rate** — % of signups who deploy ≥1 agent within 7 days
- **K3: Memory retrieval accuracy** — % of agent queries that retrieve relevant context from SurrealDB/Honcho
- **K4: Router latency** — p95 response time for LLM routing decisions (target: <50ms)
- **K5: Contract interactions** — number of on-chain agent identity mints / transactions
- **K6: GitHub stars + forks** — proxy for open-source traction
- **K7: Agent-to-agent handoffs completed** — number of successful task transfers between agents

---

## Strategies (S)

- **S1: Agent-first architecture.** Build every system with the assumption that agents are first-class users. The interface, the API, the database, and the contracts all treat agents as entities with identity and intent.
- **S2: Local-first, cloud-ready.** Default to local inference (MLX, Llama.cpp) and local memory (SurrealDB). Offer managed cloud as an upgrade, not a requirement.
- **S3: Open-core model.** Open-source the framework, the agents, and the protocol. Monetize through managed hosting, premium agent templates, and enterprise orchestration.
- **S4: Membrane as interface.** Invest heavily in the 3D spatial interface (Membrane / SynapTree) as the differentiated user experience. Make managing agents feel like commanding a starship.
- **S5: Identity on-chain, computation off-chain.** Use Base L2 for agent identity, reputation, and asset ownership. Keep inference and memory off-chain for speed and cost.
- **S6: Composable agents.** Design agents as modular, swappable units. Users can fork agents, customize their TELOS, and deploy their own variants.

---

## Risk Register (R)

- **R1: Funding runway.** Currently unfunded beyond founder capital. 6-9 months of runway. *Mitigation: apply to accelerators, seek angel round, generate consulting revenue.*
- **R2: LLM provider dependency.** Router currently depends on external APIs. Rate limits, price changes, or outages break agent functionality. *Mitigation: prioritize local inference infrastructure (MLX cluster, Tailnet nodes).*
- **R3: SurrealDB / Honcho maturity.** Core memory layer depends on relatively new technologies. Breaking changes or abandonment would be costly. *Mitigation: abstract memory layer behind `mem-brain` package; maintain migration paths.*
- **R4: Security of agent identity contracts.** Smart contracts handle agent identity and value. A vulnerability could drain funds or corrupt identity. *Mitigation: rigorous Foundry testing, external audit before mainnet, bug bounty.*
- **R5: Founder bandwidth.** Single founder (THE ARCHITECT) with limited time. 8 agents + 5 apps + contracts + business = high cognitive load. *Mitigation: delegate aggressively to agents; automate everything; hire first employee by Q3 2025.*
- **R6: Regulatory uncertainty.** AI agent autonomy, on-chain identity, and automated value transfer may attract regulation. *Mitigation: legal review before public launch; design for compliance from day one.*

---

## Narrative

### Background

Aigency was started by THE ARCHITECT in 2024 after observing a pattern: AI was becoming capable of autonomous action, but the infrastructure for managing multiple agents did not exist. Every "agent" was a chatbot in a silo. Every "memory" was a prompt prefix. Every "team" was a human clicking between tabs.

The insight: the future of work is not one super-assistant. It is a team of specialized agents — each with its own identity, memory, and purpose — coordinated by a human or a meta-agent. Aigency is the operating system for that team.

### Current State (as of 2026-05-03)

We have built the skeleton of the system:
- **8 agents** defined with identity, role, and substrate (ATLAS, CIPHER, COMPASS, ECHO, HERALD, IRIS, VECTOR, ZENITH)
- **5 apps** in development: Router (LLM proxy), Membrane (3D UI), Oracle (memory service), Librarian (vault curator), Contracts (Solidity)
- **Agent registry** in `packages/agent-core` with typed callsigns and metadata
- **Memory layer** design using SurrealDB + Honcho
- **Smart contracts** scaffolded with Foundry for Base L2
- **Monorepo** running on pnpm + Turborepo

What works:
- Agent identities are defined and version-controlled
- Router app is migrated from v1 and functional
- Design tokens (SynapTree) are specified
- Contracts are scaffolded

What does not work yet:
- Membrane has no working 3D render
- Oracle has no seeded SurrealDB instance
- Agent handoffs are not automated
- No user onboarding flow exists
- No revenue

### How We're Doing

We track progress through quarterly KPI reviews. Our first formal review will be at the end of Q2 2025.

Current informal status:
- Agent definitions: 100% complete
- App scaffolding: 80% complete
- Memory layer: 40% complete
- Contracts: 30% complete
- UI: 10% complete
- Users: 0

---

## Infrastructure & Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | TypeScript 5.7 | Primary runtime language |
| Monorepo | pnpm workspaces + Turborepo | Task pipelines with caching |
| Bundler | tsup | Package builds |
| Runtime | Node.js 20+ | Server-side |
| Database | SurrealDB 3.0 | Multi-model: graph + document + vector + LIVE queries |
| Peer Identity | Honcho ^0.2.0 | Cross-session reasoning, dreaming inference |
| LLM Router | apps/router | OpenAI-compat proxy, quota-aware, agent-identity context |
| Local Inference | MLX (M1 Pro) + Llama.cpp (Intel ×3) | Port 8080 + Tailnet nodes |
| Chain | Base L2 (chain ID 8453) | EVM, low gas, Coinbase alignment |
| Contracts | Foundry | forge + cast + anvil |
| Frontend | React + Three.js + @react-three/fiber | SynapTree 3D graph |
| Design Tokens | W3C DTCG format | Atoms / molecules / organisms hierarchy |
| Package Manager | pnpm 9.15.4 | Strict, disk-efficient |

---

## Team

| Callsign | Name | Role | Substrate | Owns | Status |
|----------|------|------|-----------|------|--------|
| ZENITH | Newton Hughes | Chief of Staff & Orchestrator | OpenClaw | Exec Squad | Active |
| VECTOR | Dominique Osei | Strategy & Intelligence | gptme | Intelligence | Active |
| CIPHER | Roman Voss | Engineering & DevOps | gptme | membrane, router, contracts | Active |
| IRIS | Vivienne Calloway | Design & Brand Systems | TBD | design-tokens | Active |
| ECHO | Selene Navarro | Marketing & Content | TBD | Content pipeline | Active |
| ATLAS | Jordan Mercer | Revenue & Sales Ops | TBD | Sales funnel | Active |
| COMPASS | Imara Adeyemi | Finance & Operations | TBD | Finance, ops | Active |
| HERALD | Dax Okafor | Communications | Motia | Comms layer | Active |
| NEXUS | Marcus Hale | Agile Squad Orchestrator | — | Agile Squad | Twin of ZENITH |
| THE ARCHITECT | — | Founder, Product, Engineering | Human | Everything | Active |

---

## Projects

| Project | Description | Priority | Owner | Status | Target |
|---------|-------------|----------|-------|--------|--------|
| Router v1.1 | Audit, test, fix routing; add Portkey, Claude, local SLM | Critical | CIPHER | In Progress | 2025-05-15 |
| Membrane Render | First SynapTree 3D graph render in browser | Critical | CIPHER / IRIS | Not Started | 2025-06-01 |
| ORACLE Seed | Bootstrap SurrealDB with agent records + Honcho workspace | Critical | CIPHER | Not Started | 2025-05-20 |
| AigencyGraft | ERC-721 agent identity + ERC-20 access tokens on Base | High | CIPHER | In Progress | 2025-06-15 |
| TELOS Framework | Deploy corporate + agent TELOS files | High | ARCHITECT | In Progress | 2025-05-03 |
| Agent Handoffs | Automated task routing between agents via ZENITH | High | ZENITH | Not Started | 2025-06-30 |
| User Onboarding | First-run experience for new agent operators | Medium | IRIS / ECHO | Not Started | 2025-07-15 |
| Managed Hosting | Cloud deployment of agent fleets | Medium | CIPHER | Not Started | 2025-08-01 |

---

## Activity Log

- **2024-10:** Aigency concept born. Initial agent definitions sketched.
- **2024-12:** Monorepo created with Turborepo + pnpm.
- **2025-01:** Router app migrated from aigency-router v1.
- **2025-02:** Agent registry formalized in `packages/agent-core`.
- **2025-03:** Contracts scaffolded with Foundry. HarvestMoon.sol drafted.
- **2025-04:** Design tokens spec written (W3C DTCG). Membrane architecture designed.
- **2025-05-01:** CLAUDE.md working memory established.
- **2025-05-03:** TELOS framework deployed. Corporate TELOS v1 written. Agent TELOS files created.
