# 6. TypeScript

**Status: done (2026-11-20).** Option A: everything is TypeScript, pattern files included, with minimal (inferred)
types (rule in `AGENTS.md`). `scripts/new-lesson.ts`, `test/site.test.ts`, `src/lib/ui.ts` and
`src/topics/sample/server.ts` converted; Node runs the scaffold directly. `tsconfig.json` extends
`astro/tsconfigs/strict`. TypeScript 6.0.3 with `@astrojs/check` 0.9.12 and `@types/node` 26: TypeScript 7.0.2 (native)
is `latest`, but `@astrojs/check`, the only checker for `.astro` files, supports TypeScript 5 and 6 only. `pnpm run
check` (`astro check`) runs in CI before the tests. Checked: 0 errors, 0 warnings, 0 hints; `pnpm run test` 22/22; a
test fails on any `.js`/`.mjs` source. Lint and format moved to todo 7.

Depends on: 5. Comes before Graffiti and highlighting so their new files are written once, in the final language.

## Why

- Astro and Alchemy are TypeScript-first: `astro.config.ts`, `alchemy.run.ts` are already `.ts` after todo 5.
  Mixing in `.js` for the rest is the odd one out.
- Node 26 runs `.ts` directly (type stripping), so scripts need no build step.
- Typed bindings: Alchemy types `env` from `alchemy.run.ts`.

## Open question (decided: A)

Pattern files (`src/topics/<topic>/patterns/*`) are what visitors read on screen. Types help a senior engineer read
an unfamiliar pattern (what a function returns, what can fail) and add noise to a 30-line file. Options:

- **A.** Everything TypeScript, patterns included. Highlighting adds the TypeScript language (todo 9).
- **B.** Everything TypeScript except pattern files, which stay `.js` with JSDoc types where they help.

## Steps

1. `pnpm add -D typescript @astrojs/check`; `tsconfig.json` extending `astro/tsconfigs/strict`.
2. Script `check`: `astro check`.
3. Rename: `scripts/*.mjs` → `.ts`, `test/*.mjs` → `.ts`, `lib/ui.js` → `ui.ts`, topic `server.js` → `server.ts`.
4. Scaffold output and `AGENTS.md` examples in TypeScript.

## Done when

- `pnpm run check` passes in CI; no `.js`/`.mjs` source files left.
