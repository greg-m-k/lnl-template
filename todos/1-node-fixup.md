# 1. Node: move to 26 LTS and declare the version once

**Status: done (2026-11-20).** `engines` + `devEngines.runtime` in `package.json`; `ci.yml` and `deploy.yml` on
`actions/checkout@v6` and `actions/setup-node@v7` with `node-version-file: package.json` (todo 2 then moved checkout to
`@v7`, v7.0.1, and replaced setup-node with `pnpm/setup@v3`); test in
`test/site.test.mjs`; README updated. `npm test` 9/9 and `npm run dev` on Node 26.8.2. Not verified: `npm run ui`
(not run), and whether `setup-node@v7` still reads `devEngines.runtime` (the first CI run shows it).

## Why

- Node 26 entered LTS in October 2026. Node 22, which `README.md` and both workflows name, is in maintenance.
- The version is written in three places today: `ci.yml` (`node-version: 22`), `deploy.yml` (`node-version: 22`) and the
  README ("Node 22 or newer"). `package.json` declares nothing, so a contributor on Node 20 gets no warning.
- pnpm 11+ (todo 2) needs Node 22+, and Alchemy and Astro (todos 4 and 5) track current Node.

## Target

`package.json` is the one source of truth. Everything else reads it.

```jsonc
"engines": { "node": ">=26.8.0" },
"devEngines": {
  "runtime": { "name": "node", "version": "^26.8.0", "onFail": "download" }
}
```

26.8 matches s-petey/lunch-n-learn. Raise it to the current 26.x minor if a dependency needs more
(check https://nodejs.org/dist/index.json).

## Steps

1. Add `engines.node` and `devEngines.runtime` to `package.json` as above.
2. Add a test in `test/site.test.mjs`, written first so it fails: "every workflow takes its Node version from
   package.json". It parses each `.github/workflows/*.yml` and asserts no `node-version:` key and that every
   `actions/setup-node` step has `node-version-file: package.json`. Run it and watch it fail on the two workflows.
3. Workflows (`ci.yml`, and `deploy.yml` until todo 5 removes it):
   - `actions/checkout@v4` → `@v6`.
   - `actions/setup-node@v4` → `@v6`, `node-version: 22` → `node-version-file: package.json`
     (setup-node v6.3+ prefers `devEngines.runtime` over `engines.node`).
   - Confirm the latest majors on github.com/actions/checkout/releases and github.com/actions/setup-node/releases
     at the time (a v7 of setup-node may exist; take it if it does).
   - Leave `cache: npm` until todo 2 swaps it.
4. Add `.node-version` containing `26`? **No.** `devEngines.runtime` with `onFail: download` covers npm/pnpm, and
   setup-node reads `package.json`. One source only. (fnm/nvm users: fnm reads `engines` with `--resolve-engines`.)
5. Run `npm test`, `npm run dev`, `npm run ui` locally on Node 26. Push a branch and confirm CI is green.
6. Update the Node line in docs to "Node 26 (see `package.json`)".

## Done when

- `git grep -n "node-version:"` returns nothing.
- The new test passes; CI passes on Node 26.
- Running `npm install` on Node 22 prints the devEngines warning or downloads 26.

## Notes

- Node 27 (April 2027) starts a one-major-per-year schedule where every release is LTS. Re-check then.
