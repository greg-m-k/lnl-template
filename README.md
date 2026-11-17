# Lunch & Learn kit

A starting point for interactive Lunch & Learn sessions: take one design question your team keeps arguing about, build
every competing answer for real, and let people run them side by side, slow them down, break them and time them.
Nothing is mocked; every number is measured while you watch.

It comes with:

- A site shell: a home page of plain topic cards, lesson pages with a chip menu, and a house style that works on a phone
  and in dark mode. Topics and lessons are listed once, in `public/topics.json`.
- Lesson building blocks (`public/lib/ui.js`): measured timelines, consoles, switches, and `showSource` to put the exact
  pattern code that ran on screen.
- A worked example topic, **Sequential vs Parallel Requests**, with a Start here page, one interactive lesson, its real
  Worker endpoint, tests and a facilitation script.
- `AGENTS.md`: the rules and workflow for building a topic, for coding agents and the engineers directing them.
- Subagents in `.claude/agents/`: `topic-designer`, `pattern-builder`, `lesson-reviewer`, `session-facilitator`.
- A scaffold: `npm run new-lesson -- <topic> <lesson> "Title"`.

## Start

```
npm install
npm test
npm run dev          # http://localhost:8800
npm run ui           # in a second terminal: walks every page in Edge (CHANNEL=chrome for Chrome)
```

Runs on Cloudflare Workers. Before the first deploy, rename the Worker and set your domain in `wrangler.jsonc`, set
`repo` in `public/topics.json` to your repository URL, then `npm run deploy`.

## Make a topic

Read `AGENTS.md`, then follow "Adding a topic, step by step". With Claude Code:

```
> Use the topic-designer agent: our team argues about retrying failed calls vs failing fast.
```

Delete the example topic (`public/requests/`, `topics/requests/`, its entry in `public/topics.json` and `src/index.js`,
and its steps in `test/`) once you have your own.
