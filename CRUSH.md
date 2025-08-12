# CRUSH.md
Commands:
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Test All**: `npm test` (frontend), `pytest` (backend)
- **Single Test**:
  - Frontend: `npm test -- -t "<test-name>"`
  - Backend: `pytest path/to/test.py::test_name`

Style Guidelines:
- **Imports**: Grouped (external > internal > components), alphabetical
- **Formatting**: Prettier defaults (2-space indent, no semicolons in TS)
- **Types**: Strict TS (no `any`), interfaces for props
- **Naming**:
  - Components: PascalCase (`VideoPlayer.tsx`)
  - Functions/Variables: camelCase
  - Test files: `*.test.ts`/`test_*.py`
- **Error Handling**: `try/catch` in async, typed errors
- **Comments**: None unless absolutely necessary