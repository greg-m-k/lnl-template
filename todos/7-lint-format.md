# 7. Type-aware lint and format (oxlint + oxfmt)

**Status: done (2026-11-20).** oxlint 1.94 with `oxlint-tsgolint` and oxfmt 0.79.

- oxlint ships no named presets (no `recommended-type-checked`); categories are its grouping. `pedantic` was tried and
  dropped: 117 warnings, mostly `prefer-readonly-parameter-types` and `require-unicode-regexp`.
- `.oxlintrc.json`: `options.typeAware: true`; plugins `eslint` (core rules; listing `plugins` replaces the defaults,
  so it must be named), `typescript`, `unicorn`, `oxc`; categories `correctness` error, `suspicious` and `perf` warn.
  `correctness` already holds most of typescript-eslint's `recommended-type-checked` rules (`no-floating-promises`,
  `await-thenable`, `unbound-method`, `restrict-template-expressions`, ...). The rest of that set, which oxlint files
  under `pedantic`, is named as errors: `no-misused-promises`, `only-throw-error`, `prefer-promise-reject-errors`,
  `require-await`, `restrict-plus-operands`, `no-unsafe-argument`/`-assignment`/`-call`/`-member-access`/`-return`;
  plus `switch-exhaustiveness-check` and `return-await`.
- Findings were fixed in the code, with no `as` casts: tests import `package.json`, `.oxlintrc.json` and
  `renovate.json` for typed JSON; the scaffold imports `src/site.json` (`with { type: 'json' }`); `vitest.config.ts`
  loads pages through Vite's typed environment API (`isRunnableDevEnvironment`, `runner.import<T>`) instead of
  `ssrLoadModule` (`Record<string, any>`), so `vite` is a direct dev dependency; the sample `handle` is no longer
  `async` (nothing to await) and the API route accepts `Response | Promise<Response>`; non-null `!` assertions removed.
- Not used: the `vitest` plugin (does not recognise Alchemy's harness `test`); the `@effect/tsgo` preset from
  s-petey/lunch-n-learn (Effect-only rules). oxlint does not lint `.astro` files; `astro check` covers them.
- tsconfig `include` scoped to `src`, `test`, `scripts` and root `*.ts`, as oxlint's type-aware docs advise.
- Scripts `lint` (`oxlint && oxfmt --check`) and `format`; CI runs lint, then check, then test. The scaffold runs
  `pnpm run format` on what it writes, so a new topic starts lint-clean whatever its slug.
- Proved: a floating `fetch` and a thrown string in `server.ts` failed lint (`no-floating-promises`,
  `only-throw-error`), then were reverted. lint clean with no warnings, check 0 errors, test 23/23.

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
