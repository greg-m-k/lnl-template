// The site's Cloudflare setup: one Astro site, run as a Worker. `pnpm run dev` runs it locally in workerd.
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Alchemy from 'alchemy';
import * as Effect from 'effect/Effect';

export const Website = Cloudflare.Website.Astro('Site', {
  dev: { port: 8800 },
});

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

export default Alchemy.Stack(
  'lnl',
  {
    providers: Cloudflare.providers(),
    // State lives on this machine in .alchemy/ (gitignored), so `pnpm run dev` needs no Cloudflare account.
    // Hosting your own Lunch & Learn from this template? Replace with `Cloudflare.state()` to keep deploy
    // state in your Cloudflare account, shared by every deploy (see alchemy.run/state-store).
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const site = yield* Website;
    return { url: site.url };
  }),
);
