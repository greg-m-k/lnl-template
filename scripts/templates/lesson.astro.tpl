---
import Source from '../../components/Source.astro';
import Lesson from '../../layouts/Lesson.astro';
import example from '../../topics/__TOPIC__/patterns/example.ts?raw';

export const prerender = true;
---

<Lesson title="__TITLE_ATTR__">
  <h1>__TITLE__</h1>
  <p>
    TODO: the question this lesson answers, and each pattern in one sentence with its name as a tag in its colour, like
    <span class="tag" style="--tag-color: var(--blue)">Example</span>. Say what to try, and link back to
    <a href="/__TOPIC__/start/">Start here</a> for the terms.
  </p>
  <!-- See AGENTS.md "Lesson anatomy". Complete lessons: https://github.com/greg-m-k/apollo-lnl and https://github.com/greg-m-k/useeffect-lnl. -->

  <div class="card stack">
    <div class="cluster">
      <button id="run" type="button">Run</button>
      <span id="status" class="tag muted">Not run yet</span>
    </div>
    <p>TODO: what to try, and a prediction to make before pressing Run.</p>
  </div>

  <div class="layout-card">
    <section class="card stack" aria-labelledby="example">
      <h2 class="h5">
        <span id="example" class="tag" style="--tag-color: var(--blue)">Example</span>
      </h2>
      <p>TODO: what this pattern does, in one sentence.</p>
      <div id="timeline"></div>
      <Source code={example} />
      <div class="log-card">
        <header><span class="label">Console</span></header>
        <pre id="console"></pre>
      </div>
    </section>
  </div>
</Lesson>

<script>
  import { busy, logger, say, timeline } from '../../lib/ui.ts';
  import { run } from '../../topics/__TOPIC__/patterns/example.ts';

  const button = document.querySelector('#run');
  const status = document.querySelector('#status');
  const chart = document.querySelector('#timeline');
  const pre = document.querySelector('#console');
  if (
    !(button instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement) ||
    !(chart instanceof HTMLElement) ||
    !(pre instanceof HTMLElement)
  ) {
    throw new Error('the lesson is missing its controls');
  }
  const log = logger(pre);

  const once = busy(button, async () => {
    say(status, 'Running…', 'wait');
    try {
      const { status: code, ms } = await run(location.origin);
      const ok = code === 200;
      timeline(chart, [{ name: 'Example', start: 0, end: ms, color: 'blue', failed: !ok }]);
      log.log(`GET /__TOPIC__/api/hello → ${code} in ${Math.round(ms)}ms`, ok ? 'ok' : 'err');
      say(status, ok ? `Answered in ${Math.round(ms)}ms` : `Failed with ${code}`, ok ? 'ok' : 'err');
    } catch (error) {
      log.log(`GET /__TOPIC__/api/hello failed: ${String(error)}`, 'err');
      say(status, 'The request did not complete', 'err');
    }
  });
  button.addEventListener('click', () => void once());
</script>
