// PATTERN: Sequential requests.
// Ask for each answer only after the previous one has arrived. Simple to read and to stop
// early on a failure, but the total is the sum of every call: a "request waterfall".
// Returns one measured span per call, in ms from the start of the run.
export async function run(calls, fetchJson) {
  const t0 = performance.now();
  const spans = [];
  for (const call of calls) {
    const start = performance.now() - t0;
    const result = await fetchJson(call.url);
    spans.push({ name: call.name, start, end: performance.now() - t0, ok: result.ok });
    if (!result.ok) break;  // a failed step stops the rest: nothing after it is asked
  }
  return { spans, total: performance.now() - t0 };
}
