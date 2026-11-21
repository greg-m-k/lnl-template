## What this adds

<!-- The topic or link, the question it answers, and the patterns it compares. -->

## Checklist (CONTRIBUTING.md, "What gets accepted")

- [ ] Uses only Workers, static assets, KV, D1, Queues, Durable Objects and service bindings.
- [ ] Runs from a fresh clone with `pnpm install` and `pnpm run dev`, logged out of Cloudflare.
- [ ] Clamps every value a visitor controls where it enters the server code.
- [ ] Keeps visitor data per tab and sweeps it after a set time; switches turn themselves off.
- [ ] Follows `AGENTS.md`: one question, every pattern built for real, every number measured.
- [ ] `pnpm run lint`, `pnpm run check` and `pnpm run test` pass.
