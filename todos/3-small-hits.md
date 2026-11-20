# 3. Small hits

Each item is under an hour and independent. Do them after 1 and 2, before the big moves, so every later change is
linted and formatted.

## Lint and format: oxlint + oxfmt

- devDependencies `oxlint`, `oxfmt`; scripts `lint` (`oxlint && oxfmt --check`) and `format` (`oxfmt`).
- Run `pnpm format` once in its own commit (formatting only).
- `pnpm lint` in CI before tests. Same tools as s-petey/lunch-n-learn.

## Workflow hardening

- Top-level `permissions: contents: read` in `ci.yml`.
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
- Trigger on `pull_request` and on `push` to `main` only, so a branch with an open PR does not run twice.

## Dependency updates: Renovate

- `renovate.json` for npm and GitHub Actions, grouped weekly, `minimumReleaseAge` a few days.
- Pin Alchemy (beta) and Graffiti exactly and put them in their own Renovate group, so their updates are reviewed
  on their own.
