# 4. Spike: Astro on Alchemy, logged out (go / no-go for todo 5)

**Status: done (2026-11-20). Decision: go.** Applied in the repo itself, not a separate spike.
Neither tool scaffolds into an existing folder (`create astro` stops with `"." is not empty!`; Alchemy's CLI has no
init command), so this followed Alchemy's documented route for an existing project: `pnpm add` its packages, then
`alchemy.run.ts` and `astro.config.ts` in the shape of `examples/cloudflare-website-astro`.

- Installed: `alchemy`, `@alchemy.run/cloudflare`, `@alchemy.run/frontend-frameworks` at `2.0.0-beta.87` (pnpm pinned
  the exact beta), `effect` 4.1.4, `@effect/platform-node` and `-bun` 4.1.4, `astro` 7.4.13 (Astro 7, not 6).
- `alchemy.run.ts`: `Cloudflare.Website.Astro('Site', { dev: { port: 8800 } })`, `state: Alchemy.localState()` with
  the self-hosting comment. `astro.config.ts` declares no adapter.
- The old Worker `src/index.js` is gone. Its two jobs are Astro routes: `src/pages/[topic]/api/[...path].ts` (topic
  server code) and `src/pages/[topic]/site/[...path].ts` (site frame from `public/`). Existing pages in `public/`
  are served as they are. The unit test now calls those routes.
- `pnpm run dev` is `alchemy dev`. `.gitignore` adds `.alchemy/`, `.astro/`, `dist/`. CI sets `DO_NOT_TRACK=1`.

Checked, with no `CLOUDFLARE_*` variables and `DO_NOT_TRACK=1`:
- Starts with no prompt and no login; the plan shows `Site` and its `SESSION` KV namespace created `(local)`.
- Port 8800 honoured. `/`, `/sample/start/`, `/sample/lesson/`, `/sample/site/{styles.css,lib/site.js,topics.json}`
  and `/sample/api/hello` answer 200 with the right content types; `/nope/api/x` is 404.
- Editing `topics/sample/api.js` shows in the API response within about 1 second, with no restart.
- After deleting `node_modules`, `.alchemy` and `.astro`: `pnpm install` then `pnpm run dev` serves the lesson in
  about 6 seconds. `pnpm run test` 13/13.

Tests: `pnpm run test` is Vitest (`vitest.config.ts`) with two projects. **node**: `test/site.test.mjs` (catalogue,
scaffold, config checks) and `test/site.integ.test.ts`, which uses Alchemy's harness (`@alchemy.run/test/Vitest`,
`Test.make({ dev: true })`, `beforeAll(deploy(Stack))`) to boot the site locally and check pages, frame, API and
wording over HTTP. **browser**: `test/site.browser.test.ts` in Vitest browser mode on the installed Chrome
(`@vitest/browser-playwright`, channel `chrome`). It loads every real page (`public/**/index.html` as text), puts its
own `<main>` in the document and runs the frame on it: home cards, lesson chips, footer, the page's own
`<link>`/`<script>`/`import` paths and every request below the topic path, no sideways scroll at 390px with the
page's real content, and nothing written to `console.error`. Each of those three guards was shown to fail on a
deliberately broken page (wide element, `/styles.css` link, a `console.error` in the frame). Browser mode cannot navigate to an outside URL, so served pages are checked by the
harness and page code by browser mode. `test/ui.mjs`, the `ui` script, `playwright-core` and CI's server-start loop
are gone. `public/lib/site.js` `lesson()` takes an optional `path` (default `location.pathname`) so the test can
render any lesson. 24/24 pass in about 4 seconds.

