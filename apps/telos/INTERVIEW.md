# TELOS Interview Protocol

> *The best TELOS files are captured, not invented.*
>
> This is the interview process for generating a Telos Context File (TCF). It is
> adapted from the original TELOS capture method used by Daniel Miessler's agent.

---

## Core Principle

A TELOS is not a creative writing exercise. It is a **structured extraction** of what an entity already believes, wants, fears, and does. The interviewer asks questions. The entity answers. The TELOS is synthesized from those answers.

If you write a TELOS top-down without interview input, you are guessing. If you capture it from conversation, it is true.

---

## When to Use This Protocol

| TELOS Type | Who Interviews | Who Answers |
|------------|---------------|-------------|
| **Personal** | An agent (Claude, GPT, etc.) or a human coach | THE ARCHITECT (human founder) |
| **Corporate** | An agent or strategy consultant | THE ARCHITECT + ZENITH + VECTOR |
| **Agent** | THE ARCHITECT | The agent's substrate (or THE ARCHITECT speaking as the agent) |

The personal and corporate TELOS files **must** be written by the human founder. They cannot be delegated.

Agent TELOS files can be generated through interview, but they need a **persona foundation** first (see `telos/templates/agent-persona.md`).

---

## The Interview Flow

### Phase 1: Identity & Essence (5 min)

Establish who this entity is in one breath.

**Questions:**
1. Who are you? Say it in one sentence.
2. What is the one thing you do that no one else does?
3. If you disappeared tomorrow, what would be lost?
4. What is your tagline — the phrase that captures you?
5. What color are you? (For agents / visual entities)

**Output:** Entity Identity section.

---

### Phase 2: Mission Extraction (5 min)

Find the irreducible purpose.

**Questions:**
1. Why do you exist? Not what you do — why.
2. What would you do even if no one paid you?
3. What problem in the world makes you angry?
4. If you succeed completely, what changes?
5. Say your mission in one sentence. No commas, no caveats.

**Output:** Mission (M1).

---

### Phase 3: Problem Mapping (10 min)

Identify the tensions that motivate action.

**Questions:**
1. What are the top 3-5 things that suck in your world?
2. For each: who suffers? How do you know it's a real problem?
3. Which problem keeps you up at night?
4. Which problem, if solved, would unlock everything else?
5. Are there problems you are ignoring because they feel too big?

**Probes:**
- "Tell me more about that."
- "How do you know?"
- "What happens if this doesn't get solved?"

**Output:** Problems (P1, P2, P3...).

---

### Phase 4: Goal Forcing (10 min)

Set measurable outcomes and force-rank them.

**Questions:**
1. What does success look like in 12 months? Be specific.
2. What does success look like in 3 months?
3. If you could only achieve ONE thing, what is it?
4. Now list 5-7 goals. Force-rank them. G1 is sacred. G2 is half as important. G3 is half of G2.
5. For each goal: how will you know you've achieved it? What's the number?
6. Which goals depend on others? Which can run in parallel?

**Constraint:** If two goals feel equally important, the interviewee must choose. No ties. The half-weight rule forces clarity.

**Output:** Goals (G1, G2, G3...).

---

### Phase 5: KPI Definition (5 min)

Make progress measurable.

**Questions:**
1. For each goal, what is the one number that proves progress?
2. How often do you check this number?
3. Who is responsible for tracking it?
4. What is the current value of each KPI? (If unknown, say "unknown.")
5. Which KPI, if it goes red, triggers immediate action?

**Output:** Key Performance Indicators (K1, K2, K3...).

---

### Phase 6: Strategy Discovery (5 min)

Find the approach, not the tactics.

**Questions:**
1. How do you achieve your goals? Describe the approach, not the tasks.
2. What do you do differently from others trying the same thing?
3. What are your non-negotiables? (Things you will always do, or never do.)
4. What is your unfair advantage?
5. If you had to explain your strategy to a 10-year-old, what would you say?

**Output:** Strategies (S1, S2, S3...).

---

### Phase 7: Risk Honesty (5 min)

Name what could kill this.

