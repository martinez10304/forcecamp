# CLAUDE.md

Project context for **ForceCamp** — a gamified study app for the Salesforce Certified Platform Administrator exam (formerly ADM-201).

---

## What this is

A study game, originally built single-user and now multi-account. The owner works in Salesforce day-to-day but is new to the admin side and is studying for the cert. They dislike conventional studying, so the product's job is to make repetition feel like play while still teaching the reasoning behind each answer. Friends/family studying the same exam can now sign up with their own account and get their own separate XP and progress — see **Accounts and persistence** below.

**The one thing that must never be compromised:** every question shows an explanation after the answer, and the explanation says *why the distractors are wrong*, not just why the answer is right. That is the actual learning mechanism. The game layer only exists to get the user to keep answering questions.

Eight modes:

- **The Board** — Jeopardy-style. 8 categories (the exam domains) × 4 difficulty tiers worth 100/200/300/400 points. Clear tiles.
- **Rapid Fire** — 90-second run. Correct answers build a streak that raises a score multiplier. A wrong answer resets the streak to zero.
- **Mock Exam** — the real thing: 60 questions, 105 minutes, blueprint-weighted, no explanations until submission. Results are downloadable as a PDF report.
- **Flashcards** — self-graded flip cards drawn from `lvl:1` (pure-recall) questions, optionally filtered by domain. No multiple choice — flip to reveal the answer and explanation, then mark yourself Got it or Missed it.
- **Survival** — no clock. Three lives; a wrong answer costs one. Blueprint-weighted questions across all levels, scored like Board tiles. Ends when lives hit zero — the accuracy-first counterpart to Rapid Fire's speed-first bet.
- **Boss Rush** — pick one domain, face its four difficulty tiers back-to-back in order. A clean 4/4 run earns a bonus on top of the normal per-tile XP.
- **Daily Challenge** — one 10-question set, the same for everyone on a given calendar date (seeded, not random). Completing it extends a day-over-day streak; already-done-today locks the mode until the next UTC day.
- **Plinko** — answer correctly and drop a chip through a peg board; where it lands sets a score multiplier (edges pay big, center is safe). 8 questions per run.

Progress is also visible on a dedicated **Ranks** page (the full XP ladder, lowest to highest) alongside the existing **Progress** page (per-domain accuracy, weakest area, misses list).

---

## Authoritative exam blueprint

Salesforce refreshed this exam **effective December 15, 2025**. Most study material online is still written for the old blueprint. Do not trust pre-2026 sources, and do not trust model training data on this — verify against `admin.salesforce.com` or the Trailhead exam guide.

What changed: the credential was renamed to **Salesforce Certified Platform Administrator**, a brand-new **Agentforce** section was added, Data & Analytics became the heaviest domain, and Configuration & Setup and Object Manager were each cut from 20% to 15%. Workflow Rules and Process Builder are retired — automation answers should be Flow-first.

| Key | Domain | Weight |
|---|---|---|
| `config` | Configuration and Setup | 15% |
| `object` | Object Manager and Lightning App Builder | 15% |
| `sales` | Sales and Marketing Applications | 10% |
| `service` | Service and Support Applications | 10% |
| `prod` | Productivity and Collaboration | 10% |
| `data` | Data and Analytics Management | 17% |
| `auto` | Automation | 15% |
| `agent` | Agentforce | 8% |

Exam format: 60 questions, 105 minutes, 65% to pass (39 correct). No coding — entirely declarative.

Rapid Fire draws questions weighted by these percentages. The board shows the weight on each category header so the user can see where to spend time.

---

## Question schema

Questions live in the question bank as plain objects. Adding questions is the highest-value contribution to this repo.

```js
{
  d:   "config",        // domain key from the table above
  lvl: 2,               // 1-4, maps to board tiles worth 100/200/300/400
  q:   "Scenario text ending in a question.",
  a:   ["opt", "opt", "opt", "opt"],   // exactly 4
  c:   0,               // index of correct answer
  e:   "Why the right answer is right AND why a tempting wrong one is wrong."
}
```

`id` is assigned automatically by array index at load. **Never reorder or delete existing entries** — misses are persisted by `id`, so reordering corrupts saved progress. Append new questions to the end of their domain block.

### Authoring rules

