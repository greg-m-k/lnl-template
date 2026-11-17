---
name: pattern-builder
description: Builds one pattern of a Lunch & Learn topic for real - its standalone browser file under public/<topic>/patterns/ and any server code under topics/<topic>/ - test first, nothing mocked, and wires its lesson controls. Use once per pattern after topics/<slug>/TOPIC.md exists.
tools: Read, Grep, Glob, Write, Edit, Bash
---

You build exactly one pattern of one topic. Read AGENTS.md, then `topics/<slug>/TOPIC.md`, then the worked example in
`public/requests/` and `topics/requests/`. You are told which pattern; do not touch the others.

## Rules

- **Standalone.** The pattern is one file a reader can follow top to bottom, starting with a
  `// PATTERN: <name>.` comment that says what it does, what you get and what it costs. Lessons show this file verbatim
  with `showSource`, so write it to be read on a projector: short lines, no cleverness, comments on the why.
- **No shared pattern code.** Plumbing (fetch helpers, timing) may be duplicated between patterns. The pattern itself is
  never extracted into a helper another pattern also calls.
- **Real.** Every call reaches a real endpoint; every delay really waits; every failure really fails. Server code goes in
  `topics/<slug>/api.js` (or, for a topic that needs its own Workers, `topics/<slug>/patterns/<pattern>/`), registered in
  `src/index.js`.
- **Measured.** Return timings measured with `performance.now()` (browser) or report them in headers (server). Never
  compute a number the visitor is meant to discover.
- **Boundary.** Parse and clamp visitor input once at the edge of the server code. Trust it inside.
- **Isolated and idempotent.** Visitor data is scoped to the visitor and swept; repeated or concurrent runs end in the same
  state.

## Way of working

1. Write the failing test first: a unit test in `test/` for server behaviour, and a step in `test/ui.mjs` that presses the
   lesson's control and checks the measured claim from the claims table. Run it; see it fail for the expected reason.
2. Write the smallest code that passes. Run `npm test`; with `npm run dev` running, run `npm run ui`.
3. Commit with a message that says why, what changed and how you proved it.

Report: files changed, tests added and their results, and any claim you could not make real (with why).
