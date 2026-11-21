# 5. Move the site to Astro (on Alchemy)

**Status: done (2026-11-20).** Astro 7.4.13 (not 6). Pages are `.astro` in `src/pages/`, in `Base.astro` and
`Lesson.astro` layouts that draw the chips, Next link and footer when the page is built. Deviations from the plan
below: one catalogue, `src/site.json` (moved from `public/topics.json`), instead of a content collection with a
`topic.json` per topic; page skeletons stay inline in `scripts/new-lesson.mjs` instead of a `templates/` folder;
`showSource` with `?raw` waits for todo 9, since no topic has pattern files yet. The API route finds
`src/topics/<topic>/server.js` by folder. wrangler, `wrangler.jsonc` and `deploy.yml` are gone; `login`, `deploy`
and `destroy` scripts use Alchemy. README and AGENTS.md describe the new layout. Tests: the harness checks the served
pages and API; the browser project renders every page with Astro's Container API (a Vitest browser command) and checks
390px width and console errors in Chrome. 21/21 pass. A scaffolded demo topic rendered and passed every page check.

Depends on: 4 (go / no-go decides the Cloudflare config). Biggest todo; land it in small commits.

## Why

- Pages become `.astro` files: HTML with a frontmatter block, ship no JavaScript unless a script asks for it.
- The site frame (chips, Next link, footer) is rendered at build time by a layout instead of drawn by `lib/site.js`
  in the browser.
- File-based routes replace `src/index.js`'s hand-written router. A topic's server code is an API route.
- Astro 6 dev runs in workerd, so local behaviour matches Cloudflare. Astro is Cloudflare-owned since January 2026.
- Vite `?raw` imports give `showSource` the exact pattern file at build time.

## Scope change: no more mounting topics on another site

Drop the "a topic owns every path below `/<topic>/` so another site can forward to it" design: the `/<topic>/site/`
frame copies, `run_worker_first` globs, the README section, and the tests for it. The site's purpose is minimal,
local-first repls. Other Lunch & Learn sites appear as vetted links (todo 10), not as mounted Workers.

## Target layout

```
alchemy.run.ts                          Cloudflare config: the site, and any bindings a topic needs
astro.config.ts                         Minimal; no adapter config if Alchemy's Website.Astro owns it
src/layouts/Base.astro                  <head>, stylesheet, footer
src/layouts/Lesson.astro                Base + chips for the topic + Next link
src/content.config.ts                   Collections: topics (and links, todo 10), with zod schemas
src/topics/<topic>/topic.json           Title, emoji, summary, ordered lessons (path, title, chip, blurb)
src/topics/<topic>/TOPIC.md             Unchanged role
src/topics/<topic>/FACILITATION.md      Unchanged role
src/topics/<topic>/patterns/<p>.js      Standalone pattern files (browser side)
src/topics/<topic>/server.js            The topic's server code (today's api.js), plain fetch handler
src/pages/index.astro                   Home: topics from the collection
src/pages/<topic>/start.astro           Start here (prerendered)
src/pages/<topic>/<lesson>.astro        Lessons (prerendered)
src/pages/<topic>/api/[...path].ts      On-demand route: `export const ALL = ({ request, locals }) => server.handle(request, env)`
templates/lesson.astro, templates/start.astro, templates/topic.json   Scaffold sources
scripts/new-lesson.mjs                  Copies templates, adds the lesson to topic.json
```

Pages are prerendered (`export const prerender = true` or `output: "static"` with on-demand API routes). Only
`/<topic>/api/*` runs in the Worker.

## Steps

1. Tests first, ported to the new layout and failing:
   - catalogue: every topic starts with Start here, slugs unique, every lesson path has a page file.
   - scaffold: `addLesson` (pure) tests carry over unchanged.
   - topic server: `server.handle` answers `/sample/api/hello` with `x-time-ms`, 404s otherwise.
   - ui: home cards, chips with current lesson, phone width, footer credit, no console errors (drop the
     "requests stay below the topic path" test with the mount design).
2. Scaffold Astro in place (`astro`, the Alchemy packages pinned in todo 4). `alchemy.run.ts` per the spike.
   `dev` script → `alchemy dev` on port 8800; `build` → `astro build`. Deploying is todo 11.
3. Layouts: port `lib/site.js` `home()` and `lesson()` to `Base.astro` / `Lesson.astro`, reading the topics collection.
   Keep `lib/ui.js` (browser helpers: `el`, `logger`, `say`, `press`, `timeline`, `showSource`, `busy`) as a module
   imported from lesson `<script>` tags.
4. Port the sample topic: two pages, `api.js` → `server.js` + the API route, `topics.json` entry → `topic.json`.
5. `showSource`: lessons import `?raw` and render the source at build time (todo 9 adds highlighting).
6. Scaffold: `pnpm new-lesson <topic> <lesson> "Title"` copies `templates/*`, writes `topic.json` entries (new topic
   gets Start here first), never overwrites. Astro has no route generator; this stays ours and gets shorter.
7. Delete `public/index.html`, `public/<topic>/`, `public/lib/site.js`, `public/topics.json`, `src/index.js`,
   `wrangler.jsonc` (if go), `topics/`.
8. Done in todo 4: `pnpm run test` is Vitest with a node project (unit checks plus Alchemy's test harness booting the
   site locally) and a browser project (page code in Chrome); `test/ui.mjs` and CI's start-the-server loop are gone;
   `.gitignore` has `.alchemy/`, `dist/`, `.astro/`. Move any new page code's checks into `*.browser.test.ts`.
9. Remove `deploy.yml`, `wrangler-action` and the Workers Builds instructions; todo 11 replaces them with an Alchemy
   deploy. CI for tests needs no secrets.
10. Rewrite `AGENTS.md` Layout, Lesson anatomy paths, "Adding a topic", and Commands for the new structure.
11. Update `.claude/agents/*` paths **only when asked** (they were left out of this review on purpose).

## Done when

- Fresh clone, logged out: `pnpm install && pnpm dev` serves home and the sample lesson on :8800, `pnpm test` and
  `pnpm run test` passes.
- `pnpm new-lesson demo race "The race"` produces a page that builds and shows in the chips.
- No `public/lib/site.js`, `src/index.js`, `wrangler.jsonc`, or `/<topic>/site/` paths remain.
