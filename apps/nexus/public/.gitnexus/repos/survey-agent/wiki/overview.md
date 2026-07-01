# survey-agent — Wiki

# Survey Agent 🤖📋 – Overview

Welcome to **survey-agent**! This repository contains an autonomous survey‑automation bot that logs into paid‑survey platforms, discovers available questionnaires, answers them using a user‑defined profile, solves CAPTCHAs, and handles withdrawals. The system runs headlessly with Playwright and includes anti‑detection tricks so its activity looks indistinguishable from a real user.

---

## Quick Start

```bash
# 1️⃣ Clone the repo
git clone https://github.com/yourorg/survey-agent.git
cd survey-agent

# 2️⃣ Install Python dependencies
pip install -r requirements.txt

# 3️⃣ Install Playwright browsers (headless + required drivers)
playwright install --with-deps

# 4️⃣ Prepare your profile (see [Profile Management](profile-management.md))
survey_agent cli profile create

# 5️⃣ Store site credentials (see [Site Adapters](site-adapters.md))
survey_agent cli credentials add --site example.com

# 6️⃣ Run the agent
survey_agent run
```

The helper scripts (`prepare`, `commit`, `format`, `lint:js`, `lint:js-fix`, `czg`) are defined in `package.json` for CI/CD convenience.

---

## High‑Level Architecture

```mermaid
flowchart TD
    CLI[CLI & Configuration] -->|starts| Orchestrator[Survey Orchestration]
    Orchestrator -->|uses| SiteAdapters[Site Adapters]
    SiteAdapters -->|drives| Browser[Browser Automation]
    Browser -->|executes| AnswerEngine[Answering Engine]
    AnswerEngine -->|reads| Profile[Profile Management]
    AnswerEngine -->|calls| Captcha[Captcha Solving]
    Orchestrator -->|loads| Config[Core (config & version)]
    AnswerEngine -->|queries| LLM[LLM Provider (gemini, groq, mistral, openai)]
```

*The diagram shows the main modules and the direction of control flow. A new developer can grasp the overall structure in under ten seconds.*

---

## Core Concepts

### 1. CLI & Configuration
The entry point for users. Commands such as `survey_agent cli profile`, `survey_agent cli credentials`, and `survey_agent run` are defined in the **[CLI & Configuration](cli-configuration.md)** module. It loads the global `AppConfig` (stored in `data/config.yaml`) and passes it downstream.

### 2. Survey Orchestration
`Survey Orchestrator` coordinates the whole lifecycle:

1. **Create a browser context** via the **[Browser Automation](browser-automation.md)** engine.
2. **Log into each target site** using a concrete **[Site Adapter](site-adapters.md)**.
3. **Discover surveys**, then spawn a `SurveySession` for each.
4. **Execute the session** – the orchestrator calls the **Answering Engine** for each question, handles retries, and records statistics.
5. **Withdraw earnings** when a session finishes.

### 3. Site Adapters
Each supported platform (e.g., `Prolific`, `Swagbucks`) implements the abstract `SiteAdapter` interface. Adapters are discovered automatically and only need to implement methods for authentication, survey discovery, question navigation, and optional helpers like CAPTCHA detection.

### 4. Browser Automation
A thin wrapper around Playwright (`PlaywrightEngine`) that adds:

* Realistic fingerprints (user‑agent, canvas, WebGL, etc.)
* Human‑like interaction timing (randomized delays, mouse movements)
* Proxy rotation and stealth plugins

All higher‑level modules interact with the abstract `BrowserEngine`, `BrowserContext`, and `BrowserPage` types, making the engine swappable.

### 5. Answering Engine
The heart of the question‑answer pipeline:

* **`question_classifier`** decides the question type (multiple‑choice, open‑ended, attention‑check).
* **`matcher`** selects the best answer from the **[Profile Management](profile-management.md)** data.
* **`attention_check`** detects traps and supplies safe fallback answers.
* For open‑ended prompts, the engine may call an **LLM Provider** (see flow below) to generate text that respects the user profile.

### 6. Profile Management
A versioned JSON store (`data/profile.json`) holds the user’s demographic and preference data. The profile can be populated interactively via the CLI or inferred from previous survey answers. The **Answering Engine** reads this profile to produce consistent, human‑like responses.

### 7. Captcha Solving
When a site presents a CAPTCHA, the **[Captcha Solving](captcha-solving.md)** pipeline:

1. Detects the CAPTCHA type.
2. Routes the challenge through a tiered solver (`CaptchaTier` → `CaptchaSolver`).
3. Returns a solution to the calling **Site Adapter**, which then proceeds with the survey.

### 8. LLM Provider
For generative answers, the system loads a language model via `survey_agent.llm_provider`. The retry wrapper `execute_with_retry` ensures robust calls to providers such as **Gemini**, **Groq**, **Mistral**, or **OpenAI**:

```
execute_with_retry → execute → start → get_llm → _get_<provider>
```

If a provider fails, the wrapper retries with exponential back‑off before falling back to a deterministic answer.

---

## Typical End‑to‑End Flow

1. **User runs** `survey_agent run` → **CLI & Configuration** parses args and loads `AppConfig`.
2. **Survey Orchestrator** creates a **Browser Automation** context.
3. For each configured site:
   * The **Site Adapter** logs in (using stored credentials).
   * The adapter calls `get_surveys` → discovers pending questionnaires.
4. For each survey:
   * The orchestrator starts a `SurveySession`.
   * The session asks the **Answering Engine** for the next question.
   * The engine consults **Profile Management** (and optionally an **LLM Provider**) to pick an answer.
   * The answer is submitted through **Browser Automation**.
   * If a CAPTCHA appears, the **Site Adapter** invokes **Captcha Solving**.
5. After all questions are answered, the session submits the survey, records the reward, and the orchestrator may trigger a withdrawal.
6. Logs and statistics are written to `data/` for later analysis.

---

## Getting Involved

- **Read the module docs**: each component is documented in its own wiki page (e.g., `[Answering Engine](answering-engine.md)`, `[Browser Automation](browser-automation.md)`).
- **Run the test suite**: `pytest -q` ensures your changes don’t break existing flows.
- **Add a new site**: implement a subclass of `SiteAdapter` and register it in `site_adapters/__init__.py`.
- **Improve anti‑detection**: tweak the `Browser Automation` fingerprints or add new human‑like interaction patterns.

Happy hacking, and may your surveys be ever profitable!