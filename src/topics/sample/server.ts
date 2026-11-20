// Sample topic · placeholder server code. Replace it with the real code your patterns call.
// Everything a topic serves lives below /<slug>/, so its API is /sample/api/...
// Report the server's own time in x-time-ms (and a breakdown in x-timing-details), so lesson pages can
// draw measured timelines.
export async function handle(request: Request) {
  const started = Date.now();
  const path = new URL(request.url).pathname;
  if (path !== "/sample/api/hello") return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ hello: "TODO: replace with your topic's real endpoint" },
    { headers: { "x-time-ms": String(Date.now() - started), "cache-control": "no-store" } });
}
