# ForceCamp

Gamified practice for the **Salesforce Certified Platform Administrator** exam (formerly ADM-201),
built on the blueprint effective December 15, 2025.

- **The Board** — Jeopardy-style, 8 exam domains × 4 difficulty tiers
- **Rapid Fire** — 90-second runs with a streak multiplier up to 3×
- **Mock Exam** — 60 questions, 105 minutes, weighted to the blueprint, scored against the real 65% pass mark, with a downloadable PDF report
- **Flashcards** — self-graded flip cards for pure-recall facts, optionally filtered by domain
- **Survival** — no clock, three lives, one wrong answer costs a life — accuracy over speed
- **Boss Rush** — pick a domain, face all four difficulty tiers back-to-back, clean sweep earns a bonus
- **Daily Challenge** — the same 10 questions for everyone each day, builds a day-over-day streak
- **Plinko** — answer right, drop the chip, and let the multiplier decide your bonus
- **Progress** — accuracy per domain, weakest-area targeting, mock history, and every miss with its explanation
- **Ranks** — the full XP ladder, lowest to highest, with your current position highlighted

152 scenario questions, each with an explanation covering why the distractors are wrong.
Answer order is randomized on every render, so you learn the material rather than the position.

Sign up to save your XP and progress to the cloud, or use **Continue as guest** to keep everything
local-only with no account at all.

## Run locally

This needs two things running at once: the Vite dev server, and Convex's dev sync process.

```bash
npm install
npx convex dev   # first run creates a free local Convex deployment — no login required for local dev
```

Leave `npx convex dev` running in its own terminal, then in another terminal:

```bash
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

If this is a fresh clone (no `convex/auth.ts` yet), also run `npx @convex-dev/auth` once to scaffold
auth — see `CLAUDE.md`'s **Accounts and persistence** section for what that sets up.

## Deploy — free options

The frontend is still a static single-page site, deployable to any of the hosts below for free.
Progress now has two paths: guest mode still uses the browser's `localStorage`; signed-in accounts
use a Convex backend (also free-tier). Each host below needs a Convex **production** deployment —
create one with `npx convex login` (one-time) — and a deploy key from the Convex dashboard
(**Settings → Deploy Keys**) added as that host's `CONVEX_DEPLOY_KEY` secret/env var. The build
commands already wrap `npx convex deploy --cmd "..."`, which pushes `convex/` to production and
injects `VITE_CONVEX_URL` into the frontend build automatically — you don't need to copy the URL
around by hand.

### Cloudflare Pages (recommended)

Best free tier of the three: unlimited bandwidth, no build-minute cap, fast global edge.

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Build command `npx convex deploy --cmd "npm run build"`, output directory `dist`.
4. Add `CONVEX_DEPLOY_KEY` under environment variables.
5. Deploy. You get `your-project.pages.dev`, with automatic rebuilds on every push.

### Netlify

`netlify.toml` is already configured with the `convex deploy --cmd` build command. Connect the repo
at app.netlify.com, add `CONVEX_DEPLOY_KEY` under Site settings → Environment variables, and it picks
up the rest automatically.

### GitHub Pages

`.github/workflows/deploy.yml` is ready to go. Add `CONVEX_DEPLOY_KEY` as a repo secret
(**Settings → Secrets and variables → Actions**), push to `main`, then in the repo go to
**Settings → Pages → Source → GitHub Actions**. The workflow sets Vite's `base` to your repo name
automatically, which is the step people usually miss when their Pages deploy renders a blank screen.

### Vercel

Import the repo at vercel.com/new. Override the build command to
`npx convex deploy --cmd "npm run build"` and add `CONVEX_DEPLOY_KEY` under environment variables.

## Install it on your phone

The site ships a web app manifest, so on any of the hosts above you can open it in mobile Safari or
Chrome and choose **Add to Home Screen**. It launches fullscreen with its own icon and no browser
chrome — close enough to a native app for daily drilling.

Sign in on both devices and progress follows your account. Staying in guest mode is still supported,
but guest progress is per-browser — laptop and phone are separate save files in that mode. See the
backlog in `CLAUDE.md` if you want a guest-mode export/import option instead of creating an account.

## Project layout

```
convex/                     schema, functions, and auth config for the Convex backend
index.html                  entry point, PWA meta tags
vite.config.js               base path handling for GitHub Pages
src/main.jsx                  React root, wraps the app in the Convex auth provider
src/styles.css                 the design system's CSS
src/App.jsx                    thin shell: auth gate, view switch, game-session state
src/data/                       question bank, domains, ranks
src/lib/                        pure logic, storage, Convex client, PDF export
src/hooks/                      useAuth, useProgress
src/components/                 Nav, auth UI, import prompt
src/views/                      one file per screen
public/                     manifest and icons
CLAUDE.md                   full project context — read this before making changes
```
