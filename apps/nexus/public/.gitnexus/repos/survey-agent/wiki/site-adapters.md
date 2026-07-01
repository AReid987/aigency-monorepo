# Site Adapters

# Site Adapters

## Overview

The **Site Adapters** module provides a pluggable framework for interacting with third‑party survey platforms.  
Each platform is represented by a concrete subclass of `SiteAdapter` that implements a well‑defined asynchronous interface for:

* Authentication (login / logout)  
* Survey discovery (`get_surveys`)  
* Survey execution (`start_survey`, `get_current_question`, `answer_question`, `submit_survey`)  
* Account management (`get_balance`, `withdraw`)  
* Optional helpers (`detect_captcha`, `is_logged_in`)

Adapters are discovered automatically via the `SiteRegistry` and can be instantiated by their unique **site slug** (e.g. `"branded-surveys"`).

---

## Core Data Models (`survey_agent/sites/base.py`)

| Class | Purpose | Fields |
|-------|---------|--------|
| **Survey** | Represents a discovered survey on a site’s dashboard. | `id: str`, `title: str`, `url: str`, `estimated_minutes: int = 0`, `reward: float = 0.0`, `metadata: dict[str, Any]` |
| **Question** | Represents a single question within a survey. | `id: str`, `text: str`, `question_type: str` (radio, checkbox, text, …), `options: list[str] | None`, `required: bool = True`, `metadata: dict[str, Any]` |
| **Answer** | User‑provided answer for a `Question`. | `question_id: str`, `value: Any` |
| **SiteBalance** | Balance information for a site account. | `available: float`, `pending: float`, `currency: str = "USD"` |
| **WithdrawalResult** | Outcome of a withdrawal attempt. | `success: bool`, `amount: float`, `method: str`, `message: str = ""` |

All models are simple `@dataclass` containers, making them easy to construct, serialize, and compare.

---

## Abstract Adapter (`SiteAdapter`)

```python
class SiteAdapter(ABC):
    def __init__(self, credential_store: CredentialStore | None = None,
                 profile_store: ProfileStore | None = None):
        self.credentials = credential_store or CredentialStore()
        self.profile = profile_store
```

### Required properties

| Property | Description |
|----------|-------------|
| `site_slug` | Unique identifier used by the registry (e.g. `"branded-surveys"`). |
| `base_url` | Root URL of the target site. |
| `display_name` | Human‑readable name shown in UI / logs. |

### Required async methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `login` | `async def login(self, page: BrowserPage) -> bool` | Perform site‑specific login flow; return `True` on success. |
| `get_surveys` | `async def get_surveys(self, page: BrowserPage) -> list[Survey]` | Scrape the dashboard for available surveys. |
| `start_survey` | `async def start_survey(self, page: BrowserPage, survey: Survey) -> bool` | Navigate to a survey URL and trigger the start button. |
| `get_current_question` | `async def get_current_question(self, page: BrowserPage) -> Question | None` | Parse the currently displayed question; return `None` when the survey is finished. |
| `answer_question` | `async def answer_question(self, page: BrowserPage, question: Question, answer: Answer) -> bool` | Submit an answer; returns `True` on success. |
| `submit_survey` | `async def submit_survey(self, page: BrowserPage) -> bool` | Click the final “Submit/Finish” button. |
| `get_balance` | `async def get_balance(self, page: BrowserPage) -> SiteBalance` | Retrieve the account’s available and pending balances. |
| `withdraw` | `async def withdraw(self, page: BrowserPage, amount: float, method: str = "paypal") -> WithdrawalResult` | Initiate a withdrawal request. |

### Optional helpers (override as needed)

* `detect_captcha(page)` – Detects CAPTCHAs on the current page. Default returns `False`.
* `is_logged_in(page)` – Determines login state. Default returns `False`.
* `logout(page)` – Performs a site‑specific logout flow.

