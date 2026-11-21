# Contributing

This site hosts small Lunch & Learn examples from anyone, added by pull request. Read `AGENTS.md` first: it says
what a Lunch & Learn here is and how a topic is built.

## Adding an example

1. Fork the repository, then `pnpm install`. pnpm fetches the Node and pnpm versions set in `package.json`.
2. `pnpm run new-lesson <topic> start "Start here: the problem and the patterns"` creates the topic and its first
   lesson, and prints what to fill in next. Run it once per lesson.
3. Build the topic to `AGENTS.md`, test first.
4. `pnpm run dev` to try it at http://localhost:8800, then `pnpm run lint`, `pnpm run check` and `pnpm run test`.
5. Open a pull request. Its template holds the checklist below; a maintainer reviews it and merging publishes it.

### What gets accepted

An example is accepted when:

- It runs on Cloudflare's Workers free plan with only Workers, static assets, KV, D1, Queues, Durable Objects and
  service bindings. A test fails if the stack uses anything else, such as Workers AI, R2, Vectorize or Browser
  Rendering.
- It runs from a fresh clone with `pnpm install` and `pnpm run dev`, logged out of Cloudflare.
- Every value a visitor controls (a delay, a count, a size) is clamped where it enters the topic's server code.
- Anything a visitor creates belongs to their tab (a per-tab session id header) and is swept after a set time.
  Switches turn themselves off.
- It follows `AGENTS.md`: one question, every pattern built for real, every number measured.
- `pnpm run lint`, `pnpm run check` and `pnpm run test` pass.

A pull request from a fork runs the tests and gets no preview deploy, because GitHub gives forks no secrets. A
maintainer who wants a preview pushes the branch to this repository.

## Adding a link to a site hosted elsewhere

A Lunch & Learn site hosted somewhere else is listed as a link, never served from here. See `AGENTS.md`, "Adding a
link".

## Hosting the site (maintainers)

These steps act on the maintainer's Cloudflare account and GitHub repository. Do them once, by hand.

1. In `alchemy.run.ts`, replace `Alchemy.localState()` with `Cloudflare.state()`, so every deploy shares one record
   of what it created. Then create the state store once: `pnpm run state:bootstrap --profile <profile>`.
   CI never creates it.
2. Create a Cloudflare API token for CI with Workers Scripts Write, Workers KV Storage Write, D1 Write, Queues Write,
   Account Settings Write and Secrets Store Write. `Cloudflare.state()` needs Secrets Store Write: it reads its own
   token through a short-lived Worker that binds a Secrets Store secret, and Read is not enough.
3. In the GitHub repository, add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (Settings → Secrets
   and variables → Actions). Deploys start once the token is set.
4. Set `repo` in `src/site.json` to the repository's GitHub URL. The home page's source links and its "Add an
   example" link to this file are built from it.
5. Optional: set a custom domain with `domain` on `Cloudflare.Website.Astro` in `alchemy.run.ts`.
6. Add a usage notification on the Cloudflare account, so the site's use shows up before it reaches free-plan limits.

From then on `.github/workflows/deploy.yml` deploys every push to `main` to the `prod` stage. Each pull request from
this repository gets its own `pr-<number>` preview, destroyed when the pull request closes. To keep a failing `main`
from deploying, protect `main` so a pull request merges only when `ci` passes.
