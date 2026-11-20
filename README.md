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

- A site shell built with Astro: a home page of plain topic cards, lesson pages with a chip menu (`src/layouts/`), and a
  house style that works on a phone and in dark mode. Topics and lessons are listed once, in `src/site.json`.
- Lesson building blocks (`src/lib/ui.js`): measured timelines, consoles, switches, and `showSource` to put the exact
  pattern code that ran on screen.
- A placeholder topic, **Sample topic**, showing where everything goes: a Start here page and one lesson page, a
  placeholder endpoint, and TODO notes. Rename or replace it with your own topic. For complete Lunch & Learns built
  from this kit, see [apollo-lnl](https://github.com/greg-m-k/apollo-lnl) and [useeffect-lnl](https://github.com/greg-m-k/useeffect-lnl).
- `AGENTS.md`: the rules and workflow for building a topic, for coding agents and the engineers directing them.
- Subagents in `.claude/agents/`: `topic-designer`, `pattern-builder`, `lesson-reviewer`, `session-facilitator`.
- A scaffold: `pnpm run new-lesson <topic> <lesson> "Title"`.

## Run it on your laptop

Every topic runs locally from a fresh clone. You need pnpm and Chrome, and nothing else: no Cloudflare account.
Install pnpm once with `npm install -g pnpm`. pnpm then fetches the Node and pnpm versions set in `package.json` for
this project.

```
pnpm install
pnpm run test        # unit checks, the site served locally by Alchemy, the site frame in Chrome
pnpm run dev         # http://localhost:8800
```

## How it is put together

The site is one Astro project that runs as a Cloudflare Worker. `alchemy.run.ts` declares it, and any Cloudflare
resources a topic needs (D1 databases, Queues, Durable Objects) are added there as code. `pnpm run dev` runs all of it
on your machine with [Alchemy](https://alchemy.run), in Cloudflare's own Workers runtime, so no account is needed.

### Continuous integration

`.github/workflows/ci.yml` runs `pnpm run test` on every pull request and every push to `main`. It needs no secrets.
Turn on branch protection for `main` and require the `ci` check, so nothing merges unless every lesson still works.

### Hosting your own copy

Running locally never needs Cloudflare. To host your own copy:

1. In `src/site.json`, set `"repo"` to your repository's URL so each topic links to its source, and `"author"` to your
   name and site for the footer credit.
2. In `alchemy.run.ts`, replace `Alchemy.localState()` with `Cloudflare.state()`, as its comment says.
3. `pnpm run login` connects your Cloudflare account; `pnpm run deploy` deploys. `pnpm run destroy` removes it again.
   (Plain `pnpm deploy` is a different, built-in pnpm command.)

## Make a topic

Read `AGENTS.md`, then follow "Adding a topic, step by step". With Claude Code:

```
> Use the topic-designer agent: our team argues about retrying failed calls vs failing fast.
```

Replace the placeholder topic (`src/pages/sample/`, `src/topics/sample/`, its entry in `src/site.json`, and the sample
checks in `test/`) with your own.
