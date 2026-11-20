# 2. Package manager: npm → pnpm

Depends on: 1 (Node 26).

## Why

- Faster installs, a strict `node_modules` (a package can only import what it declares), and a content-addressed
  store shared across every fork on a laptop.
- Matches s-petey/lunch-n-learn, which pins pnpm ^12 through `devEngines.packageManager`.
- pnpm blocks dependency install scripts by default, which is a supply-chain protection worth having in a template
  people fork.

## What it costs

- Corepack no longer ships with Node (from 25), so a fresh clone needs pnpm installed first:
  `npm i -g pnpm` (or `npx pnpm install` once). This is one line in the getting-started docs.
- Install scripts must be allowed explicitly for the packages that need them (wrangler's `workerd`, `esbuild`;
  playwright-core does not download browsers, so it needs nothing).

## Target

```jsonc
// package.json
"devEngines": {
  "runtime": { ... },                                   // from todo 1
  "packageManager": { "name": "pnpm", "version": "^12.4.0", "onFail": "download" }
}
```

```yaml
# pnpm-workspace.yaml (pnpm settings live here since pnpm 10)
allowBuilds:            # confirm the key name for the pnpm version in use; older: onlyBuiltDependencies
  workerd: true
  esbuild: true
```

## Steps

1. `npm i -g pnpm@12`, then `pnpm import` to turn `package-lock.json` into `pnpm-lock.yaml` with the same resolved
   versions. Delete `package-lock.json`.
2. Add `devEngines.packageManager` as above. Do not also add the legacy top-level `packageManager` field (one source).
3. `pnpm install`. pnpm lists the blocked build scripts; allow only those `wrangler dev` needs, in
   `pnpm-workspace.yaml`. Verify with `pnpm dev` that workerd starts.
4. Scripts: every `npx wrangler` in workflows becomes `pnpm exec wrangler` (todo 5 replaces wrangler later).
   `package.json` scripts need no change.
5. Workflows:
   - Add `pnpm/setup` (the successor to `pnpm/action-setup`, recommended for pnpm 11+; it reads
     `devEngines.packageManager`) **before** `actions/setup-node`.
   - `cache: npm` → `cache: pnpm`.
   - `npm ci` → `pnpm install --frozen-lockfile`; `npm test` → `pnpm test`; `npm run ui` → `pnpm ui`.
6. Extend the todo-1 workflow test: no workflow step runs `npm ci` / `npm run` / `npx`.
7. Replace `npm` with `pnpm` in `AGENTS.md` commands, the `new-lesson` usage string in
   `scripts/new-lesson.mjs`, and `test/ui.mjs` header comments.
8. Fresh-clone check: `git clone` into a temp dir, `pnpm install && pnpm test && pnpm dev`, with no global cache
   (`--store-dir` in a temp dir) to catch a missing allowBuilds entry.

## Done when

- No `package-lock.json`; `pnpm-lock.yaml` committed.
- `git grep -nE "\bnpm (ci|run|test|install)\b|\bnpx\b"` finds nothing outside the "install pnpm" line.
- CI green using pnpm.

## Check while doing it

- pnpm 11 introduced `minimumReleaseAge` and other defaults; read the 11 and 12 release notes for anything that
  changes install behaviour for a template (https://pnpm.io/blog).