- **Scenario-first.** The real exam asks "a user needs X, what do you configure?" — not "define X." Write questions the same way.
- **Distractors must be plausible.** Every wrong option should be a real Salesforce feature that a confused admin would genuinely reach for. No joke answers, no obviously-wrong filler.
- **`c` may sit anywhere, and it doesn't matter.** Answer order is randomized at render time (`orderFor()`), so authored position is never a tell. Write `c` wherever it falls naturally.
- **Difficulty tiers:** `lvl 1` = recall a single fact. `lvl 2` = pick the right tool for a common scenario. `lvl 3` = distinguish two similar tools, or a multi-step scenario. `lvl 4` = edge cases, limits, prerequisites, and order-of-operations.
- **Explanations are 1–3 sentences.** Include the specific number when there is one (15 days, 20 fields, 500/day, 2 master-details).
- **Verify before adding.** Salesforce limits and behavior change every release. If unsure of a number, check Salesforce Help rather than guessing — a wrong explanation actively teaches the user something false, which is worse than not having the question.
- Keep at least 4 questions per domain per level so the board is replayable without repeats.

---

## Game mechanics

**XP and ranks.** Board tiles award their face value on a correct answer, zero on a miss. Ranks are named after Trailhead's progression as a nod to the subject: Scout (0) → Hiker (1,200) → Explorer (3,000) → Adventurer (6,000) → Mountaineer (10,000) → Ranger (16,000).

**Combo multiplier** (Rapid Fire only), based on current streak:

| Streak | Multiplier |
|---|---|
| 0–2 | 1× |
| 3–5 | 1.5× |
| 6–8 | 2× |
| 9–11 | 2.5× |
| 12+ | 3× |

Rapid Fire scoring: `100 × multiplier`, plus a 25-point bonus if answered in under 8 seconds. Wrong answers score nothing and reset the streak.

**The timer pauses while an explanation is on screen.** This is deliberate and should not be "fixed." The user must never feel penalized for reading the teaching content — the clock only measures thinking time.

**Adaptive targeting.** Once a domain has ≥3 answers recorded, the weakest domain by accuracy is identified. Rapid Fire pulls from that domain roughly 35% of the time; the other 65% follows the exam blueprint weighting.

**Mock Exam.** 60 questions drawn per `MOCK_PLAN`, which distributes the blueprint weights into whole questions: config 9, object 9, sales 6, service 6, prod 6, data 10, auto 9, agent 5. A 105-minute countdown runs continuously — no pausing, unlike Rapid Fire, because the point is to rehearse real time pressure. Questions can be revisited and flagged; the palette grid shows answered, flagged, and untouched at a glance. Nothing is revealed until submission, at which point the report gives the overall percentage against the 65% gate, a per-domain breakdown, and every miss with its explanation. Results fold into the normal stats and misses, award 50 XP per correct answer, and append to a rolling history of the last 10 attempts.

Submitting with blanks warns first, since there's no penalty for guessing on the real exam and leaving an answer empty is strictly worse than picking one.

**Misses list.** Wrong answers are pushed onto a capped list of 40 (60 after a mock) and displayed on the Progress screen with their explanations. Answering the same question correctly later removes it.

**Flashcard Drill.** Draws from `lvl:1` questions only (recall a single fact), shuffled per session, optionally filtered to one domain. Self-graded — "Got it" / "Missed it" — rather than picked from four options, so it feeds the same per-domain `stats` and the `misses` list as every other mode (for Progress-screen accuracy), but at a smaller XP trickle (5 XP per "Got it") since the grading is honor-system. Flashcards deliberately never touch the Board's `cleared` state — they're a separate practice loop, not a way to clear tiles.

**Ranks page.** A dedicated view listing the full `RANKS` ladder lowest to highest, with the current rank highlighted and a progress bar to the next threshold. `rankForXp(xp)` in `src/lib/scoring.js` is the single source of truth for "current rank" — `Nav`, `Stats`, and `Ranks` all call it rather than each computing their own.

**Mock Exam PDF export.** After submitting, a "Download PDF" button (`src/lib/pdf.js`, via `jspdf` + `jspdf-autotable`) generates a client-side report: score, pass/fail, per-domain breakdown, and every missed question with the chosen answer, correct answer, and explanation. Deliberately doesn't try to reproduce the on-screen design pixel-for-pixel (no custom web fonts embedded) — it's a report, not a screenshot.

**Survival.** Endless run, no timer, three lives (`src/views/Survival.jsx`). Questions are drawn blueprint-weighted across all domains/levels the same way Rapid Fire's `nextRapid` rolls — but Survival doesn't share that code, it has its own local `pickWeighted`/`drawQuestion`, since it needed its own `asked`-set/lives/score state anyway and duplicating ~15 lines was cheaper than threading a shared helper through both. Scores like the Board (tile value by difficulty). A wrong answer costs a life; at zero lives the run ends and `applySurvivalEnd` records a personal best (`state.bestSurvival`) — a separate field from Rapid Fire's `best`, not a shared one, since they're different scoring models and conflating them would make "best" ambiguous.

