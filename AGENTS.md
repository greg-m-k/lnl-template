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
  lesson shows that exact file (`showSource`). Duplicated plumbing between patterns is fine and expected.
  Never extract the pattern under comparison into a shared helper.
- **Written for a senior engineer from another field.** Define every term the first time it appears, even ones
  that feel basic inside the domain ("domain", "projection", "idempotent", "waterfall"). Say what each pattern
  gets you and what it costs, in that order, for every pattern.

## Layout

```
public/topics.json                    The catalogue: site intro, topics, lessons. The one place lessons are listed.
public/index.html                     Home: rendered from topics.json (lib/site.js home()).
public/styles.css                     House style. Change it here, never per page.
public/lib/site.js                    Site frame: home cards, lesson chips, Next link, footer.
public/lib/ui.js                      Lesson helpers: el, logger, say, press/pressed, timeline, showSource, busy.
public/<topic>/<lesson>/index.html    One page per lesson. The first lesson of every topic is start/.
public/<topic>/patterns/<pattern>.js  Browser-side pattern code, one standalone file per pattern.
topics/<topic>/api.js                 The topic's real server code, registered in src/index.js.
topics/<topic>/patterns/<pattern>/    A topic that needs its own Workers puts each pattern's services here.
topics/<topic>/TOPIC.md               The question, the patterns, the glossary, and the claim each lesson proves.
topics/<topic>/FACILITATION.md        The talk track for presenting the topic live.
src/index.js                          The site Worker: static files, plus /api/<topic>/... to the topic.
scripts/new-lesson.mjs                Scaffold: npm run new-lesson -- <topic> <lesson> "Title".
test/site.test.mjs                    Catalogue, scaffold and server tests (npm test).
test/ui.mjs                           Browser walkthrough of every page (npm run ui, needs npm run dev).
.claude/agents/                       Subagents for each stage of building and presenting a topic.
```

## Lesson anatomy

Every lesson page has the same shape, so a room can follow it on a projector:

1. **Chips** (drawn by `lesson()`): Home, then every lesson in the topic, current one filled.
2. **h1**: the lesson's question in plain words ("When a service goes down").
3. **Lead paragraph**: the situation, each pattern in one sentence with its name in its colour
   (`<strong data-color="blue">`), what to try, and "New to these terms? Start here".
4. **Control panel**: the run button, a status line, the sliders and switches, and one line suggesting what to
   try and asking for a prediction.
5. **One panel per pattern, side by side** (`.cols` > `.panel[data-color]`): a one-line description, the measured
   timeline, the code that ran, the answer, the console. Same order in every panel.
6. **Insight callout**: what the run showed and when the "losing" pattern is still the right choice.
7. **Next link and footer** (drawn by `lesson()`).

A **Start here** page (`class="prose"`) opens each topic: the problem, then for each pattern what it does, a small
diagram in a `<pre>`, what you get, what it costs, then a glossary (`<dl>`) of every term.

Each pattern keeps one colour across the whole topic: `blue`, `green`, `purple` or `orange`.

## House style

- Plain and quiet, like a well-made reference page. The running patterns are the show.
- No coloured bars on top of cards or panels, no number badges, no gradients-as-decoration, no glow, no hero.
  A pattern's colour appears only in its name, its panel heading and its timeline bars.
- Paragraph text runs the full width of the column. Do not cap line length.
- Every page fits a 390px phone with no sideways scrolling; the chip row scrolls on its own.
- Light and dark mode both work, from the tokens in `styles.css`.

## How to work (the ub-mode way)

First make it work, then make it right.

- **Data shape first.** Write the topic's `TOPIC.md` claims table before any code: each lesson's claim, the control
  that demonstrates it, and what is measured. If a claim has no control that shows it, it is not a lesson.
- **TDD.** Write the failing test first, see it fail for the reason you expect, make the smallest change that passes.
  Server code gets unit tests in `test/`; each lesson's claim gets a step in `test/ui.mjs` that presses the control and
  checks the measured outcome (for example "parallel total < sequential total").
- **Test behaviour, not implementation.** A test that would still pass if every function returned nothing is worthless.
- **Check data where it enters.** Parse query strings and bodies once at the edge of `api.js` (see `parseWork`); trust
  them inside. Clamp anything a visitor controls (delays, counts) so a lesson cannot be used to hurt the service.
- **Make operations idempotent.** A visitor will double-click, refresh mid-run and open two tabs.
- **Isolate visitors.** Anything a visitor creates is theirs alone (a per-tab session id header) and is swept after a
  while. Switches a visitor turns on turn themselves off.
- **Subtract before you add.** Prefer one more lesson that shows one thing clearly over one lesson with five toggles.
- **Fix root causes.** A guard that hides a failure is not a fix.
- **Keep a log** of what you did and why, and report it when you finish.
- **Commit often**, small and ordered. Each message says why, what changed and how you proved it.
- **Deploying is outward-facing.** Never deploy, publish or push to a shared branch without the human's go-ahead.

If the ub tools are installed (crapper, dryer, mutator), run them on the topic you changed. Treat duplication *between*
patterns as intended; only de-duplicate inside one file.

## Adding a topic, step by step

1. `topic-designer` agent: turn the argument into `topics/<slug>/TOPIC.md` (question, patterns, glossary, claims table).
2. `npm run new-lesson -- <slug> <lesson> "Title"` for each lesson in the claims table. The first call also creates
   the topic, its Start here page and `TOPIC.md` if it does not exist.
3. Fill in the topic's `title`, `emoji`, `summary` and each lesson's `blurb` in `public/topics.json`.
4. `pattern-builder` agent, once per pattern: the real pattern code and any server code, test first.
5. Write each lesson page to the anatomy above, using `public/requests/` as the worked example.
6. `lesson-reviewer` agent: review every page as a senior engineer new to the domain. Fix what it finds.
7. `session-facilitator` agent: write `topics/<slug>/FACILITATION.md`.
8. `npm test`, `npm run dev`, `npm run ui`. All green before you ask to deploy.

## Commands

```
npm install
npm test                 unit tests: catalogue, scaffold, topic servers
npm run dev              the site and APIs at http://localhost:8800
npm run ui               browser walkthrough against BASE (default http://localhost:8800)
npm run new-lesson -- <topic> <lesson> "Title"
npm run deploy           wrangler deploy (ask first)
```

## Glossary of this kit

- **Topic**: one design question and its competing patterns, with a set of lessons.
- **Pattern**: one complete answer to the topic's question, built for real.
- **Lesson**: one page that demonstrates one claim about the patterns with one control.
- **Claim**: a statement a lesson proves by measurement, such as "parallel costs the slowest call, not the sum".
- **Control**: the button, slider or switch the visitor uses to test a claim.
- **Switch**: a control that breaks something for real (a service refuses, a broker stops). Switches turn themselves off.
