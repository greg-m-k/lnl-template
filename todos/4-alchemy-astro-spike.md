# 4. Spike: Astro on Alchemy, logged out (go / no-go for todo 5)

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