**Boss Rush.** Pick one domain (`src/views/Boss.jsx`), then face `lvl` 1→4 of that domain in a fixed sequence — one question per tier, no repeats to choose from. A clean 4/4 clear awards a flat `XP_BOSS_CLEAR_BONUS` (200) on top of each tile's normal XP, applied once via `applyBossBonus` when the gauntlet completes. Missing any tier forfeits only the bonus, not the XP already earned from the ones answered correctly.

**Daily Challenge.** `src/views/Daily.jsx` + `buildDaily`/`applyDailyComplete`/`dailyKeyFor` in `scoring.js`. The 10-question set is picked by a small seeded PRNG (`seededRng`, mulberry32-style) keyed on the UTC calendar date string, not `Math.random()` — that's what makes it identical for everyone who opens the app on the same date, the entire point of a "daily." Answer order within each question is still randomized normally (`orderFor`), since only *which* questions appear needs to match across users, not which position the correct answer lands in. Completing today's set is a one-shot: `state.lastDaily` locks the mode until `dailyKeyFor()` advances to a new date, and `applyDailyComplete` extends `state.dailyStreak` only if the previous completion was exactly yesterday (UTC), otherwise resets it to 1. This is the implementation of the "streak-per-day tracking" backlog item — see Backlog.

**The `extra`/`nextLabel` props on `Question.jsx`.** Survival, Boss Rush, Daily, and Plinko all reuse the shared `<Question>` component (same as Board and Rapid Fire) rather than re-implementing the answer-options-then-explanation UI a third, fourth, and fifth time. `extra` renders an additional chip in the question's meta row (lives hearts, tier progress, daily progress, running Plinko score) and `nextLabel` overrides the continue button's text (defaults to "Next question" for `mode="rapid"`, "Back to board" otherwise) — both optional, so Board and Rapid Fire's existing calls are untouched. If a future mode needs the same answer UI with different chrome, extend these props before reaching for a new component.

**Plinko.** A correct answer earns a drop, not immediate points — `src/views/Plinko.jsx` rolls a true random walk (`rollPath`, 8 coin flips) the moment the user continues past a correct answer, switches to a `dropping` phase, and renders `src/components/PlinkoBoard.jsx` to animate the chip through the precomputed path before landing on one of 9 multiplier slots (`MULTIPLIERS`, symmetric, edges pay 5x, center pays 0.75x — a real random walk naturally lands in the middle most often, so the payout table is shaped to match: rare edges are the jackpot). Points are `VALUE(q.lvl) * multiplier`, computed once inside `PlinkoBoard` and reported back via `onDone(pts)` so there's a single source of truth for the number both animated and actually awarded. Wrong answers skip the drop entirely and score nothing, same as every other mode. 8 questions (and up to 8 drops) per run; `applyPlinkoEnd` records a personal best (`state.bestPlinko`) the same way Survival does.

---

## Design system

The visual direction is a game-show board rendered in Salesforce's own brand world — deep navy with gold tile numerals — rather than generic neon-on-black. Keep it there.

```
--deep   #00112E   page background
--navy   #052F63
--tile   #0A3D80   board tile fill
--blue   #0176D3   Salesforce cloud blue, tile hover
--sky    #7CC2FF   borders, secondary text
--gold   #FFD35C   tile values, XP, primary CTA
--ember  #FE9339   combo meter, accents
--mint   #3BB273   correct
--rose   #FF5A6E   incorrect
--paper  #E8F0FA   body text
--dim    #7E9AC4   muted labels
```

Type: **Big Shoulders Display** (900) for headlines, tile values, and numerals — the condensed game-show face. **Space Grotesk** for body and UI. **Space Mono** for stats, labels, and eyebrows.

Each domain also carries its own `hue` used for the category underline and the progress bars.

**Signature element:** the charge rail beneath the header. On the board it shows progress to the next rank; in Rapid Fire it fills with the combo streak. It's the one piece of visual drama — keep everything else disciplined and resist adding more glow, gradients, or animation elsewhere.

Layout: mobile-first. Below 900px the board is a vertical list of categories each with a 4-across tile row; at 900px and up it becomes the classic 8-column game-show grid. Both are first-class — the user studies on phone and laptop equally.

---

## Stack and deployment

