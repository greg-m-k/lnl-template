# 6. TypeScript

Depends on: 5. Comes before Graffiti and highlighting so their new files are written once, in the final language. **Needs a decision before starting** (see "Open question").

## Why

- Astro and Alchemy are TypeScript-first: `astro.config.ts`, `alchemy.run.ts`, `src/content.config.ts` are already
  `.ts` after todo 5. Mixing in `.js` for the rest is the odd one out.
- Node 26 runs `.ts` directly (type stripping), so `node --test` and scripts need no build step.
- Typed bindings: Alchemy types `env` from `alchemy.run.ts`; Astro types collections from their zod schemas.
- `tsgo` (TypeScript 7 native) for fast checks, as in s-petey/lunch-n-learn.

## Open question

Pattern files (`src/topics/<topic>/patterns/*`) are what visitors read on screen. Types help a senior engineer read
an unfamiliar pattern (what a function returns, what can fail) and add noise to a 30-line file. Options:

- **A.** Everything TypeScript, patterns included. Highlighting adds the TypeScript language (todo 8).
- **B.** Everything TypeScript except pattern files, which stay `.js` with JSDoc types where they help.

Recommendation: A, with a rule in `AGENTS.md` to keep pattern types minimal (inferred where possible).

## Steps

1. `pnpm add -D typescript @typescript/native` (tsgo); `tsconfig.json` extending `astro/tsconfigs/strict`.
2. Script `check`: `astro check` (or `tsgo --noEmit` if `astro check` cannot use tsgo yet).
3. Rename in small commits: `scripts/*.mjs` → `.ts`, `test/*.mjs` → `.ts`, `lib/ui.js` → `ui.ts`,
   topic `server.js` → `server.ts`, then patterns (if A).
4. CI: `pnpm check` after lint.
5. Templates in `templates/` and `AGENTS.md` examples in TypeScript.

## Done when

- `pnpm check` passes in CI; no `.js`/`.mjs` source files left (except patterns under option B).
