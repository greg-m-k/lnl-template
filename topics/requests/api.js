// TOPIC: Sequential vs Parallel Requests · the server both patterns call.
// GET /api/requests/work?name=profile&ms=300&fail=1
// Really waits `ms` before answering (0 to 3000), so the browser's timings are real network
// timings, not numbers drawn on a slide. fail=1 answers 503 after the wait, like a service
// that times out and then gives up.
const MAX_MS = 3000;

// Parse the query once, at the boundary. Inside, trust it.
export function parseWork(url) {
  const q = new URL(url).searchParams;
  const ms = Number(q.get("ms") ?? 0);
  if (!Number.isFinite(ms)) return { error: "ms must be a number" };
  const name = (q.get("name") ?? "work").slice(0, 40);
  return { name, ms: Math.min(MAX_MS, Math.max(0, Math.round(ms))), fail: q.get("fail") === "1" };
}

export async function handle(request) {
  const path = new URL(request.url).pathname;
  if (path !== "/api/requests/work") return Response.json({ error: "not found" }, { status: 404 });
  const work = parseWork(request.url);
  if (work.error) return Response.json(work, { status: 400 });
  const started = Date.now();
  await new Promise((resolve) => setTimeout(resolve, work.ms));
  const body = { name: work.name, waitedMs: Date.now() - started };
  const headers = { "cache-control": "no-store" };
  return work.fail
    ? Response.json({ ...body, error: `${work.name} failed` }, { status: 503, headers })
    : Response.json(body, { headers });
}
