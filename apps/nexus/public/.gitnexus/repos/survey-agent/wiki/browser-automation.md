# Browser Automation

# Browser Automation Module

## Overview
The **Browser Automation** module provides a unified, extensible abstraction over browser automation libraries (currently Playwright) while adding anti‑detection features such as realistic fingerprints, human‑like interaction timing, and proxy rotation. Site adapters interact only with the abstract interfaces (`BrowserEngine`, `BrowserContext`, `BrowserPage`), allowing the underlying engine to be swapped or extended without changing higher‑level code.

## Architecture Diagram
```mermaid
flowchart TD
    A[PlaywrightEngine.launch] --> B[PlaywrightEngine.create_context]
    B --> C[FingerprintGenerator.generate]
    B --> D[PlaywrightContext.new_page]
    D --> E[PlaywrightPage]
    E -->|goto| F[Page.goto]
    E -->|click| G[HumanBehavior.human_click]
    E -->|fill| H[HumanBehavior.human_type]
    E -->|select| I[HumanBehavior.human_select]
    E -->|evaluate| J[Page.evaluate]
    subgraph Proxy
        K[ProxyManager.get_proxy] --> L[PlaywrightEngine.launch (proxy args)]
    end
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#ff9,stroke:#333,stroke-width:2px
```

## Core Abstract Interfaces (`survey_agent.browser.engine`)

| Interface | Purpose | Key Methods |
|-----------|---------|-------------|
| `BrowserEngine` | Top‑level controller that manages the browser process and creates isolated contexts. | `launch(headless: bool = True, **kwargs)`, `create_context(**kwargs) → BrowserContext`, `close()`, `is_running() → bool` |
| `BrowserContext` | Represents an isolated session (cookies, storage, fingerprint). | `new_page() → BrowserPage`, `close()` |
| `BrowserPage` | Minimal set of page actions required by site adapters. | `goto(url, wait_until)`, `click(selector)`, `fill(selector, text)`, `select_option(selector, value)`, `check(selector)`, `uncheck(selector)`, `screenshot(path)`, `query_selector(selector)`, `query_selector_all(selector)`, `evaluate(expression)`, `wait_for_selector(selector)`, `url()`, `content()`, `close()` |

All methods are `async` to fit Playwright’s asynchronous API.

## Playwright Implementation (`survey_agent.browser.playwright_engine`)

### `PlaywrightEngine`
* Implements `BrowserEngine`.
* **Launch**: Starts Playwright’s Chromium with stealth arguments (`--disable-blink-features=AutomationControlled`, `--no-sandbox`).  
  ```python
  await engine.launch(headless=False)
  ```
* **Context creation**:  
  1. Generates a `Fingerprint` via `FingerprintGenerator` if none is supplied.  
  2. Converts the fingerprint to Playwright context kwargs (`Fingerprint.to_context_kwargs`).  
  3. Calls `browser.new_context(**kwargs)`.  
  4. Applies `playwright_stealth.Stealth` evasions.  
  5. Returns a `PlaywrightContext` containing the fingerprint and a fresh `HumanBehavior` instance.
* **Close**: Gracefully shuts down the browser and Playwright instance.

### `PlaywrightContext`
* Wraps a Playwright `BrowserContext`.
* Holds the `Fingerprint` used for the session (exposed via the `fingerprint` property).
* `new_page()` creates a `PlaywrightPage` that shares the same `HumanBehavior` object, ensuring consistent timing across pages.

### `PlaywrightPage`
* Wraps a Playwright `Page`.
* All high‑level actions (`click`, `fill`, `select_option`, `check`, `uncheck`) delegate to `HumanBehavior` methods, which add realistic delays and input simulation.
* Direct counterparts (`click_direct`, `fill_direct`) bypass the human simulation for cases where speed is required.
* Provides low‑level access via the `raw_page` property.

## Fingerprint Generation (`survey_agent.browser.fingerprint`)

### `Fingerprint`
A dataclass representing a full browser fingerprint. Fields include:
* `viewport`, `user_agent`, `locale`, `timezone`, `languages`
* `webgl_renderer`, `webgl_vendor`
* `hardware_concurrency`, `device_memory`
* Optional UI preferences (`color_scheme`, `reduced_motion`, `platform`)

**Consistency check** – `Fingerprint.is_consistent()` validates that the `platform` matches the OS implied by the `user_agent`.

**Playwright conversion** – `Fingerprint.to_context_kwargs()` returns the subset of fields required by Playwright’s `new_context`.

### `FingerprintGenerator`
* Stateless generator seeded optionally for reproducibility.
* Uses weighted real‑world distributions for viewport sizes, user‑agents, locales, timezones, WebGL strings, etc.
* `generate() → Fingerprint` creates a new, internally consistent fingerprint.

## Human Interaction Simulation (`survey_agent.browser.human_behavior`)

`HumanBehavior` adds human‑like timing and input patterns:
* **Delays** – `random_delay(multiplier)` draws a base delay from a uniform range, applies a fatigue factor, and adds Gaussian jitter.
* **Typing** – `human_type(page, selector, text)` clicks the field, then types each character with variable per‑character delays, occasional “thinking” pauses, and incremental fatigue.
* **Clicking** – `human_click(page, selector)` adds pre‑ and post‑click delays.
* **Select / Check / Uncheck** – analogous methods with appropriate delays.
* **Scrolling** – `scroll_naturally(page, direction, amount)` simulates incremental scroll steps.
* **Reading pause** – `read_pause(text_length)` estimates reading time based on words‑per‑minute.
* **Fatigue reset** – `reset_fatigue()` clears accumulated slowdown, useful when starting a new session.

