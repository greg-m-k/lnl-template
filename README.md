```
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⡠⠤⡴⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠤⠀⠒⠒⠀⠉⠁⠀⠀⡠⠊⡴⠃
⢀⡄⣤⣤⠴⠒⠒⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠞⣠⡺⡄⠀
⠈⢧⣀⣈⠉⠓⠒⠤⢤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡔⢡⢞⢯⡪⠉⣹
⠀⢠⢻⠛⣏⡷⠶⡤⢄⣀⡉⠉⠒⠲⠤⢄⣀⠀⠀⡠⢊⡴⢕⡿⠋⣠⠎⡇
⢰⣚⠓⠒⠚⠀⠂⠹⠖⣚⣯⠭⣖⠂⠠⠤⢀⣉⢻⡠⢾⡵⢋⢴⣺⣥⣾⡇
⢯⠪⠭⠹⢻⠶⠶⢆⣤⢤⣀⣉⠁⠳⣀⣠⣜⣛⡫⠔⢉⣴⢟⡜⢸⣅⠟⠁
⠸⣟⡒⠲⣖⠒⠚⠉⠘⢦⡙⠮⢝⡛⠷⠶⢤⣄⣀⣰⡯⢖⡟⢈⠟⠁⠀⠀
⠀⠀⠈⠉⠒⠫⠶⣒⡒⠛⠛⠷⢶⠤⠤⣥⠤⠖⠋⠀⢰⢊⠖⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠐⠒⠤⢅⣉⠉⠛⠳⡤⢶⠟⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠑⠲⠗⠁⠀⠀⠀⠀⠀⠀⠀⠀

          lunch  &  learn
```

# Lunch & Learn kit

A starting point for interactive Lunch & Learn sessions: take one design question your team keeps arguing about, build
every competing answer for real, and let people run them side by side, slow them down, break them and time them.
Nothing is mocked; every number is measured while you watch.

It comes with:

- A site shell: a home page of plain topic cards, lesson pages with a chip menu, and a house style that works on a phone
  and in dark mode. Topics and lessons are listed once, in `public/topics.json`.
- Lesson building blocks (`public/lib/ui.js`): measured timelines, consoles, switches, and `showSource` to put the exact
  pattern code that ran on screen.
- A placeholder topic, **Sample topic**, showing where everything goes: a Start here page and one lesson page, a
  placeholder endpoint, and TODO notes. Rename or replace it with your own topic. For complete Lunch & Learns built
  from this kit, see [apollo-lnl](https://github.com/greg-m-k/apollo-lnl) and [useeffect-lnl](https://github.com/greg-m-k/useeffect-lnl).
- `AGENTS.md`: the rules and workflow for building a topic, for coding agents and the engineers directing them.
- Subagents in `.claude/agents/`: `topic-designer`, `pattern-builder`, `lesson-reviewer`, `session-facilitator`.
- A scaffold: `pnpm new-lesson <topic> <lesson> "Title"`.

## Run it on your laptop

Every topic runs locally from a fresh clone. You need pnpm and nothing else: no Cloudflare account. Install pnpm once
with `npm install -g pnpm`. pnpm then fetches the Node and pnpm versions set in `package.json` for this project.

```
pnpm install
pnpm test
pnpm dev             # http://localhost:8800
pnpm ui              # in a second terminal: walks every page in Edge (CHANNEL=chrome for Chrome)
```

Deploying (below) gives a topic its live page on your Lunch & Learn site. It is never required to run one.

## Put it on Cloudflare

The whole kit is one Cloudflare Worker: it serves `public/` and answers each topic's `/<topic>/api/...`. The free plan is
enough. Topics that need more (D1 databases, Queues, Durable Objects) add them to `wrangler.jsonc` and they deploy the
same way.

### 1. Make it yours

In `wrangler.jsonc`, change `"name": "lnl"` to a Worker name that is unique in your Cloudflare account. In
`public/topics.json`, set `"repo"` to your repository's URL so each topic links to its source, and `"author"` to
your name and site for the footer credit. Commit and push.

### 2. Connect the repository (recommended: Workers Builds)

Cloudflare builds and deploys straight from GitHub. There are no API tokens to create and no secrets to store in GitHub.

1. In the Cloudflare dashboard: **Workers & Pages > Create > Import a repository**.
2. **Connect GitHub** and install the Cloudflare GitHub app. Give it access to this repository only.
3. Pick the repository and set:
   - **Project name**: exactly the `name` in `wrangler.jsonc`.
   - **Build command**: `pnpm test` (a failing test stops the deploy).
   - **Deploy command**: `pnpm run deploy`.
   - **Non-production branch deploy command**: `pnpm run deploy:preview`.
4. **Deploy**.

From then on, every push to `main` deploys, and every other branch gets its own preview URL, which is posted on its pull
request. Builds and logs are under the Worker's **Deployments** tab.

### 3. Your own domain (optional)

In `wrangler.jsonc`, uncomment `routes` and set your hostname (`lnl.example.com`) with `"custom_domain": true`. The
domain's zone must be on the same Cloudflare account. The next deploy creates the DNS record and certificate.

### Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: `pnpm test`, then `wrangler dev` and the browser
walkthrough of every page in Chrome. It needs no secrets. Turn on branch protection for `main` and require the `ci`
check, so nothing merges, and therefore nothing deploys, unless every lesson still works.

### Deploying from GitHub Actions instead

If you cannot install the Cloudflare GitHub app, use `.github/workflows/deploy.yml`. It is off until you opt in:

1. Create an API token in Cloudflare (**My Profile > API Tokens > Create Token > "Edit Cloudflare Workers"**).
2. In GitHub, **Settings > Secrets and variables > Actions**: add secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`, and a variable `DEPLOY_WITH_ACTIONS` = `true`.

Use one deploy path, not both.

### From your laptop

`pnpm run login`, then `pnpm run deploy` (plain `pnpm deploy` is a different, built-in pnpm command).

## Mount a topic on another Lunch & Learn site

Each topic lives entirely below its own path (`/sample/...` for the placeholder): its pages, its API and the site frame
it uses. So a topic deployed from this repository can also appear on another Lunch & Learn site, next to that site's
own topics. On the other site:

1. Bind this Worker as a service, in its `wrangler.jsonc`:
   `"services": [{ "binding": "SAMPLE", "service": "<this Worker's name>" }]`.
2. Forward the topic's path to it, in its Worker:
   `if (url.pathname.startsWith("/sample/")) return env.SAMPLE.fetch(request);`
   and add `"/sample/*"` to its `run_worker_first`.
3. List the topic and its lessons in its `topics.json`, so its home page shows the cards.

lnl.greg.kitchen serves the useEffect topic this way, from its own repository, below `/effects/`.

## Make a topic

Read `AGENTS.md`, then follow "Adding a topic, step by step". With Claude Code:

```
> Use the topic-designer agent: our team argues about retrying failed calls vs failing fast.
```

Replace the placeholder topic (`public/sample/`, `topics/sample/`, its entry in `public/topics.json` and `src/index.js`, and
the sample checks in `test/`) with your own.
