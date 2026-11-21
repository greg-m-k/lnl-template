# AGENTS.md: building a Lunch & Learn

This repository is a kit for interactive Lunch & Learn sessions. Each **topic** takes one design question a
team keeps arguing about and builds every competing answer for real, side by side, so people learn by
running, slowing down, breaking and timing them. Read this file before changing anything. It is written for
coding agents and for the senior engineers who direct them.

## What a Lunch & Learn here is

- **One question, several patterns.** "Sequential vs Parallel Requests", "Federated Services vs Event-Driven
  Projections". Name the patterns by what they are. Never "Option A / Option B", never "the good way and the
  bad way". There can be two patterns or five.
- **Nothing is mocked.** Every request, queue, database and failure on screen really happens. A slider that
  adds latency makes a real service really wait. A switch that turns a service off makes it really refuse.
  If you cannot make something real, leave it out and say so on the page; do not fake it.
- **Measure, do not assert.** Every number on screen is measured while the visitor watches: timings from
  `performance.now()` or server timing headers, counts read from real storage. No hard-coded "about 300ms".
- **Learn by doing.** Each lesson gives the visitor a control (a button, slider or switch) and a prediction to
  make before pressing it. The page shows the outcome; the visitor draws the conclusion.
- **The code is the content.** Each pattern lives in its own standalone file, readable top to bottom, and the
  lesson shows that exact file (`<Source>`). Duplicated plumbing between patterns is fine and expected.
  Never extract the pattern under comparison into a shared helper.
- **Runs locally from a fresh clone. Always.** Anyone who downloads the repository must be able to run every topic on
  their own laptop with `pnpm install` and `pnpm dev`: no Cloudflare account, login, API token or remote resource.
  Use only what `alchemy dev` runs locally (Workers, static assets, KV, D1, Queues, Durable Objects, service
  bindings); a test in `test/site.integ.test.ts` fails on anything else.
  Never add something that only works deployed (Workers AI, Vectorize, Browser Rendering and the like) unless the topic
  also has a local path. Deploying is also required, but only so the topic has a live page on the LnL site; it is never
  the only way to run it.
- **Written for a senior engineer from another field.** Define every term the first time it appears, even ones
  that feel basic inside the domain ("domain", "projection", "idempotent", "waterfall"). Say what each pattern
  gets you and what it costs, in that order, for every pattern.

## Layout

A topic's pages are `/<topic>/<lesson>/` and its server code answers `/<topic>/api/...`.

```
alchemy.run.ts                        The site's Cloudflare setup (Alchemy): one Astro site, run locally by pnpm run dev.
                                      A topic's D1 databases, Queues and Durable Objects are declared here, in code.
astro.config.ts                       Astro's config. No adapter: Alchemy supplies it.
src/site.json                         The catalogue: site intro, topics, lessons. The one place lessons are listed.
src/layouts/Base.astro                Every page: one Graffiti .layout-readable column (header, main, footer).
src/layouts/Lesson.astro              A lesson: its topic's chips in the header, then a Next link, from site.json.
src/styles/theme.css                  Imports Graffiti's full bundle. Nothing else: there is no custom CSS.
src/lib/ui.ts                         Lesson helpers: el, logger, say (a .tag), press/pressed, timeline (an SVG chart),
                                      busy. They use Graffiti's classes and tokens only.
src/lib/highlight.ts                  TanStack Highlight: the TypeScript highlighter and its GitHub light/dark colours.
src/components/Source.astro           A pattern file on screen, highlighted at build time: <Source code={file} />.
src/pages/index.astro                 Home: one card per lesson, from site.json, then one card per vetted link.
src/links/<slug>.json                 A vetted link to a Lunch & Learn site hosted elsewhere (see "Adding a link").
src/content.config.ts                 The links collection and its schema.
src/pages/<topic>/<lesson>.astro      One page per lesson, in the Lesson layout. The first lesson of every topic is start.
src/pages/[topic]/api/[...path].ts    /<topic>/api/... goes to src/topics/<topic>/server.ts, found by folder.
src/topics/<topic>/server.ts          The topic's real server code: handle(request) returns a Response.
src/topics/<topic>/patterns/<p>.ts    Browser-side pattern code, one standalone file per pattern. Keep its types
                                      minimal (let them be inferred): the file is what visitors read on screen.
src/topics/<topic>/TOPIC.md           The question, the patterns, the glossary, and the claim each lesson proves.
src/topics/<topic>/FACILITATION.md    The talk track for presenting the topic live.
scripts/generate.ts                   pnpm run generate: adds a lesson (and its topic) from scripts/templates/.
vitest.config.ts                      pnpm run test runs two projects: node and browser.
tsconfig.json                         Astro's strict TypeScript; pnpm run check type-checks .ts and .astro files.
test/*.test.ts                        Node: catalogue, scaffold and config checks.
test/*.integ.test.ts                  Node: the real site, booted locally by Alchemy's test harness, driven over HTTP.
test/*.browser.test.ts                Browser: page code in a real Chrome (Vitest browser mode), at desktop and phone widths.
.github/workflows/ci.yml              Lint, check and test on every push and pull request.
.github/workflows/deploy.yml          Deploys main and same-repo pull request previews, once the Cloudflare secrets are set.
CONTRIBUTING.md                       Adding an example by pull request, what gets accepted, and hosting the site.
.claude/agents/                       Subagents for each stage of building and presenting a topic.
```

