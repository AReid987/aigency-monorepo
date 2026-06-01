```markdown
# aigency-monorepo Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `aigency-monorepo` TypeScript codebase. It covers file organization, code style, commit practices, and testing patterns. While no specific framework or automated workflows were detected, this guide provides clear instructions and code examples to help you contribute consistently.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.ts`, `apiClient.test.ts`

### Import Style
- Use **relative imports** for referencing modules.
  - Example:
    ```typescript
    import { fetchData } from './apiClient';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In userProfile.ts
    export function getUserProfile(id: string) { ... }
    export const USER_ROLE = 'admin';
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Use the `build` prefix for build-related changes.
- Keep commit messages concise (average 80 characters).
  - Example:
    ```
    build: update dependencies for security patches
    ```

## Workflows

_No automated workflows were detected in this repository. Below are suggested manual workflows based on common development tasks._

### Building the Project
**Trigger:** When you need to compile or bundle the TypeScript code.
**Command:** `/build`

1. Ensure all dependencies are installed.
2. Run the TypeScript compiler or build script as defined in the project.
   - Example: `tsc` or `npm run build`
3. Verify the output in the designated build directory.

### Adding a New Module
**Trigger:** When you need to add new functionality.
**Command:** `/add-module`

1. Create a new file using camelCase naming (e.g., `newFeature.ts`).
2. Use named exports for all functions and constants.
3. Import dependencies using relative paths.
4. Write accompanying tests in a file named `newFeature.test.ts`.

### Writing a Commit
**Trigger:** When committing changes.
**Command:** `/commit`

1. Stage your changes.
2. Write a commit message using the conventional format.
   - Example: `build: add new API client for external service`
3. Commit your changes.

## Testing Patterns

- Test files use the `*.test.*` naming pattern, e.g., `apiClient.test.ts`.
- The testing framework is not specified; follow the existing test structure.
- Place tests alongside the modules they cover or in a dedicated `tests` directory if present.
- Example test file:
  ```typescript
  // apiClient.test.ts
  import { fetchData } from './apiClient';

  test('fetchData returns expected result', () => {
    // ...test implementation
  });
  ```

## Commands
| Command      | Purpose                                   |
|--------------|-------------------------------------------|
| /build       | Build or compile the TypeScript project   |
| /add-module  | Add a new module following conventions    |
| /commit      | Commit changes using conventional format  |
```
