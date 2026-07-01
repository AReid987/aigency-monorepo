# Other — tsconfig.json

# Other — tsconfig.json

## Overview
`tsconfig.json` defines the TypeScript compiler configuration for the entire repository. It is used by all TypeScript tooling (e.g., `tsc`, `vite`, `eslint`, `jest`) to ensure a consistent compilation target, module system, and strictness level across the codebase.

## Compiler Options

| Option                | Value          | Description |
|-----------------------|----------------|-------------|
| `target`              | `ES2022`       | Emit JavaScript that conforms to the ECMAScript 2022 specification. This enables modern language features (e.g., class fields, top‑level `await`) without additional transpilation. |
| `lib`                 | `["ES2022"]`   | Include the standard library declarations for ES2022. This limits the ambient type definitions to the features actually available in the chosen target. |
| `module`              | `ESNext`       | Preserve native ES module syntax (`import`/`export`) in the emitted output. This is required for bundlers that rely on tree‑shaking and native ESM support. |
| `moduleResolution`   | `bundler`      | Resolve modules using the same algorithm as modern bundlers (e.g., Vite, Webpack). This aligns TypeScript’s path resolution with the runtime bundler, handling extensions like `.js`, `.ts`, and `.json` consistently. |
| `strict`              | `true`         | Enable all strict type‑checking options (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.) to enforce a high level of type safety. |
| `skipLibCheck`        | `true`         | Skip type checking of declaration files (`*.d.ts`). This speeds up compilation and avoids false positives from third‑party libraries that may not be fully typed. |
| `noEmit`              | `true`         | Prevent the compiler from writing output files. The project relies on a bundler (e.g., Vite) to handle file emission, so TypeScript is used only for type checking. |

## Exclusions

```json
{
  "exclude": ["node_modules"]
}
```

- **`node_modules`**: Excluding this directory avoids unnecessary type checking of third‑party source code, which can be large and is already type‑checked via its own `tsconfig` (if any). This also prevents accidental inclusion of generated files.

## Integration with the Build Pipeline

1. **IDE Support** – Editors (VS Code, WebStorm) automatically read `tsconfig.json` to provide IntelliSense, error highlighting, and refactoring capabilities.
2. **Bundler (Vite/webpack)** – The bundler reads the same configuration (via the `typescript` plugin) to resolve imports and apply the `moduleResolution: "bundler"` strategy.
3. **Linting** – ESLint’s `@typescript-eslint/parser` uses this file to understand the project’s type environment.
4. **Testing** – Test runners like Jest (with `ts-jest`) reference the config to type‑check test files without emitting JavaScript.

## Extending or Overriding

If a sub‑project (e.g., a package in a monorepo) needs a different compilation target or additional compiler options, it can create its own `tsconfig.json` that **extends** this root file:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020"
  },
  "include": ["src"]
}
```

The extending config inherits all options from this file and overrides only the specified fields.

## Recommended Workflow

1. **Run type checking only** – `npx tsc --noEmit` validates the entire codebase without producing output.
2. **Bundle** – Use the bundler’s dev server (`vite dev`) or production build (`vite build`). The bundler will invoke TypeScript for type checking and then emit JavaScript according to the `module` and `target` settings.
3. **CI** – Include a step that runs `tsc --noEmit` to catch type errors before merging.

## Version Compatibility

- **Node.js**: Requires a runtime that supports ES2022 features (Node >= 18). If older Node versions are targeted, adjust `target` and `lib` accordingly.
- **Bundler**: Ensure the bundler version supports `moduleResolution: "bundler"` (Vite ≥ 4, webpack ≥ 5).

## Summary

This `tsconfig.json` establishes a strict, modern TypeScript environment that aligns with the project's bundler and runtime expectations. By centralizing compiler options, it guarantees consistent type checking across IDEs, CI pipelines, and build tools while delegating actual file emission to the bundler.