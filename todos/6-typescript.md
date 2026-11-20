# 6. TypeScript, then type-aware lint and format

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
4. Templates in `templates/` and `AGENTS.md` examples in TypeScript.

### Lint and format (oxlint + oxfmt), once the code is TypeScript

Moved here from todo 3 so oxlint can run its type-aware rules (they read types through `oxlint-tsgolint`, which
s-petey/lunch-n-learn also uses).

5. Test first: `package.json` has `lint` (`oxlint ... && oxfmt --check`) and `format` (`oxfmt`) scripts, and CI runs
   `pnpm run lint` and `pnpm run check` before `pnpm run test`.
6. `pnpm add -D oxlint oxlint-tsgolint oxfmt`. Turn on type-aware linting (`--type-aware` at the time of writing;
   confirm the flag and config key in the oxlint docs for the installed version).
7. `.oxfmtrc.json` as in s-petey/lunch-n-learn: `"singleQuote": true`, `"printWidth": 100`.
   `.oxlintrc.json`: s-petey/lunch-n-learn extends an `@effect/tsgo` preset; use that only if this repo uses Effect,
   otherwise oxlint's defaults plus its TypeScript plugin.
8. Run `pnpm run format` once in its own commit (formatting only). A trial on 2026-11-20, before TypeScript, found 19
   files to reformat with those settings and no lint findings under oxlint's defaults.
9. Fix lint findings in separate commits from the formatting.

## Done when

- `pnpm run check` and `pnpm run lint` pass in CI; no `.js`/`.mjs` source files left (except patterns under option B).
