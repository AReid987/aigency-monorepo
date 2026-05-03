# TELOS — Deep Context Framework for Aigency

> *Telos* (τέλος): purpose, end, goal, ultimate aim.
>
> TELOS is an open-sourced framework for creating Deep Context about things that matter to humans.
> Adapted for Aigency from [danielmiessler/Telos](https://github.com/danielmiessler/Telos).

---

## What TELOS Is

A **Telos Context File (TCF)** is a single markdown document that captures the complete identity, purpose, and operational state of an entity — whether a person, a company, or an AI agent.

When an entity has a TELOS, it can answer questions about itself with coherence, make decisions aligned with its goals, and communicate its narrative without hallucinating its own identity.

For Aigency, TELOS files serve as the **ground truth** for:
- **Corporate identity** — what Aigency is, why it exists, where it's going
- **Agent identity** — what each agent believes, owns, and pursues
- **Personal identity** — the founder's / ARCHITECT's own telos

---

## TELOS Structure (Aigency Adaptation)

Every TCF follows this structure. Sections marked `(optional)` may be omitted for simpler entities (e.g. a lightweight agent).

### 1. Document Purpose
What this TELOS is for, who uses it, and how it shapes decisions.

### 2. Entity Identity
- **Name / Callsign** — the entity's identifier
- **Role / Title** — what it does in the system
- **Tagline** — one-sentence essence
- **Color** — visual identity (for agents)
- **Substrate** — runtime / inference engine (for agents)

### 3. Mission (M)
The single immutable purpose. Why this entity exists.

### 4. Problems (P)
The problems this entity was created to solve, ordered by severity. Each problem is a tension in the world that motivates action.

### 5. Goals (G)
The measurable outcomes pursued. Each goal is half as important as the one before it (G1 > G2 > G3 ...). This forces ruthless prioritization.

### 6. Key Performance Indicators (KPI)
How progress is measured. Each KPI maps to one or more goals.

### 7. Strategies (S)
The approaches taken to achieve goals. Strategies are stable; tactics change.

### 8. Risk Register (R)
What could go wrong. Ordered by likelihood × impact.

### 9. Narrative
The story of where this entity came from, where it is now, and where it's going. Includes current state, recent wins, and active struggles.

### 10. Infrastructure & Stack (optional)
Tech stack, tools, dependencies, and environment details.

### 11. Team & Ownership (optional)
For composite entities: who is involved, what they own, their skills.

### 12. Projects (optional)
Active and planned initiatives with priority, status, timeline, and cost.

### 13. Activity Log
A streaming changelog of updates to goals, KPIs, risks, or projects. This section is **append-only** and dated. It serves as the entity's memory of its own evolution.

---

## TELOS in the Aigency Ecosystem

```
telos/
├── TELOS.md                 ← this file — the framework spec
├── aigency-corporate.md     ← Aigency Inc. corporate telos
├── architect-personal.md    ← THE ARCHITECT personal telos
└── agents/
    ├── atlas.md
    ├── cipher.md
    ├── compass.md
    ├── echo.md
    ├── herald.md
    ├── iris.md
    ├── vector.md
    └── zenith.md
```

### How Agents Use TELOS

Each agent's `agent.yaml` gains a `telos` field pointing to its TCF:

```yaml
# agents/zenith/agent.yaml
callsign: ZENITH
name: "Newton Hughes"
role: "Chief of Staff & Orchestrator"
telos: "../../telos/agents/zenith.md"   # ← NEW
```

When an agent is invoked, its substrate (OpenClaw, gptme, Motia, etc.) loads the TELOS as system context. The agent can then:
- Answer "what are you working on?" from its Projects section
- Answer "what do you care about most?" from its Mission + G1
- Answer "what's blocking you?" from its Risk Register
- Prioritize incoming tasks against its Goals hierarchy
- Report status by reading its Activity Log

### TELOS as Living Documents

TELOS files are **not static**. They are:
- **Version-controlled** — every change is tracked in git
- **Append-only logs** — Activity Log grows; old entries are never deleted
- **Reviewed quarterly** — Goals, KPIs, and Risks are reassessed
- **Agent-maintained** — agents update their own Activity Logs and KPIs

---

## TELOS Grammar

Use this shorthand when referencing TELOS sections in conversation or code:

| Shorthand | Meaning |
|-----------|---------|
| `M1` | Mission #1 (there is usually only one) |
| `P1`, `P2` | Problem #1, Problem #2 |
| `G1`, `G2` | Goal #1, Goal #2 (G1 is twice as important as G2) |
| `K1`, `K2` | KPI #1, KPI #2 |
| `S1`, `S2` | Strategy #1, Strategy #2 |
| `R1`, `R2` | Risk #1, Risk #2 |
| `PRJ-001` | Project reference |
| `YYYY-MM-DD` | Activity log entry date |

---

## Writing a TELOS v1

1. **Start with Mission.** If you can't articulate why you exist in one sentence, stop.
2. **List Problems.** What sucks in the world that you're fixing?
3. **Set Goals.** Be specific, measurable, time-bound. Force-rank them.
4. **Define KPIs.** If you can't measure it, you can't manage it.
5. **State Strategies.** How will you achieve the goals?
6. **Log Risks.** Be honest about what could kill this.
7. **Write the Narrative.** Tell the story. Make it real.
8. **Add Activity.** Seed with today's date and current state.

Then iterate. A TELOS is never "done" — it evolves as the entity evolves.

---

## License

MIT — derived from danielmiessler/Telos.
