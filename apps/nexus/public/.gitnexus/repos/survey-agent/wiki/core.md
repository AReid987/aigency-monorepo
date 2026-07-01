# Core

# Core Module (`survey_agent`)

## Overview
The **Core** module is the top‑level package for the *Survey Agent* library. It defines the package namespace and provides basic metadata, most notably the `__version__` attribute. Importing `survey_agent` gives access to this version string and serves as the canonical entry point for the library.

```python
import survey_agent

print(survey_agent.__version__)   # → "0.1.0"
```

## Purpose
- **Package initialization** – establishes the `survey_agent` namespace.
- **Version exposure** – makes the library’s semantic version (`0.1.0`) available to downstream code, tooling, and documentation generators.
- **Future extensibility** – acts as a stable location for package‑wide constants or lazy imports without affecting the public API.

## Public API
| Symbol | Type | Description |
|--------|------|-------------|
| `__version__` | `str` | Semantic version of the Survey Agent package (currently `"0.1.0"`). |

No other functions, classes, or sub‑modules are exported from this file.

## Usage Guidelines

### Accessing the Version
```python
import survey_agent

def check_compatibility(min_version: str) -> bool:
    """Return True if the installed Survey Agent meets the minimum required version."""
    from packaging import version
    return version.parse(survey_agent.__version__) >= version.parse(min_version)
```

### Import Conventions
- Import the package directly (`import survey_agent`) to obtain the version.
- Do **not** rely on side‑effects from this module; it performs no runtime initialization beyond defining `__version__`.

## Extending the Core Module
If additional package‑wide constants or lazy imports become necessary, they should be added **below** the existing `__version__` definition, keeping the module free of heavy imports to preserve import‑time performance.

```python
# Example placeholder for future constants
DEFAULT_TIMEOUT = 30  # seconds
```

When adding new symbols, update the public API table accordingly and ensure they are documented.

## Interaction with the Rest of the Codebase
- **Incoming calls**: None. The module is not invoked by other components; it is merely imported.
- **Outgoing calls**: None. It does not depend on external modules beyond the standard library.
- **Execution flow**: The module executes once at import time, defining `__version__` and any future constants.

### Architectural Context (optional)

```mermaid
flowchart TD
    A[survey_agent (package)] --> B[__init__.py (Core)]
    B --> C[__version__: "0.1.0"]
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#efe,stroke:#333,stroke-width:1px
```

The diagram illustrates that the `survey_agent` package consists of the Core module (`__init__.py`), which currently only defines the `__version__` constant.

## Best Practices
- **Do not modify** `__version__` at runtime; treat it as immutable.
- **Avoid heavy imports** in this file to keep package import latency minimal.
- **Document any new symbols** added to the module in both the code and this documentation.

--- 

*End of Core module documentation.*