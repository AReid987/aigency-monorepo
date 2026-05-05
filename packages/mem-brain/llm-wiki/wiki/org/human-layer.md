# Human Layer — Aigency Core Org Chart

> **Confidence:** 1.0 (canonical source)  
> **Last confirmed:** 2026-05-03  
| **Sources:** `raw/aigency-specs/org-core.md`

---

## Executive Command Structure

```
Antonio Reid
Founder & CEO
@ReidTheArchitect
        |
        |---------------------------------------------|
   Product & Engineering                        Operations & Growth
   (AI-assisted via Meta Code Squad)            (AI-assisted via Aigency Agents)
        |                                             |
        |-- Platform Architecture                     |-- Marketing & GTM
        |-- Development Execution                     |-- Community & Partnerships
        |-- Infrastructure & DevOps                   |-- Revenue & Customer Success
        |-- Quality & Security                        |-- Finance & Legal
```

---

## Antonio Reid — Founder & CEO

- **Authority:** Final decision on all product, architecture, and strategic decisions
- **Primary interface:** Telegram (@ReidTheArchitect), Nebula AI
- **Escalation target:** All agent blockers, ambiguities, and open questions route here
- **Tooling:** Nebula AI (orchestration), GitHub (code review), Linear (sprint tracking), Notion (strategy docs)

---

## Product Domains

| Domain | Description | Primary Squad |
|--------|-------------|---------------|
| **Aigency Core Platform** | Main dev platform powering all products | [Meta Code Squad](../squads/meta-code-squad.md) |
| **SimpleLLMRouter** | Multi-provider LLM routing layer | Meta Code Squad |
| **Forge Quality** | Code quality enforcement system | Meta Code Squad |
| **LP Generator** | Landing page generation pipeline | [Landing Page Squad](../squads/landing-page-squad.md) |
| **Learning Accelerator / Forge** | AI-powered learning platform | [Agile Squad](../squads/agile-squad.md) |
| **Project Blackout** | Stealth — TBD | TBD |
| **Hyperlocal** | Hyperlocal product (TBD) | TBD |
| **Aigency World** | 3D environment viewer | TBD |

---

## Decision Authority Matrix

| Decision Type | Owner | Approver |
|---------------|-------|----------|
| Architecture changes | Gemini CLI (drafts) | Antonio Reid |
| Sprint scope | Ruflo (proposes) | Antonio Reid |
| Production deploys | CI/CD pipeline | Antonio Reid (merge approval) |
| New agent creation | Nebula AI | Antonio Reid |
| External partnerships | TBD | Antonio Reid |
| Budget / spend | TBD | Antonio Reid |

---

## Communication Channels

| Channel | Purpose |
|---------|---------|
| Telegram @ReidTheArchitect | Primary async communication with AI agents |
| GitHub PRs | Code review and merge decisions |
| Linear | Sprint tracking and backlog management |
| Notion | Strategy, OKRs, and long-form documentation |
| Nebula AI | AI orchestration and agent delegation |

---

## Escalation Protocol

```
Agent detects blocker
        |
Add to .planning/prp.md section 9 (Open Questions)
        |
Ruflo reviews and attempts resolution
        |
If unresolved: Ruflo notifies Antonio via Telegram
        |
Antonio provides direction within 24 hours
        |
Agent resumes execution
```

---

## Related Pages

- [agent-network.md](./agent-network.md) — The AI agent counterpart to this human layer
- [../constitution.md](../constitution.md) — Governance principles all agents follow
- [../squads/meta-code-squad.md](../squads/meta-code-squad.md) — Primary squad serving this org structure
