// PATTERN: Parallel requests.
// Start every call at once and wait for all of them with Promise.all. The total is the time
// of the slowest call. fetchJson reports a failure as { ok: false } instead of throwing, so one
// failed call does not hide the others: every call is made, and the page decides what to show
// with the answers it did get.
// Returns one measured span per call, in ms from the start of the run.
export async function run(calls, fetchJson) {
  const t0 = performance.now();
  const spans = await Promise.all(calls.map(async (call) => {
    const start = performance.now() - t0;
    const result = await fetchJson(call.url);
    return { name: call.name, start, end: performance.now() - t0, ok: result.ok };
  }));
  return { spans, total: performance.now() - t0 };
}