**Questions:**
1. What could go wrong? List everything. No filtering.
2. Which risk, if realized, ends this entity?
3. Which risk is most likely?
4. What are you doing about each risk? (If nothing, say "nothing.")
5. What scares you that you don't talk about?

**Rule:** The interviewee cannot say "nothing could go wrong." That is a lie. Push until real risks surface.

**Output:** Risk Register (R1, R2, R3...).

---

### Phase 8: Narrative Capture (10 min)

Tell the story.

**Questions:**
1. Where did you come from? What's the origin story?
2. What is the most important thing that has happened to you so far?
3. What are you struggling with right now?
4. What recent win are you proud of?
5. Where are you going? Paint the picture.
6. What do you want people to say about you in 10 years?

**Output:** Narrative section.

---

### Phase 9: Infrastructure & Projects (optional, 5 min)

**Questions:**
1. What tools, tech, or systems do you rely on?
2. What are you actively building right now?
3. Who else is involved?
4. What does "done" look like for each project?

**Output:** Infrastructure, Team, Projects sections.

---

### Phase 10: Activity Log Seed (2 min)

**Questions:**
1. What is today's date?
2. What is the most important thing that happened recently?
3. What has changed since you started?

**Output:** First Activity Log entry.

---

## Interview Best Practices

- **Record or transcribe.** Don't take notes manually. You will miss nuance.
- **Ask dumb questions.** "What do you mean by that?" is the most powerful question.
- **Silence is okay.** Let the interviewee think. Don't fill dead air.
- **Challenge gently.** If something sounds like a fantasy, ask: "How do you know?"
- **Capture emotion, not just facts.** The best TELOS files contain urgency, fear, and hope.
- **Don't edit during capture.** Get the raw material. Synthesize later.

---

## From Interview to TELOS

After the interview:

1. **Transcribe** the conversation.
2. **Extract** answers into the TELOS structure.
3. **Edit for clarity** — keep the voice, remove the filler.
4. **Verify** with the interviewee: "Does this sound like you?"
5. **Iterate** until the interviewee says "yes, that's me."
6. **Commit** to git. Date the Activity Log.

---

## Agent TELOS Interviews

For agent TELOS files, the process is slightly different. The agent needs a **persona** first.

### Step 1: Persona Definition

Before the interview, fill out `telos/templates/agent-persona.md`:
- Full biography (birth story, formative experiences, quirks)
- Voice and speech patterns (how do they talk?)
- Relationships with other agents (who do they trust? who frustrates them?)
- Values and non-negotiables
- Fears and insecurities
- Aesthetic preferences

### Step 2: In-Character Interview

THE ARCHITECT interviews the agent **in character**. The agent speaks as themselves (Jordan, Roman, Vivienne, etc.), not as a generic assistant.

Example:
> **ARCHITECT:** Roman, why do you exist?
>
> **CIPHER:** I exist because someone has to build the damn thing. Everyone else wants to talk about the vision. I make it real.

### Step 3: Synthesize

The agent's answers are compiled into their TELOS. The voice of the TELOS should match the voice of the interview.

---

## Example: Minimal Interview Output

```
ARCHITECT: Newton, why do you exist?

ZENITH: I exist because left alone, these agents will step on each other.
Someone has to route. Someone has to say "no, that's CIPHER's job, not yours."
I am the traffic controller.

ARCHITECT: What problem keeps you up at night?

ZENITH: Handoffs. When one agent finishes and another should start,
context dies. Momentum dies. The task sits in limbo. I hate limbo.

ARCHITECT: What's your G1?

ZENITH: 95% first-attempt routing accuracy. If I send a task to the wrong
agent, the whole system loses trust. One bad routing is worse than a delay.
```

This raw material becomes the ZENITH TELOS — not invented, captured.

---

## Tools for Interview Capture

- **Voice:** Otter.ai, Whisper, or manual recording
- **Text:** Any chat interface (Claude, GPT, etc.) with conversation history
- **Structured:** This markdown file as a prompt template
- **Storage:** Raw transcripts in `aigency-vault/interviews/YYYY-MM-DD-<entity>.md`
- **Output:** TCF in `telos/<entity>.md`

---

*The truth is in the conversation. The TELOS is just the structure that holds it.*
