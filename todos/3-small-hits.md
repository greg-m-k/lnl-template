# 3. Small hits

**Status: done (2026-11-20).** `ci.yml`: runs on pushes to `main` and on pull requests, top-level
`permissions: contents: read`, `concurrency` per ref with `cancel-in-progress`. `renovate.json`: `config:recommended`,
weekly (before 6am Monday), `minimumReleaseAge: 3 days`, minor and patch grouped as "non-major", Alchemy and Graffiti
pinned in their own group. Tests in `test/site.test.mjs`, 13/13 pass. Not verified: the Renovate config against
Renovate's own validator (`renovate-config-validator`, not run), and Renovate does nothing until its GitHub app is
installed on the repository (a maintainer step).

## Workflow hardening

- Top-level `permissions: contents: read` in `ci.yml`.
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
- Trigger on `pull_request` and on `push` to `main` only, so a branch with an open PR does not run twice.

## Dependency updates: Renovate

- `renovate.json` for npm and GitHub Actions, grouped weekly, `minimumReleaseAge` a few days.
- Pin Alchemy (beta) and Graffiti exactly and put them in their own Renovate group, so their updates are reviewed
  on their own.