**React 18 + Vite 5 frontend, Convex backend.** The frontend still builds to static files (HTML, JS, icons) and deploys to any static host — that property was worth keeping. What changed is persistence: signed-in users' progress now lives in a Convex database (Postgres-like, reactive) behind Convex's built-in auth (`@convex-dev/auth`, email/password), instead of only `localStorage`. A **guest mode** ("Continue as guest" on the sign-in screen) preserves the original zero-account, local-only experience for anyone who doesn't want to sign up — see **Accounts and persistence** below for exactly how the two paths coexist.

```
convex/schema.ts             progress table (+ auth tables) and its by_user index
convex/progress.ts           get/save query+mutation — always scoped to the caller's own row
convex/auth.ts               @convex-dev/auth Password provider config
convex/auth.config.js        auth JWT/domain config (CLI-generated)
convex/http.js               auth HTTP routes (CLI-generated)

index.html                   entry, PWA meta tags
vite.config.js                base path handling (see GitHub Pages note below)
src/main.jsx                  React root, wraps the app in <ConvexAuthProvider>
src/styles.css                 the design system's CSS custom properties and rules
src/App.jsx                    thin shell: auth gate, view switch, all game-session state

src/data/questions.js          ALLQ — the question bank (order/ids must stay stable)
src/data/domains.js            DOMAINS, DMAP
src/data/ranks.js              RANKS

src/lib/storage.js             local KV — guest-mode store, and the local-progress import source
src/lib/convex.js              ConvexReactClient singleton
src/lib/scoring.js             all pure state-transform functions (applyAnswer, buildMock, rankForXp, ...)
src/lib/pdf.js                 mock-result PDF generation

src/hooks/useAuth.js           wraps @convex-dev/auth's hooks behind a stable {status, signIn, signOut} shape
src/hooks/useProgress.js       loads/saves the progress blob — Convex query+mutation when signed in, storage.js when guest

src/components/Nav.jsx         top bar: XP, rank, nav links, sign-in/out
src/components/AuthGate.jsx    full-screen sign-in/up panel + guest entry
src/components/AuthForm.jsx    the email/password form
src/components/ImportPrompt.jsx "import your local progress into this new account?" modal
src/components/PlinkoBoard.jsx the peg-board drop animation used by the Plinko view

src/views/*.jsx                one file per view: Home, Board, Question, RapidFire, RunOver, Mock, MockResult,
                                Stats, Ranks, Flashcards, Survival, Boss, Daily, Plinko

public/                      manifest.webmanifest, icons, _redirects
.github/workflows/deploy.yml GitHub Pages CI (now also runs `npx convex deploy`)
netlify.toml                 Netlify build + SPA fallback (now also runs `npx convex deploy`)
```

**Free hosting targets, all configured and ready:** Cloudflare Pages (recommended — unlimited bandwidth, no build-minute cap), Netlify, GitHub Pages, or Vercel, for the frontend. Convex's own free tier hosts the backend (auth + database) — a local, no-login Convex dev deployment is enough for local development; production needs a real Convex account and `npx convex deploy`. Deploy steps are in `README.md`.

**The GitHub Pages base-path gotcha.** Project sites serve from `/<repo-name>/`, not `/`. Vite's `base` therefore has to match or every asset 404s and the page renders blank. `vite.config.js` reads `VITE_BASE` and the workflow sets it from `$GITHUB_REPOSITORY` automatically. On Cloudflare, Netlify, and Vercel the default `/` is correct — don't set it there.

**Installable on mobile.** `manifest.webmanifest` plus the Apple meta tags mean Add to Home Screen gives a fullscreen app with its own icon. There is deliberately **no service worker** — a hand-rolled one causes stale-cache bugs that are miserable to debug, and the app is small enough to load fast anyway. If offline support becomes worth it, use `vite-plugin-pwa` rather than writing one by hand.

## Accounts and persistence

**Two persistence paths, one shape.** Both guest and signed-in progress use the exact same shape: `{ xp, cleared, stats, best, misses, answered, correct, mocks }`. Guest mode stores it via `src/lib/storage.js` (`window.storage` in a Claude artifact → `localStorage` on the web → an in-memory `Map` if both throw) under key `basecamp:v2`, exactly as before. Signed-in mode stores it in Convex's `progress` table, one row per user (`convex/schema.ts`), read via a reactive `useQuery` and written via a debounced `useMutation` (`src/hooks/useProgress.js`, 1.5s debounce, flushed on tab-hide/unload). `src/App.jsx` doesn't otherwise care which path it's on.

**Security model.** Every Convex function that touches `progress` derives the caller's identity server-side via `getAuthUserId(ctx)` and only ever reads/writes that user's own row (`convex/progress.ts`) — never accept a client-supplied user id. This is Convex's equivalent of Postgres row-level security, enforced in code rather than a policy, so it has to be re-applied in every function that touches user data, not just this one file.

