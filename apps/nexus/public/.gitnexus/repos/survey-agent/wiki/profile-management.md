# Profile Management

# Profile Management Module

## Overview
The Profile Management module provides a **persistent, versioned user profile** that can be populated interactively (interview) or inferred from survey answers (resolver).  
It defines a fixed set of profile categories and fields, stores values in JSON files, tracks every change, and offers utilities for prompting, answering, and resolving profile data.

## Core Concepts
| Concept | Description |
|---------|-------------|
| **Category** | Logical grouping of related fields (e.g. `demographics`, `employment`). |
| **Field** | Individual attribute definition (`key`, `label`, `type`, optional `options`). |
| **Dotted key** | `"category.field"` string used to address a value in the store. |
| **ProfileStore** | Handles loading, saving, querying, and history tracking of profile data. |
| **Interview** | Generates a list of prompts from the category definitions and applies user answers. |
| **Resolver** | Maps free‑form survey questions to profile fields via keyword matching and can map stored values to a set of answer options. |

## Architecture Diagram
```mermaid
flowchart TD
    C[Categories (CATEGORIES)] -->|defines| I[Interview]
    C -->|defines| R[Resolver]
    I -->|uses| S[ProfileStore]
    R -->|uses| S
    S -->|persists to| P[profile.json & profile_history.json]
```

## Components

### 1. `categories.py`
- **Data structures**
  - `ProfileField(BaseModel)`: `key`, `label`, `field_type`, `options`, `description`.
  - `ProfileCategory(BaseModel)`: `key`, `label`, `description`, `fields`.
- **Exports**
  - `CATEGORIES`: list of all `ProfileCategory` objects.
  - `get_category(key)`: returns a `ProfileCategory` or `None`.
  - `get_all_field_keys()`: returns a dict mapping `"category.field"` → human‑readable label.

### 2. `store.py`
- **Class `ProfileStore`**
  - **Constructor** `ProfileStore(profile_path, history_path=None)`: loads existing JSON files or creates empty structures.
  - **Private helpers**
    - `_load()`: reads profile and history JSON.
    - `_save()`: writes profile and history JSON.
  - **Public API**
    - `get(key, default=None)`: retrieve a value by dotted key.
    - `set(key, value, source="manual")`: store a value, record a `ProfileChange`, and persist.
    - `get_category(category)`: shallow copy of all fields in a category.
    - `get_all()`: full nested dict of the profile.
    - `history(key=None, limit=50)`: list of recent `ProfileChange` objects, optionally filtered.
    - `correct(key, new_value, note="")`: shortcut for `set(..., source="correction")`.
    - `summary()`: multi‑line string with headings per category and field values.
    - `to_context_string()`: compact one‑line‑per‑field representation for LLM prompts.
    - `completion_pct()`: percentage of defined fields that have a stored value.
- **Data model**
  - `ProfileChange(BaseModel)`: `timestamp`, `key`, `old_value`, `new_value`, `source`.

### 3. `interview.py`
- **Functions**
  - `interview_prompt_for_field(field, category_label) -> str`: builds a human‑readable prompt, including options and description.
  - `build_interview_questions() -> list[dict]`: walks `CATEGORIES` and returns a list of dicts containing metadata (`category`, `field_key`, `prompt`, etc.) for each field.
  - `apply_answer(store, category, field_key, answer, field_type, options=None) -> bool`: validates and converts `answer` according to `field_type`, then calls `store.set(dotted_key, value, source="interview")`. Returns `True` if the answer was accepted, `False` otherwise.

### 4. `resolver.py`
- **Keyword mapping**
  - `KEYWORD_MAP`: static dict mapping lower‑case phrase fragments to dotted profile keys.
- **Functions**
  - `match_question_to_profile(question_text) -> str | None`: finds the longest matching keyword fragment in `question_text` and returns the associated dotted key.
  - `resolve_answer(store, question_text) -> Any`: uses `match_question_to_profile` then `store.get` to retrieve the stored value.
  - `resolve_answer_with_options(store, question_text, available_options) -> str | None`: obtains the stored answer, then attempts to map it to one of `available_options` using exact, substring, and edit‑distance matching.

## Interaction Flow

1. **Profile creation / update**
   - CLI (`profile_setup`) or other UI calls `ProfileStore.set` directly.
   - Each `set` writes to disk (`_save`) and appends a `ProfileChange` entry.

2. **Interview**
   - `build_interview_questions` generates prompts.
   - For each user response, `apply_answer` validates and stores the value via `ProfileStore.set`.

3. **Resolution from survey**
   - When a survey question is processed, `resolver.match_question_to_profile` finds the target profile field.
   - `resolver.resolve_answer` fetches the stored value.
   - If the survey UI expects a list of options, `resolver.resolve_answer_with_options` maps the stored value to the closest option.