Not checked: D1 (no topic uses it yet; Alchemy's own credential-free test covers it), CI (not pushed).

Left for todo 5: `wrangler.jsonc`, the `wrangler` dependency, and the `login`, `deploy`, `deploy:preview`,
`d1:create`, `queues:create` scripts still use wrangler; `deploy` would now fail because `src/index.js` is gone.
`deploy.yml` likewise. Telemetry: Alchemy's CLI reports usage by default for anyone running `pnpm run dev`; decide
whether the template turns it off (`DO_NOT_TRACK`, or a `~/.alchemy/telemetry-disabled` file).

Depends on: 1, 2. Time box: half a day, on a throwaway branch.

## Why a spike

Todo 5 moves the site to Astro with Alchemy as the only Cloudflare config (`alchemy.run.ts`, no `wrangler.jsonc`, no
`astro.config` adapter setup). The kit's hard rule is that a fresh clone runs with **no Cloudflare account or login**.
Alchemy supports that, with conditions. Prove it on our exact stack (Node 26, pnpm 12, no Bun) before migrating.

## What the research says (alchemy-run/alchemy, via repobase, 2026-11-20)

- `alchemy dev` runs Workers in workerd locally. `packages/integration-tests/test/Cloudflare/Local/CredentialFreeDev.local.test.ts`
  runs a Worker, D1, Queues, KV, R2 and a Vite site with all `CLOUDFLARE_*` variables removed, and checks every
  resource gets the local account id. Resources marked `Alchemy.remote()` fail with `CredentialsRequired`.
- `Cloudflare.Website.Astro("Site", { ... })` (from `@alchemy.run/frontend-frameworks`) deploys Astro to Workers with
  "no `astro.config.*`, adapter setup, or Wrangler configuration" (`examples/cloudflare-website-astro`).
  Astro dev runs the server environment in workerd; prerendering runs in Node, so prerendered pages must not import
  `cloudflare:workers`.
- **State:** `Alchemy.localState()` keeps state in `.alchemy/state/` (gitignored), one stage per developer
  (`dev_$USER`). `Cloudflare.state()`, which the example uses, bootstraps a state-store Worker **on your account on
  first `dev`**, so the template sets `localState()` explicitly and says in a comment how a self-hosted fork switches.
- v2 is beta: "Expect breaking changes." Config is an Effect program. The examples use Bun; the README installs with
  `pnpm add alchemy@latest effect @effect/platform-bun @effect/platform-node`.

## Steps

1. New branch. `pnpm create astro` a minimal project into a scratch folder inside the repo.
2. `pnpm add -D alchemy effect @effect/platform-node @alchemy.run/cloudflare @alchemy.run/frontend-frameworks`.
3. `alchemy.run.ts`:
   ```ts
   export default Alchemy.Stack("lnl", {
       providers: Cloudflare.providers(),
       // State lives on this machine in .alchemy/ (gitignored), so `pnpm dev` needs no Cloudflare account.
       // Hosting your own Lunch & Learn from this template? Replace with `Cloudflare.state()` to keep deploy
       // state in your Cloudflare account, shared by every deploy (see alchemy.run/state-store).
       state: Alchemy.localState(),
     },
     Effect.gen(function* () {
       const db = yield* Cloudflare.D1.Database("Scratch");                      // proves a binding works locally
       const site = yield* Cloudflare.Website.Astro("Site", { env: { DB: db } });
       return { url: site.url };
     }));
   ```
4. One prerendered page, one on-demand API route `src/pages/sample/api/[...path].ts` that writes and reads D1.
5. Logged out: `HOME=$(mktemp -d)`, `env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID`, then `pnpm exec alchemy dev`.
6. Check and write the answers into this file:
   - Starts with no prompt, no network call to the Cloudflare API (watch for a login/browser prompt).
   - Port can be fixed (we use 8800 for `ui` tests). Find the option on `Website.Astro` `dev` / the CLI.
   - The API route answers; D1 writes persist across a restart; a second tab sees its own data.
   - Runs on Node 26 with pnpm (not Bun). Note anything that needs `@effect/platform-bun`.
   - Telemetry: does Alchemy send any? How to turn it off.
   - Edit an `.astro` page → hot reload works.
   - Fresh clone: `rm -rf node_modules .alchemy && pnpm install && pnpm exec alchemy dev` works first time.
7. Pin exact versions of `alchemy` and `@alchemy.run/*` that passed (beta: no `^`).

## Decision

- **Go:** todo 5 uses `alchemy.run.ts` as the only Cloudflare config.
- **No-go:** todo 5 uses the official `@astrojs/cloudflare` adapter with `wrangler.jsonc` (also works logged out, since
  Astro 6 runs dev in workerd). Record the blocker here and re-check when Alchemy v2 leaves beta.
  Cloudflare's own successor to wrangler, the `cf` CLI with `cloudflare.config.ts` (1.0.0-rc.1, 2026-11-17), is the
  other option; its logged-out `cf dev` is undocumented, so it would need the same spike.