All methods are `async` and operate on the abstract `BrowserPage` interface, allowing reuse with any engine implementation.

## Proxy Management (`survey_agent.browser.proxy_manager`)

### `Proxy`
* Simple container for proxy configuration (`host`, `port`, optional `username`/`password`, `protocol`).
* `to_playwright_proxy()` converts the object to the dict format expected by Playwright’s `proxy` launch argument.

### `ProxyManager`
* Holds a list of `Proxy` objects parsed from strings like `http://user:pass@host:port` or `host:port`.
* Rotation strategies:
  * `get_proxy()` – round‑robin.
  * `get_random_proxy()` – random selection.
* `add_proxy(proxy_str)` – add a new proxy at runtime.
* `count` property reports the pool size.

**Integration point** – When launching `PlaywrightEngine`, callers can inject a proxy via the `args` or `proxy` kwarg derived from `ProxyManager`.

## Session Identity (`survey_agent.browser.session_identity`)

`SessionIdentity` tracks a fingerprint per logical session:
* `new_session()` – generates a fresh fingerprint and increments the session counter.
* `current` – returns the fingerprint in use for the active session.
* `reset()` – discards the current fingerprint and re‑initialises the generator (useful after a detection event).

Site adapters typically request a new session when starting a fresh browsing run, ensuring that each run appears as a distinct user.

## Interaction Flow (Typical Usage)

```python
from survey_agent.browser import get_playwright_engine, FingerprintGenerator, HumanBehavior
from survey_agent.browser.proxy_manager import ProxyManager

# 1. Prepare optional proxy pool
proxy_mgr = ProxyManager(["http://proxy1:3128", "http://user:pass@proxy2:8080"])
proxy = proxy_mgr.get_random_proxy()

# 2. Launch the engine
engine = get_playwright_engine()
await engine.launch(headless=False, proxy=proxy.to_playwright_proxy() if proxy else None)

# 3. Create a context with a fresh fingerprint
fingerprint = FingerprintGenerator().generate()
context = await engine.create_context(fingerprint=fingerprint)

# 4. Open a page
page = await context.new_page()

# 5. Navigate and interact using human‑like behavior (automatically applied)
await page.goto("https://example.com")
await page.click("#login")
await page.fill("#email", "user@example.com")
await page.fill("#password", "s3cr3t")
await page.click("#submit")

# 6. When done, clean up
await context.close()
await engine.close()
```

All high‑level actions (`click`, `fill`, etc.) are automatically wrapped by `HumanBehavior`. If a test requires raw speed, use the `*_direct` methods on `PlaywrightPage`.

## Integration with the Rest of the Codebase

| Caller | Method Used | Target |
|--------|-------------|--------|
| `survey_agent.sites.branded_surveys` | `goto`, `fill`, `click`, `query_selector`, `content`, `url` | `BrowserPage` (via the abstract engine) |
| `survey_agent.answering.form_filler` | `query_selector`, `query_selector_all`, `evaluate` | `BrowserPage` |
| `survey_agent.answering.form_filler` (checkbox/radio) | `human_check`, `human_uncheck` indirectly via `click` | `HumanBehavior` |
| Proxy rotation in site adapters | `ProxyManager.get_proxy` | `PlaywrightEngine.launch` |
| Session handling | `SessionIdentity.new_session` | Provides a fingerprint to `PlaywrightEngine.create_context` |

Because adapters import only the abstract symbols (`BrowserEngine`, `BrowserContext`, `BrowserPage`), swapping the implementation (e.g., adding a Camoufox engine) requires only a new concrete class that respects the same method signatures.

## Extending the Module

### Adding a New Engine
1. Subclass `BrowserEngine`, `BrowserContext`, and `BrowserPage`.
2. Implement all abstract methods using the target library’s API.
3. Provide a lazy import function (similar to `get_playwright_engine`) to avoid heavy dependencies at import time.
4. Register the new engine in `survey_agent.browser.__all__` if you want it publicly available.

### Custom Fingerprint Sources
* Extend `FingerprintGenerator` or replace it with a subclass that pulls data from an external service.
* Ensure the generated `Fingerprint` passes `is_consistent()` or adjust the validation logic accordingly.

### Tweaking Human Behavior
* Adjust `min_delay_ms`, `max_delay_ms`, or the fatigue algorithm in `HumanBehavior.__init__`.
* Override any of the `human_*` methods to inject additional randomness (e.g., mouse trajectory simulation).

## Testing Tips
* **Unit tests** should mock the abstract interfaces (`BrowserEngine`, `BrowserPage`) to verify that site adapters call the expected methods.
* **Integration tests** can spin up a real Playwright instance with `headless=True` and a known fingerprint to assert that `Fingerprint.to_context_kwargs` correctly configures the browser.
* Use `HumanBehavior.reset_fatigue()` between test cases to avoid cross‑test timing drift.

## Common Gotchas
* **Forgot to launch** – `create_context` raises `RuntimeError` if `launch` has not been called.
* **Proxy format** – `ProxyManager` expects a string; malformed entries are silently ignored.
* **Fingerprint consistency** – Changing `platform` manually without updating the `user_agent` may cause `is_consistent()` to return `False`, which some downstream checks may rely on.
* **Async context** – All public methods are `async`; forgetting to `await` will result in coroutine objects and subtle bugs.