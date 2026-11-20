# 7. Type-aware lint and format (oxlint + oxfmt)

Depends on: 6 (oxlint's type-aware rules read types through `oxlint-tsgolint`, which s-petey/lunch-n-learn also
uses, so the code must be TypeScript first).

## Steps

1. Test first: `package.json` has `lint` (`oxlint --type-aware && oxfmt --check`) and `format` (`oxfmt`) scripts, and
   CI runs `pnpm run lint` before `pnpm run check` and `pnpm run test`.
2. `pnpm add -D oxlint oxlint-tsgolint oxfmt`. The type-aware switch is `--type-aware` (config key `typeAware`),
   confirmed in oxlint 1.94's configuration schema; it needs `oxlint-tsgolint` installed.
3. `.oxfmtrc.json` as in s-petey/lunch-n-learn: `"singleQuote": true`, `"printWidth": 100`.
   `.oxlintrc.json`: oxlint's defaults plus its `typescript`, `unicorn` and `oxc` plugins (s-petey/lunch-n-learn
   extends an `@effect/tsgo` preset, which only applies to code that uses Effect).
4. Run `pnpm run format` once in its own commit (formatting only).
5. Fix lint findings in separate commits from the formatting.

## Notes from a first attempt (2026-11-20, kept in `git stash` as "todo 6 lint/format work")

- Type-aware oxlint rejects a tsconfig whose `types` names a package that is not installed; `@types/node` is now a
  dependency (todo 6), so this is fixed.
- With the settings above, oxlint found nothing and oxfmt reformatted 14 files (most of the diff is `site.css`, one
  declaration per line).
- The "lint before test" check in that attempt's test compared the first `pnpm run test` in `ci.yml` with
  `pnpm run lint`; write it against the step order instead.

## Done when

- `pnpm run lint` passes locally and in CI, after `pnpm run check` and `pnpm run test` still pass on the formatted code.