All methods receive a `BrowserPage` instance from the internal browser engine, allowing adapters to drive a headless (or visible) Chromium session with human‑like delays via `HumanBehavior`.

---

## Registry (`survey_agent/sites/registry.py`)

The registry maintains a global mapping **slug → adapter class**.

```python
_registry: dict[str, type[SiteAdapter]] = {}
```

### Registration decorator

```python
def register(slug: str):
    def decorator(cls):
        _registry[slug] = cls
        return cls
    return decorator
```

Usage (see `branded_surveys.py`):

```python
@register("branded-surveys")
class BrandedSurveysAdapter(SiteAdapter):
    ...
```

### `SiteRegistry` class

* **Discovery** – `_discover_adapters` walks the `survey_agent.sites` package, importing every module except `base`, `registry`, and `__init__`. Importing a module triggers its `@register` decorator, populating `_registry`.
* **API**  
  * `list_sites() -> list[str]` – Returns all registered slugs.  
  * `has_adapter(slug) -> bool` – Checks registration.  
  * `get_adapter(slug, **kwargs) -> SiteAdapter` – Instantiates the adapter (passes any extra kwargs to the adapter’s `__init__`).

The registry is instantiated once at import time (`SiteRegistry()`), ensuring adapters are ready for use throughout the application.

---

## Concrete Example: Branded Surveys (`survey_agent/sites/branded_surveys.py`)

### Registration

```python
@register("branded-surveys")
class BrandedSurveysAdapter(SiteAdapter):
    ...
```

### Key implementation highlights

| Method | Important internal calls | Remarks |
|--------|--------------------------|---------|
| `login` | `page.goto`, `page.query_selector`, `page.fill`, `page.click`, `self.is_logged_in` | Retrieves credentials from `CredentialStore`, fills email/password, clicks submit, then validates login via `is_logged_in`. |
| `is_logged_in` | `page.url` | Checks URL for dashboard fragments. |
| `get_surveys` | `page.goto`, `page.query_selector_all`, `elem.evaluate` | Scrapes survey cards, extracts title, URL, and reward points. |
| `start_survey` | `page.goto`, `page.query_selector`, `self._has_questions` | Navigates to the survey URL, clicks a “Start/Begin” button, or falls back to content inspection. |
| `get_current_question` | `page.query_selector`, `page.content`, `_classify_from_context`, `_extract_options` | Detects question container, extracts text, classifies type via `question_classifier.classify`, and gathers possible options. |
| `answer_question` | Delegates to `_answer_radio`, `_answer_checkbox`, `_answer_text`, `_answer_select`, `_answer_scale` based on `question.question_type`. |
| `_answer_*` helpers | Various `page.query_selector[_all]`, `label.click`, `input.fill`, `HumanBehavior.human_type/select` | Implement concrete interaction patterns for each question type. |
| `submit_survey` | Loop over a list of possible submit button selectors, `page.query_selector`, `click` | Stops at the first matching button. |
| `get_balance` | `page.goto`, `page.query_selector`, `evaluate` | Parses a balance element and extracts a numeric value. |
| `withdraw` | `page.goto`, `page.query_selector`, `click` | Looks for a PayPal option and clicks it. |
| `detect_captcha` | `page.content` | Simple keyword search for common CAPTCHA strings. |

All interaction steps are wrapped with `HumanBehavior` delays (`random_delay`, `human_type`, `human_select`) to mimic real user behavior and reduce bot detection.

---

## Interaction Flow

Below is a high‑level flow of a typical survey session using a registered adapter.

```mermaid
flowchart TD
    A[SiteRegistry.get_adapter(slug)] --> B[Adapter.__init__]
    B --> C[login(page)]
    C -->|True| D[get_surveys(page)]
    D --> E[for each Survey]
    E --> F[start_survey(page, survey)]
    F --> G[while get_current_question(page) != None]
    G --> H[answer_question(page, question, answer)]
    H --> I[submit_survey(page)]
    I --> J[get_balance(page)]
    J --> K[withdraw(page, amount)]
```