## Lesson anatomy

Every lesson page has the same shape, so a room can follow it on a projector:

1. **Header and chips** (drawn by the layouts): a "← Home" chip (on every page but home), then every lesson in the
   topic as a Graffiti `.chip`, the current one `.selected`.
2. **h1**: the lesson's question in plain words ("When a service goes down").
3. **Lead paragraph**: the situation, each pattern in one sentence with its name as a Graffiti tag in its colour
   (`<span class="tag" style="--tag-color: var(--blue)">Sequential</span>`), what to try, and "New to these terms?
   Start here".
4. **Control panel** (`.card`, its controls in a `.cluster`): the run button, a status line (`say()`, a `.tag`), the
   sliders and switches, and one line suggesting what to try and asking for a prediction.
5. **One panel per pattern, side by side** (`.layout-card` > `.card`, headed by the pattern's tag): a one-line
   description, the measured timeline (`timeline()`, bars in the pattern's colour), the code that ran
   (`<Source code={...} />` with the pattern file imported `?raw`), the answer, the console (`.log-card` > `pre`, via
   `logger()`). Same order in every panel.
6. **Insight callout** (Graffiti `.callout`): what the run showed and when the "losing" pattern is still the right
   choice.
7. **Next link and footer** (drawn by the layouts).

A **Start here** page opens each topic: the problem, then for each pattern what it does, a small diagram in a
`<pre>`, what you get, what it costs, then a glossary (`<dl>`) of every term.

Each pattern keeps one Graffiti hue across the whole topic: `blue`, `green`, `purple` or `orange`.

## Writing

Plain declarative sentences that say what happens. Write for a senior engineer reading carefully, not for a skimmer.

- No contrast framing: not "it's not X, it's Y", not "X, not Y", not "Neither A nor B is better". Say what each thing does.
- No slogans or punchlines ("the race is the lesson", "availability now, consistency eventually").
- No filler intensifiers (really, truly, simply, just) and no rhetorical questions in prose. A question to the room
  belongs in a control panel's "try this" line.
- One idea per sentence where you can. Define a term the first time, then use it the same way every time.
- The home page credits where the format comes from: `origin` in `src/site.json` links lnl.sam-peterson.com,
  the original site of this kind. Keep it.
- The footer credits the author (`author` in `src/site.json`). Notes about what a visitor does, such as how long
  data they create is kept or when switches turn off, go on the lesson page next to the control that does it.

## House style

- Plain and quiet, like a well-made reference page. The running patterns are the show.
- [Graffiti](https://graffiti-ui.com/) (`@drop-in/graffiti`, its full bundle) styles every page, used as shipped: its
  elements, layouts (`.layout-readable`, `.stack`, `.cluster`, `.layout-card`) and components (`.card`, `.chip`,
  `.callout`, `.tag`, `.log-card`, `.h1`–`.h6` sizes). Do not import its standalone modules (`/standard`,
  `/components`, ...): each re-declares Graffiti's tokens outside its cascade layers and overrides the real ones.
- No custom CSS. `src/styles/theme.css` only imports Graffiti; a test fails if it holds anything else or if another
  stylesheet appears.
- No coloured bars on top of cards or panels, no number badges, no gradients-as-decoration, no glow, no hero. Do not
  use Graffiti's decorative variants (`.box.glow`, gradient utilities, preset themes).
  A pattern's colour appears only in its name, its own panel and its timeline bars. Panels that are not one pattern's
  (controls, steps to take, shared results) stay neutral, so a colour always means the same pattern.
- Paragraph text runs the full width of the column. Do not cap line length.
- Every page fits a 390px phone with no sideways scrolling; the chip row wraps.
- Light and dark mode both work: Graffiti follows the system scheme with `light-dark()`.

## How to work (the ub-mode way)

First make it work, then make it right.

- **Data shape first.** Write the topic's `TOPIC.md` claims table before any code: each lesson's claim, the control
  that demonstrates it, and what is measured. If a claim has no control that shows it, it is not a lesson.
- **TDD.** Write the failing test first, see it fail for the reason you expect, make the smallest change that passes.
  Server code gets tests in `test/<topic>.integ.test.ts`, against the real site booted by Alchemy's test harness; each
  lesson's claim gets a test there that runs the pattern against that server and checks the measured outcome (for
  example "parallel total < sequential total"). Page code gets `test/<topic>.browser.test.ts` in Vitest browser mode.
- **Test behaviour, not implementation.** A test that would still pass if every function returned nothing is worthless.
- **Check data where it enters.** Parse query strings and bodies once at the edge of the topic's `server.ts`; trust
  them inside. Clamp anything a visitor controls (delays, counts) so a lesson cannot be used to hurt the service.
- **Make operations idempotent.** A visitor will double-click, refresh mid-run and open two tabs.
- **Isolate visitors.** Anything a visitor creates is theirs alone (a per-tab session id header) and is swept after a
  while. Switches a visitor turns on turn themselves off.
- **Subtract before you add.** Prefer one more lesson that shows one thing clearly over one lesson with five toggles.
- **Fix root causes.** A guard that hides a failure is not a fix.
- **Keep a log** of what you did and why, and report it when you finish.
- **Commit often**, small and ordered. Each message says why, what changed and how you proved it.
- **Deploying is outward-facing.** Never deploy, publish or push to a shared branch without the human's go-ahead.

If the ub tools are installed (crapper, dryer, mutator), run them on the topic you changed. Treat duplication _between_
patterns as intended; only de-duplicate inside one file.

## Adding a topic, step by step

1. Run `pnpm run generate` and answer its questions. The first run for a topic creates the topic, its Start here page,
   a lesson page that runs a placeholder pattern, a placeholder API, `TOPIC.md` and `FACILITATION.md`.
2. Use the `topic-designer` agent to write the question, the patterns, a glossary and the claims table in
   `src/topics/<slug>/TOPIC.md`. Run `pnpm run generate` again for each lesson in the claims table.
3. Fill in the topic's `title`, `emoji`, `summary` and each lesson's `blurb` in `src/site.json`.
4. Use the `pattern-builder` agent once per pattern, to build its file in `src/topics/<slug>/patterns/` and any server
   code it calls, for real and test first.
5. Write each lesson page to the anatomy above. For complete lessons, see https://github.com/greg-m-k/apollo-lnl and https://github.com/greg-m-k/useeffect-lnl.
6. Use the `lesson-reviewer` agent to review every page as a senior engineer new to the domain. Fix what it finds.
7. Use the `session-facilitator` agent to write `src/topics/<slug>/FACILITATION.md`, the talk track for presenting
   the topic live.
8. `pnpm run test`, and try it in `pnpm run dev`. All green before you push: CI (`.github/workflows/ci.yml`) runs the same
   checks. Open a pull request for review.

Anything a topic needs from Cloudflare (D1, Queues, Durable Objects, service bindings) is declared in `alchemy.run.ts`
and bound to the site's `env` there, so local runs and deploys use the same setup. Alchemy creates each resource on
first use: a local simulator under `pnpm run dev` and the tests, the real resource on deploy. Do not configure bindings
by hand in the Cloudflare dashboard.

## Adding a link

The home page lists Lunch & Learn sites hosted by other people under "Elsewhere". This site links to them and serves
none of their code or APIs. A site is eligible when it follows this format (one question, patterns built for real,
measured numbers) and its source code is public.

A link is one file, `src/links/<slug>.json`, added in a pull request:

```json
{
  "title": "Is useEffect a Code Smell?",
  "url": "https://lnl.greg.kitchen/effects/start/",
  "summary": "One or two sentences on the question it covers.",
  "source": "https://github.com/greg-m-k/useeffect-lnl",
  "vettedBy": "github-handle",
  "vettedOn": "2026-11-21"
}
```

`url` and `source` are `https:` links, and every field is required; `src/content.config.ts` checks this at build time.
A maintainer opens the site and its source, then merges the pull request. `vettedBy` and `vettedOn` name that
maintainer and the date; the pull request is the full record.

## Commands

```
pnpm install                      pnpm fetches the Node and pnpm versions set in package.json
pnpm run lint                     type-aware oxlint, and oxfmt's format check
pnpm run format                   format every file with oxfmt
pnpm run check                    type-check every .ts and .astro file
pnpm run test                     syncs Astro's content, then node checks, the site booted by Alchemy's harness, and
                                  page code in Chrome
pnpm run dev                      the site and APIs at http://localhost:8800
pnpm run generate                 add a lesson, and its topic if new (asks, or takes <topic> <lesson> "Title")
pnpm run login                    connect a Cloudflare account to Alchemy (only needed to deploy)
pnpm run deploy                   deploy (ask first)
pnpm run destroy                  remove a deployment (ask first)
pnpm run state:bootstrap          create the Cloudflare state store once, before CI deploys (ask first)
```

## Glossary of this kit

- **Topic**: one design question and its competing patterns, with a set of lessons.
- **Pattern**: one complete answer to the topic's question, built for real.
- **Lesson**: one page that demonstrates one claim about the patterns with one control.
- **Claim**: a statement a lesson proves by measurement, such as "parallel costs the slowest call, not the sum".
- **Control**: the button, slider or switch the visitor uses to test a claim.
- **Switch**: a control that breaks something for real (a service refuses, a broker stops). Switches turn themselves off.
