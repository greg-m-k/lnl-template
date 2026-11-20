# 11. Hosting the site, and taking examples by pull request

Depends on: 4, 5 (Alchemy + Astro). Uses the scaffold from 5.

## Why

This repository is a hosted Lunch & Learn site as well as a template. It takes small, free-to-run examples from other
people by pull request and serves them on the live site. It does not mount or proxy other people's Workers or APIs;
sites hosted elsewhere appear only as vetted links (todo 10).

## What "small and free" means (the acceptance rules)

An example is accepted when, on review:

- It runs within Cloudflare's Workers free plan: only Workers, static assets, D1, Queues, Durable Objects and
  service bindings. No paid products and no remote-only bindings (`Alchemy.remote()`, Workers AI, Browser Rendering).
- It runs from a fresh clone with `pnpm install && pnpm dev`, logged out.
- Every value a visitor controls is clamped at the edge of the topic's server code (delays, counts, sizes).
- Visitor data is per tab (session id header) and swept after a set time; switches turn themselves off.
- It follows `AGENTS.md` (one question, patterns built for real, measured numbers) and passes `pnpm run test`.

Check what can be checked automatically:

- A unit test reads `alchemy.run.ts`'s resources (export them from a module the test can import) and fails on any
  resource type outside the allow-list above.
- The existing ui test pins the page and request behaviour.
- Everything else is the reviewer's checklist in the pull request template.

## Deploy

1. The maintainer replaces `Alchemy.localState()` with `Cloudflare.state()` in `alchemy.run.ts`, as its comment says,
   and bootstraps the store once: `alchemy state bootstrap --profile <ci-profile>` (CI refuses to create it).
   Note for that change: per Alchemy's docs, `alchemy dev` against `Cloudflare.state()` also looks for the store on
   the account, so check during todo 4 whether a contributor's logged-out `pnpm dev` still works afterwards.
2. Write the deploy workflow ourselves from Alchemy's CI guide (`website/src/content/docs/environments/ci.mdx`,
   pnpm variant), not the `alchemy-run/alchemy` action. That action (`action.yml`) is a ~80-line composite that only
   picks a stage (`prod` on `main`, `staging-<n>` on a pull request) and runs `alchemy deploy|destroy --stage ... --yes`;
   it is published as `@main` and still needs the CLI installed. Our own workflow runs `pnpm exec alchemy`, so the
   Alchemy version is the one pinned in our lockfile and there is no action to pin.
   - `on: push` to `main`, and `pull_request` with `types: [opened, reopened, synchronize, closed]`.
   - `STAGE`: `prod` on `main`, `pr-<number>` on a pull request.
   - `deploy` job when the action is not `closed`; `cleanup` job on `closed` runs `alchemy destroy --stage pr-<n>`
     with the guide's safety check that refuses to destroy `prod`.
   - `concurrency: deploy-${{ github.ref }}` with `cancel-in-progress: false`.
   - `permissions: contents: read, pull-requests: write` (the preview-URL comment below).
   - Env: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (secrets), `PULL_REQUEST`, `GITHUB_SHA`, `GITHUB_TOKEN`.
   - Use current action majors and pnpm from todos 1 and 2 (the guide still shows checkout@v4, setup-node@v4, pnpm 10).
   - Optional: a `GitHub.Comment` resource in `alchemy.run.ts` posts the preview URL on the pull request
     (`@alchemy.run/github`), as in the guide.
3. Pull requests from forks get no secrets, so they get no preview: they run tests only. Guard both jobs with
   `if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository`.
   A maintainer who wants a preview pushes the branch to this repository. Never use `pull_request_target` to give fork
   code the secrets.
4. The API token needs, per the guide: Workers Scripts Write, D1 Write, Queues Write, Account Settings Write,
   **Secrets Store Write** (`Cloudflare.state()` reads its bearer token through a short-lived preview Worker that binds
   a Secrets Store secret; Read is not enough). Trim the rest. The guide's `stacks/github.ts` can mint this token and
   write the GitHub secrets from an `admin` profile; creating the token by hand in the dashboard is fine for one repo.
5. Deploy only after `ci` passes (`needs:` on the test job, or one workflow with test then deploy jobs).
6. Custom domain: one `domain` on `Cloudflare.Website.Astro`, set by the maintainer.
7. A Cloudflare usage alert on the account (dashboard, once), so free-plan limits show up before they stop the site.

## Contributing flow

1. Fork, `pnpm install`.
2. `pnpm new-lesson <topic> start "..."` (or any lesson): creates the topic folder, `topic.json`, `TOPIC.md`, the page
   from the template, and prints the next steps. One script for new topics and new lessons; keep the name
   `new-lesson`, or add a `new-topic` alias if that reads better.
3. Build it to `AGENTS.md`; `pnpm run test`.
4. Open a pull request. The template (`.github/pull_request_template.md`) holds the acceptance checklist above.
5. Maintainer reviews; merge deploys.

Write this as a short `CONTRIBUTING.md` and link it from the home page footer ("Add an example").

## Steps

1. Test first: the resource allow-list test, failing on a deliberately added Workers AI binding.
2. Export the stack's resources so the test can read them; add the allow-list test.
3. `.github/workflows/deploy.yml` with the Alchemy action as above; `CONTRIBUTING.md`; the pull request template.
4. `scripts/new-lesson`: print next steps after scaffolding (which files to fill in, which commands to run).
5. Bootstrap the state store, add secrets, set the domain: **maintainer-only and outward-facing; do it with the
   maintainer, not autonomously.**
6. First deploy from `main`; check it with Alchemy's harness against the deployment (its "run against an existing
   deployment" pattern: `SKIP_DEPLOY` plus the deployed URL).

## Done when

- Merging to `main` deploys; a same-repo pull request gets a preview URL that is destroyed on close.
- A fork's pull request runs tests and gets no secrets.
- `CONTRIBUTING.md` and the pull request template state the acceptance rules.