*The diagram shows the sequential calls a consumer (e.g. the survey orchestration engine) makes on an adapter instance.*

---

## Extending the Module

### Adding a New Site

1. **Create a module** under `survey_agent/sites/` (e.g. `my_site.py`).  
2. **Import** the base types and the `register` decorator:

   ```python
   from .base import SiteAdapter, Survey, Question, Answer, SiteBalance, WithdrawalResult
   from .registry import register
   ```

3. **Define the adapter** and decorate it with a unique slug:

   ```python
   @register("my-site")
   class MySiteAdapter(SiteAdapter):
       @property
       def site_slug(self) -> str: return "my-site"
       @property
       def base_url(self) -> str: return "https://example.com"
       @property
       def display_name(self) -> str: return "My Site"
       # Implement all abstract methods …
   ```

4. **Implement the abstract methods** using the `BrowserPage` API (`goto`, `query_selector*`, `fill`, `click`, `content`, etc.).  
5. **Leverage `HumanBehavior`** for realistic delays and typing.  
6. **Run the test suite** – the registry will automatically import the new module and expose `"my-site"` via `SiteRegistry.list_sites()`.

### Customizing Credential or Profile Stores

Adapters receive optional `credential_store` and `profile_store` arguments. If omitted, a default `CredentialStore()` is created. To use a custom store:

```python
my_store = MyCredentialStore(...)
adapter = SiteRegistry().get_adapter("branded-surveys", credential_store=my_store)
```

The adapter will then call `self.credentials.retrieve(self.site_slug)` during login.

### Overriding CAPTCHA Detection

If a site uses a non‑standard CAPTCHA, override `detect_captcha`:

```python
async def detect_captcha(self, page: BrowserPage) -> bool:
    # Example: look for an iframe with src containing "recaptcha"
    frames = await page.query_selector_all("iframe")
    for f in frames:
        src = await f.evaluate("el => el.src")
        if "recaptcha" in src:
            return True
    return False
```

---

## Integration Points

| Component | Calls into Site Adapters |
|-----------|--------------------------|
| **Survey Orchestrator** (not shown) | `SiteRegistry.get_adapter`, then the async workflow (`login` → `get_surveys` → …). |
| **Withdrawal Service** (`survey_agent/withdrawal.py`) | Calls `adapter.get_balance` and `adapter.withdraw`. |
| **Browser Engine** (`survey_agent/browser/engine.py`) | Provides `BrowserPage` objects used by every adapter method. |
| **Answering Subsystem** (`survey_agent/answering/question_classifier.py`) | Used by `BrandedSurveysAdapter._classify_from_context` to map raw HTML to a `question_type`. |

All adapters share the same `BrowserPage` contract, making them interchangeable from the perspective of higher‑level orchestration code.

---

## Testing Tips

* **Mock `BrowserPage`** – Use a lightweight stub that records selector strings and returns predetermined HTML/content.  
* **Validate registration** – `SiteRegistry().list_sites()` should contain the new slug.  
* **Exercise each abstract method** – Ensure each returns the expected type (`bool`, `list[Survey]`, `Question | None`, etc.) and handles failure paths (missing elements, navigation errors).  
* **CAPTCHA detection** – Simulate pages with known CAPTCHA markers and assert `detect_captcha` returns `True`.

---

## Summary

The **Site Adapters** module abstracts the complexities of interacting with heterogeneous survey platforms behind a clean, asynchronous interface. By adhering to the `SiteAdapter` contract and registering via the `@register` decorator, new sites can be added with minimal boilerplate while reusing shared utilities (`HumanBehavior`, `CredentialStore`, `BrowserPage`). The `SiteRegistry` offers discovery and instantiation, enabling the rest of the application to treat every survey site uniformly.