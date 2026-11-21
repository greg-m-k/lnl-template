// __TOPIC__ topic · placeholder server code. Replace it with the real code your patterns call.
// It answers everything below /__TOPIC__/api/. Report the server's own time in x-time-ms, so lesson pages can draw
// measured timelines.
export function handle(request: Request) {
  const started = Date.now();
  const path = new URL(request.url).pathname;
  if (path !== '/__TOPIC__/api/hello') return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(
    { hello: "TODO: replace with your topic's real endpoint" },
    { headers: { 'x-time-ms': String(Date.now() - started), 'cache-control': 'no-store' } },
  );
}
