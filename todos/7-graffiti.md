# 7. Replace the house stylesheet with Graffiti, used as shipped

Depends on: 5 (Astro layouts). Comes before 8, which maps the code theme onto Graffiti's tokens.

## Decision

Delete `public/styles.css` (hand-written tokens, element styles, lesson components) and use `@drop-in/graffiti` out
of the box. Pages use Graffiti's elements, layouts and components. Keep only the CSS Graffiti has no equivalent for,
written in Graffiti's tokens.

Docs: https://graffiti-ui.com/ · Source: https://github.com/stolinski/graffiti (MIT)

## What Graffiti gives (researched 2026-11-20)

- Layers: `@layer base, themes, components, utilities, layouts;` (lowest to highest).
- Entries: `@drop-in/graffiti` (all), `/minimal` (core + utilities), `/standard` (core + utilities + layouts),
  `/core`, `/utilities`, `/layouts`, `/components`, `/themes`, `/themes/<name>`.
- Tokens: `--fg`, `--bg` (via `light-dark()`), alpha steps `--fg-1..9`, `--bg-1..9`; `--primary`, `--accent`,
  `--error`, `--warning`, `--success`; hues `--blue`, `--green`, `--purple`, `--orange`, `--red`, … each with `-1..9`
  scales; `--br-*` radius, `--vs-*` / `--pad-*` spacing, `--border-1..5`, `--font-sans`, `--lh*`, `--fw-*`.
- Dark mode: `color-scheme: light dark` + `light-dark()`, following the OS. No toggle selector.
- Classless: body, headings (fluid scale), p, button, input, select, textarea, table, details/summary, label, figure,
  hr, mark, media.
- Layouts: `.stack`, `.cluster`, `.split`, `.grid`, `.layout-card`, `.layout-three-col`, `.layout-split`,
  `.layout-readable`, `.section`.
- Components: `.button` + variants, `.card` (+ `.linked`), `.chip` (+ `.selected`, `aria-pressed`), `.tag`,
  `.callout` (+ `.warning` / `.error` / `.success`), `.tabs`, `.tooltip`, `.progress`, `.meter`, `.table`.
- Browsers: Chrome/Edge 123+, Safari 17.5+, Firefox 128+.

**Not verified yet** (step 1): current version; styling of `code`, `pre`, `kbd`, `dl`, `a`.

## Mapping

| Today (`styles.css`) | Graffiti |
|---|---|
| `--bg`, `--surface`, `--text`, `--muted`, `--faint`, `--border` | `--bg`, `--bg-1..`, `--fg`, `--fg-6`, `--fg-4`, `--border-1` |
| Pattern colours `--blue/green/purple/orange` and `-bg` | Graffiti hue tokens and their `-1` / `-2` steps |
| `[data-color]` → `--c`, `--c-bg` | keep this one rule, pointing at Graffiti hues |
| `--fail`, `--wait` | `--error`, `--warning` |
| Home cards | `.layout-card` > `a.card.linked` |
| Lesson chip row | `.cluster` of `.chip` (current: `.selected` + `aria-current`) |
| `.cols` > `.panel` | `.grid` / `.layout-three-col` > `.card` |
| Switch buttons (`aria-pressed`) | `.chip` with `aria-pressed`, or `.toggle` |
| Status line ok/err/wait | `.tag.success` / `.error` / `.warning` |
| Insight callout | `.callout` |
| `.prose` Start here | `.layout-readable` |
| Timeline (`.lane`, `.track`, `.seg`, `.axis`) | **no equivalent**: keep, in Graffiti tokens |
| Console pane | `pre` (or `.log-card`) |

## Steps

1. Spike: `pnpm add @drop-in/graffiti`, import it in `Base.astro` with no other CSS, look at home and the sample
   lesson in both schemes at 390px and 1280px. Fill in "not verified" above.
2. Entry: likely `/standard` + `/components`, no preset theme. Pin the exact version.
3. Rewrite the layouts, the sample pages, the scaffold templates and `lib/ui.js` markup to Graffiti classes (table).
4. `src/styles/lesson.css` in `@layer lesson` (above Graffiti's): `[data-color]`, the timeline, the code theme from
   todo 8, and only what step 1 finds missing. Target under ~60 lines. Every value is a Graffiti token.
5. Delete `public/styles.css`.
6. Tests: keep the 390px no-sideways-scroll check; add one that `lesson.css` has no hex/rgb/oklch literals.
7. Rewrite `AGENTS.md` "House style" around Graffiti: the entry used, which classes a lesson uses, the
   pattern-colour rule, and "pages add no CSS of their own".

## Done when

- `public/styles.css` is gone; the only local CSS is `lesson.css`.
- Home and sample lesson read well in both schemes and pass `pnpm ui`.

## Accepted

- The look becomes Graffiti's. Rules like "no glow" hold by not using `.box.glow` and the like.
- Graffiti may rename tokens between versions: pin, and read its changelog when upgrading.
