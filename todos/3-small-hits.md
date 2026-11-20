# 3. Small hits

## Workflow hardening

- Top-level `permissions: contents: read` in `ci.yml`.
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
- Trigger on `pull_request` and on `push` to `main` only, so a branch with an open PR does not run twice.

## Dependency updates: Renovate

- `renovate.json` for npm and GitHub Actions, grouped weekly, `minimumReleaseAge` a few days.
- Pin Alchemy (beta) and Graffiti exactly and put them in their own Renovate group, so their updates are reviewed
  on their own.
