# Sequential vs Parallel Requests

The worked example topic. Small on purpose: copy its shape, not its subject.

Where everything lives:

- Pages: `public/requests/start/`, `public/requests/race/`
- Pattern code the browser runs: `public/requests/patterns/sequential.js`, `public/requests/patterns/parallel.js`
- Server code: `topics/requests/api.js` (`GET /api/requests/work?name=&ms=&fail=`), registered in `src/index.js`
- Talk track: `topics/requests/FACILITATION.md`

## The question

A page needs several answers that do not depend on each other. Should it ask for them one after another, or all at once?

## The patterns

**Sequential requests** (blue): await each call before starting the next. You get code that reads top to bottom and a
natural place to stop on failure. It costs the sum of every call, and each added call adds its whole length.

**Parallel requests** (green): start every call, then `Promise.all`. You get a wait as long as the slowest call. It costs
more simultaneous load on the server and forces a decision about partial failure.

## Glossary

- **Request waterfall**: calls that run one after another when they did not need to.
- **Independent calls**: calls whose inputs do not include each other's outputs.
- **Promise.all / Promise.allSettled**: wait for every promise; the first rejects on the first failure, the second reports each outcome.
- **Latency**: time from asking to receiving the answer, measured in the browser with `performance.now()`.

## Lessons and the claim each one proves

| Lesson | Claim | Control | Measured | Prediction to ask |
|---|---|---|---|---|
| Start here | The reader can explain both patterns and their costs | none | none | "Which does your team's code do today?" |
| Three calls, two ways | Sequential costs the sum, parallel the slowest call | three latency sliders | each call's span and both totals, in the browser | "Three calls of 300ms: each total?" |
| Three calls, two ways | A failure stops the sequential run; parallel still gets the other answers | "Make orders fail" switch | which calls were asked and their status | "Orders fails: who still shows recommendations?" |

## What is real

The Worker really waits `ms` before answering and really answers 503 when `fail=1`. The browser really makes each call;
every bar is measured.

## Risks and clamps

`ms` is clamped to 0–3000 and `name` to 40 characters in `parseWork`. Nothing is stored.