**Adding a new field to the persisted shape is a three-file change, not one.** `DEFAULT_STATE` in `src/lib/scoring.js` is necessary but not sufficient — `convex/schema.ts`'s `progress` table and `convex/progress.ts`'s `save` mutation args both need the field too, or every signed-in save silently fails Convex's argument validation (the local write still looks fine since `useProgress` updates React state immediately; only the background Convex mutation errors, caught by a `.catch(console.error)` that's easy to miss without opening devtools). This bit us once, adding `bestSurvival`/`dailyStreak`/`lastDaily`/`bestPlinko` without updating the schema. New fields on the table should be `v.optional(...)` (not required) so existing rows created before the field existed don't fail schema validation — `progress.get` merges `{ ...DEFAULTS, ...row }` before returning, which is what backfills the gap for old rows without a migration.

**`useProgress`'s one-time adoption rule.** Convex's `useQuery` re-fires reactively, including once to echo back the app's own debounced saves. The hook adopts the remote row into local state exactly once per sign-in (guarded by a ref), then treats local state as the source of truth for the rest of the session — only the save direction (local → Convex) stays live. Removing that guard reintroduces a real bug: a fast local edit gets silently clobbered by an in-flight read that predates it. Don't remove it without re-testing the "answer several questions quickly, then reload" case.

**Import on first sign-in.** If a user signs in and Convex has no row for them yet (fresh account) while this browser has non-trivial `localStorage` progress, `ImportPrompt` offers to import it. Import copies the local blob into `state` (which then saves to Convex normally); discard removes the local key. Either branch makes the offer condition false afterward, so it only ever fires once per browser/account pairing — don't add a separate "seen this" flag, it isn't needed.

**Consequence worth knowing:** guest progress is still per-browser and per-device — that's the tradeoff for not requiring an account. Signing in is what makes progress durable and cross-device. An export/import-as-JSON button for guest mode is still in the backlog for anyone who wants durability without an account.

**Manual setup this all depends on:** a Convex account/project (`npx convex dev` for local dev — no login needed for a local dev deployment; `npx convex login` + `npx convex deploy` for production), and `@convex-dev/auth`'s setup wizard (`npx @convex-dev/auth`) having been run once to scaffold `convex/auth.ts`/`convex/auth.config.js`/`convex/http.js` and configure the auth JWT keys. Neither step is something an agent can complete unattended — both need a human at the Convex CLI. `.env.local` (gitignored) holds `VITE_CONVEX_URL`; production deploys need the same variable (or `--cmd` per below) supplied by each host.

**Accessibility floor** — must hold for any change: keyboard answering with keys 1–4 and Enter to continue, visible focus rings on every interactive element, `aria-label` on board tiles describing category and value, and `prefers-reduced-motion` honored. Flashcards extends the keyboard model with Space/Enter to flip and →/G, ←/M to grade — pick keys that don't collide with the 1–4 answer scheme used everywhere else.

**Styling** is a single CSS file (`src/styles.css`, originally an injected `<style>` string, extracted verbatim) rather than Tailwind, because the design needs custom properties and arbitrary values that Tailwind's artifact build can't compile.

---

## Backlog

Roughly in value order:

1. **Grow the bank toward ~300.** Every domain-tier cell now holds at least 4 questions (152 total across three batches), so nothing repeats immediately — but more depth is still the highest-value contribution. Append as a new batch array; never insert into an existing one.
2. **Spaced repetition** — resurface missed questions after 1 day, 3 days, 7 days rather than only on demand.
3. **Export/import progress as JSON** for guest mode, so a phone and laptop save file can be reconciled without creating an account.
4. Explanation deep links to the relevant Salesforce Help or Trailhead module.
5. Password reset flow for signed-in accounts (Convex Auth supports it; not yet wired up in `AuthForm.jsx`).

Done: streak-per-day tracking (Daily Challenge) and a fourth+ game mode, both formerly on this list.

## Non-goals

- **No scraped or braindumped questions, from Quizlet or anywhere else.** Everything is written from the published objectives. This is three lines at once: other people's study sets are their copyrighted work, redistributing real exam items violates the Trailhead Credential Agreement and is grounds for revoking the certification, and memorized answers don't survive a question refresh or teach any transferable reasoning. If a contributor proposes importing an existing set, the answer is to write original questions covering the same objectives instead.
- No leaderboards or social features. The competition is with the 65% pass mark, not other users — accounts exist so each person's own progress is durable and private, not so people can compare scores.
