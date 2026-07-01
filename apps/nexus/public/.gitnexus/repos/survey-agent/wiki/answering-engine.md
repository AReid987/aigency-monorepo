# Answering Engine

# Answering Engine

The **Answering Engine** is the core of the survey automation pipeline. It interprets a survey question, determines the appropriate answer from the user profile, optionally generates open‑ended text, detects and handles attention‑check questions, and finally fills the form element on the page using a human‑like interaction model.

---

## Table of Contents
1. [High‑level Flow](#high-level-flow)  
2. [Key Components](#key-components)  
   - [question_classifier](#question_classifier)  
   - [matcher](#matcher)  
   - [attention_check](#attention_check)  
   - [open_ended](#open_ended)  
   - [form_filler](#form_filler)  
3. [Public API (`survey_agent.answering.__init__`)](#public-api)  
4. [Integration Points](#integration-points)  
5. [Extending the Engine](#extending-the-engine)  
6. [Architecture Diagram](#architecture-diagram)  

---

## High‑level Flow <a name="high-level-flow"></a>

1. **Question extraction** – The orchestrator obtains the current question text and, optionally, the raw HTML of the form element.  
2. **Classification** – `question_classifier.classify` (or `classify_from_page_elements`) determines a `QuestionType`.  
3. **Attention‑check detection** – `AttentionCheckHandler.handle` runs before any normal answer logic. If an attention check is found, its explicit instruction is obeyed and the answer is returned immediately.  
4. **Answer resolution** –  
   - For *closed* questions (radio, checkbox, select, scale, etc.) the engine calls `matcher.resolve_answer_with_options`, which:
     1. Maps the question text to a profile key via `matcher.match_question_to_profile`.
     2. Retrieves the raw profile value with `matcher.resolve_answer`.
     3. Chooses the best matching option from the list of available choices (exact, substring, or edit‑distance fallback).  
   - For *open‑ended* questions the engine uses `OpenEndedGenerator.generate` to produce a natural‑language response based on the profile context.  
5. **Form filling** – `FormFiller.fill` receives the `QuestionType`, CSS selector, resolved answer value, and the list of options (if applicable). It dispatches to a private `_fill_*` method that interacts with the page through the `BrowserPage` API and the `HumanBehavior` helper to simulate realistic clicks, typing, and delays.  

If any step fails, the orchestrator can fall back to a default strategy (e.g., skip the question or log an error).

---

## Key Components <a name="key-components"></a>

### `question_classifier` <a name="question_classifier"></a>

*File:* `survey_agent/answering/question_classifier.py`

| Symbol | Description |
|--------|-------------|
| `QuestionType` | `Enum` of supported question categories (`RADIO`, `CHECKBOX`, `TEXT`, `TEXTAREA`, `SELECT`, `SCALE`, `SLIDER`, `DATE`, `MATRIX`, `OPEN_ENDED`). |
| `_PATTERNS` | List of regex patterns paired with a `QuestionType`. Used when HTML context is unavailable. |
| `classify(question_text, html_context="")` | Returns a `QuestionType` based on HTML hints first, then regex matching. |
| `classify_from_page_elements(elements)` | Alternative classifier that works on a list of DOM element descriptors (`{'tag': ..., 'type': ..., 'role': ...}`). |

**How it works**  
- If `html_context` contains recognizable tags (`<textarea>`, `type="radio"` …) the function returns the corresponding type immediately.  
- Otherwise it lower‑cases the question text and iterates over `_PATTERNS`. The first matching regex determines the type.  
- When no pattern matches, the default is `QuestionType.TEXT`.

### `matcher` <a name="matcher"></a>

*File:* `survey_agent/answering/matcher.py`

| Symbol | Description |
|--------|-------------|
| `match_question_to_profile(question_text)` | Keyword‑based lookup that returns a dotted profile key (e.g. `"demographics.age"`). |
| `resolve_answer(store, question_text)` | Retrieves the raw profile value for the matched key (`store.get(key)`). |
| `resolve_answer_with_options(store, question_text, available_options)` | Returns the best‑matching option string for a closed‑question list. Uses exact, substring, then edit‑distance matching. |

**Implementation notes**  
- `KEYWORD_MAP` (from `profile.resolver`) maps keyword strings to profile keys. The matcher picks the longest keyword that appears in the question text.  
- Edit distance is computed with a classic DP algorithm; the option with the smallest distance is selected when no exact/substring match exists.

### `attention_check` <a name="attention_check"></a>

*File:* `survey_agent/answering/attention_check.py`

| Symbol | Description |
|--------|-------------|
| `AttentionCheck` (dataclass) | Holds the original instruction, the extracted target value, and the full question text. |
| `ATTENTION_PATTERNS` | Regex list that captures common attention‑check phrasings (e.g., “select strongly agree for this row”). |
| `detect_attention_check(question_text)` | Returns an `AttentionCheck` instance if any pattern matches, otherwise `None`. |
| `AttentionCheckHandler` | Stateful helper that tracks how many checks were detected (`detected_count`). Its `handle` method returns the answer for a detected check, handling arithmetic, numeric entry, or option matching. |

**Typical usage**  
```python
handler = AttentionCheckHandler()
answer = handler.handle(question_text, available_options)
if answer is not None:
    # short‑circuit: use `answer` and skip normal resolution
```

### `open_ended` <a name="open_ended"></a>

*File:* `survey_agent/answering/open_ended.py`

| Symbol | Description |
|--------|-------------|
| `OpenEndedGenerator` | Generates LLM prompts that embed the user profile and a style guide. |
| `build_prompt(question)` | Returns a multi‑line prompt string ready for an LLM. |
| `generate(question, llm_fn=None)` | Calls `build_prompt`; if `llm_fn` is supplied, forwards the prompt to the LLM and returns the response, otherwise returns the prompt itself (useful for external processing). |
| `update_style(**kwargs)` | Mutates the internal style guide (tone, length, vocabulary, avoid list). |

**Style guide defaults**  
- Tone: `casual-professional`  
- Length: `medium` (2‑4 sentences)  
- Vocabulary: `everyday`  
- Avoid: AI‑sounding phrases, overly formal language, lists

### `form_filler` <a name="form_filler"></a>

*File:* `survey_agent/answering/form_filler.py`

| Symbol | Description |
|--------|-------------|
| `FormFiller` | Central class that maps a `QuestionType` to a concrete filling routine. |
| `fill(page, question_type, selector, value, options=None)` | Public entry point; dispatches to the appropriate `_fill_*` method. Returns `True` on success, `False` on error. |
| Private helpers (`_fill_radio`, `_fill_checkbox`, `_fill_text`, `_fill_textarea`, `_fill_select`, `_fill_scale`, `_fill_slider`, `_fill_date`) | Each implements the interaction pattern for its input type, using `HumanBehavior` for realistic delays, clicks, typing, and selection. |
| `_matches(expected, actual)` | Case‑insensitive fuzzy matcher used by radio/checkbox/select helpers. |

**Interaction model**  
- All DOM queries (`query_selector`, `query_selector_all`, `evaluate`) are performed on a `BrowserPage` instance (from `survey_agent.browser.engine`).  
- Human‑like actions (`human_click`, `human_type`, `human_select`, `random_delay`) are delegated to `HumanBehavior`.  
- Errors are caught, logged, and cause `fill` to return `False` without raising.

---

## Public API (`survey_agent.answering.__init__`) <a name="public-api"></a>

```python
from survey_agent.answering import (
    classify, QuestionType,
    match_question_to_profile, resolve_answer, resolve_answer_with_options,
    FormFiller, OpenEndedGenerator,
    detect_attention_check, AttentionCheckHandler,
)
```

- **Classification** – `classify(question_text, html_context)` / `QuestionType` enum.  
- **Profile mapping** – `match_question_to_profile`, `resolve_answer`, `resolve_answer_with_options`.  
- **Form interaction** – `FormFiller`.  
- **Open‑ended generation** – `OpenEndedGenerator`.  
- **Attention‑check utilities** – `detect_attention_check`, `AttentionCheckHandler`.

All symbols are exported via `__all__` for convenient import.

---

## Integration Points <a name="integration-points"></a>

| Component | Consumes | Provides |
|-----------|----------|----------|
| **Orchestrator** (`survey_agent.orchestrator`) | Calls `classify`, `resolve_answer_with_options`, `OpenEndedGenerator.generate`, `FormFiller.fill` | Supplies `BrowserPage`, `ProfileStore`, and optional LLM callable |
| **Profile Store** (`survey_agent.profile.store.ProfileStore`) | Used by `matcher.resolve_answer` to fetch raw values | Returns any JSON‑serializable value |
| **Browser Engine** (`survey_agent.browser.engine.BrowserPage`) | Consumed by `FormFiller` for DOM queries and script evaluation | Provides async methods `query_selector`, `query_selector_all`, `evaluate` |
| **HumanBehavior** (`survey_agent.browser.human_behavior.HumanBehavior`) | Injected into `FormFiller` (default constructed) | Simulates realistic user actions (click, type, delay) |
| **Sites modules** (`survey_agent.sites.*`) | Use `classify` via `_classify_from_context` to obtain `QuestionType` | Pass HTML snippets or element descriptors to improve classification accuracy |

The engine is deliberately stateless except for `AttentionCheckHandler` (which tracks detection count) and the optional `HumanBehavior` instance.

---

## Extending the Engine <a name="extending-the-engine"></a>

### Adding a New Question Type
1. **Update `QuestionType`** – Add a new enum member (e.g., `RATING`).  
2. **Extend `question_classifier`** – Add a regex or HTML detection rule that returns the new type.  
3. **Implement a `_fill_<type>` method** in `FormFiller` that knows how to interact with the DOM element.  
4. **Add a case branch** in `FormFiller.fill`'s `match` statement.  

### Custom Answer Mapping
- Provide a custom `KEYWORD_MAP` entry for the new question phrasing.  
- If the answer requires transformation (e.g., converting a date string to ISO format), wrap `resolve_answer_with_options` or create a new helper that post‑processes the raw profile value.

### Alternative Human Behavior
- Subclass `HumanBehavior` and override methods (`human_click`, `human_type`, etc.) to inject different delay strategies or logging.  
- Pass the subclass instance to `FormFiller` at construction time.

### Plug‑in LLM
- Supply a callable to `OpenEndedGenerator.generate`. The callable must accept a prompt string and return the generated answer.  
- For batch processing, wrap the generator in a coroutine that respects rate limits.

---

## Architecture Diagram <a name="architecture-diagram"></a>

```mermaid
flowchart TD
    A[Orchestrator] -->|question text| B[question_classifier]
    B --> C{QuestionType}
    C -->|attention check| D[AttentionCheckHandler]
    D -->|answer| E[FormFiller]
    C -->|closed| F[matcher.resolve_answer_with_options]
    F --> G[ProfileStore]
    G -->|raw value| F
    F -->|selected option| E
    C -->|open ended| H[OpenEndedGenerator]
    H -->|prompt| I[LLM (optional)]
    I -->|answer| E
    E -->|interact| J[BrowserPage + HumanBehavior]
```

The diagram shows the decision flow from classification through attention‑check handling, profile lookup, optional LLM generation, and finally form interaction.

---