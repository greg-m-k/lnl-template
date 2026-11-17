# Running "Sequential vs Parallel Requests" live

About 20 minutes. The running site is the deck: no slides.

## Before the session

Open `/requests/race/` and press **Run both** once, so the Worker is warm. If the site is down, run `npm run dev` on your
laptop and present from `http://localhost:8800`.

## Opening (3 min)

Say: "A page needs three answers that don't depend on each other. How does your code ask for them?"
Show of hands: one after another, all at once, or "I don't know". Write the split down.

## Start here (4 min)

Walk through the two diagrams. Ask someone to define "request waterfall" in their own words before you do.

## Three calls, two ways (10 min)

1. **Predict.** All three sliders at 300ms. "Sequential total? Parallel total?" Take two or three answers.
   Press **Run both**. Expect sequential around 900–1000ms and parallel around 300–350ms.
   Ask: "Where did the extra time in parallel come from, above 300ms?" (network and Worker overhead).
2. **Predict.** Recommendations to 1200ms. "What happens to each total?" Run. Sequential grows by 900ms; parallel becomes
   about 1200ms. Ask: "Which call should you optimise first in each pattern?"
3. **Predict.** Switch on **Make orders fail**. "Who still shows the recommendations?" Run. The sequential timeline shows
   recommendations "not asked"; parallel got them. Ask: "Is stopping early ever what you want?" (yes: when later calls are
   pointless or costly without the earlier answer).

Land it: "Independent calls go in parallel. Dependent calls can't, and that waterfall is the shape of the data."

## Hand it over (3 min)

Everyone opens the page on their own phone or laptop. Challenge: find slider settings where sequential is within 10% of
parallel. (One slow call and two fast ones.) What does that say about when parallelising is worth it?

## Closing

Back to the opening show of hands. What would people change in their own code this week?

## When things misbehave

- First run is slow: a cold Worker. Run again and point out the difference; ask what "cold start" means.
- Numbers wobble between runs: venue network. Run three times and ask the room which number to trust.
- A switch left on from the last segment: the button shows ✕. Press it again.

## Make your own

Invite people to build a topic for a question their own team argues about: AGENTS.md, "Adding a topic".