4. **Viewing / reporting**
   - `ProfileStore.summary` produces a markdown‑style overview.
   - `ProfileStore.to_context_string` provides a compact representation for LLM prompts.
   - `ProfileStore.completion_pct` reports profile completeness.

## Extending the Profile

### Adding a New Category / Field
1. Edit `categories.py` and append a new `ProfileCategory` with its `ProfileField`s.
2. No code changes are required elsewhere; the new definitions are automatically included in:
   - Interview prompt generation (`build_interview_questions`).
   - Summary rendering (`summary`).
   - Completion percentage calculation (`completion_pct`).

### Custom Validation
If a field requires special validation beyond the generic type handling in `apply_answer`, wrap the call:

```python
if field.key == "custom_field":
    if not my_custom_check(answer):
        return False
```

Or subclass `ProfileStore` and override `set` to inject validation logic.

## Integration Points

| Module | Calls ProfileStore | Purpose |
|--------|-------------------|---------|
| `survey_agent/cli.py` | `set`, `correct`, `get`, `completion_pct`, `summary` | CLI commands for profile setup, update, and display. |
| `survey_agent/answering/matcher.py` | `get` (via `resolve_answer`) | Retrieves profile values when answering survey questions. |
| `survey_agent/profile/interview.py` | `set` (via `apply_answer`) | Populates profile interactively. |
| `survey_agent/profile/resolver.py` | `get` (via `resolve_answer`) | Maps external survey questions to stored profile data. |

## Example Usage

```python
from pathlib import Path
from survey_agent.profile.store import ProfileStore
from survey_agent.profile.interview import build_interview_questions, apply_answer

# Initialise store (creates files if missing)
store = ProfileStore(Path("data/profile.json"))

# Generate interview prompts
questions = build_interview_questions()
for q in questions:
    print(q["prompt"])
    user_input = input()
    apply_answer(
        store,
        category=q["category"],
        field_key=q["field_key"],
        answer=user_input,
        field_type=q["field_type"],
        options=q["options"],
    )

# Show a summary
print(store.summary())

# Check completeness
print(f"Profile completeness: {store.completion_pct():.1f}%")
```

## API Reference

### `ProfileStore`
| Method | Signature | Description |
|--------|-----------|-------------|
| `__init__` | `(profile_path: str | Path, history_path: str | Path \| None = None)` | Load or create profile and history files. |
| `get` | `(key: str, default: Any = None) -> Any` | Return value for `"category.field"` or `default`. |
| `set` | `(key: str, value: Any, source: str = "manual") -> None` | Store value, record change, persist to disk. |
| `get_category` | `(category: str) -> dict[str, Any]` | Shallow copy of all fields in a category. |
| `get_all` | `() -> dict[str, dict[str, Any]]` | Full profile dict. |
| `history` | `(key: str \| None = None, limit: int = 50) -> list[ProfileChange]` | Retrieve recent changes. |
| `correct` | `(key: str, new_value: Any, note: str = "") -> None` | Shortcut for `set(..., source="correction")`. |
| `summary` | `() -> str` | Human‑readable markdown‑style overview. |
| `to_context_string` | `() -> str` | Compact string for LLM context. |
| `completion_pct` | `() -> float` | Percentage of defined fields that have values. |

### `interview.py`
| Function | Signature | Description |
|----------|-----------|-------------|
| `interview_prompt_for_field` | `(field: ProfileField, category_label: str) -> str` | Build prompt text for a single field. |
| `build_interview_questions` | `() -> list[dict]` | Produce a list of question dicts for the whole profile. |
| `apply_answer` | `(store: ProfileStore, category: str, field_key: str, answer: str, field_type: str, options: list[str] \| None = None) -> bool` | Validate and store a user answer. |

### `resolver.py`
| Function | Signature | Description |
|----------|-----------|-------------|
| `match_question_to_profile` | `(question_text: str) -> str \| None` | Keyword‑based mapping to a dotted profile key. |
| `resolve_answer` | `(store: ProfileStore, question_text: str) -> Any` | Retrieve stored value for a matched question. |
| `resolve_answer_with_options` | `(store: ProfileStore, question_text: str, available_options: list[str]) -> str \| None` | Map stored value to the best matching option (exact → substring → edit distance). |

## Testing & Debugging Tips
- **Inspect raw data**: `store._data` and `store._history` contain the in‑memory structures.
- **Validate completeness**: `store.completion_pct()` should approach 100 % after a full interview.
- **History audit**: `store.history()` returns chronological `ProfileChange` objects; useful for rollback or debugging unexpected overwrites.
- **Keyword mapping**: Extend `KEYWORD_MAP` in `resolver.py` when new survey phrasing appears.

--- 

*End of Profile Management documentation.*