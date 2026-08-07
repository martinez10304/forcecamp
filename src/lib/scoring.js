import { ALLQ } from "../data/questions.js";
import { DOMAINS } from "../data/domains.js";
import { RANKS } from "../data/ranks.js";

export const LEVELS = [1, 2, 3, 4];
export const VALUE = l => l * 100;

export const MISS_CAP = 40;
export const MOCK_MISS_CAP = 60;
export const XP_FLASHCARD_HIT = 5;

export const pool = (d, l) => ALLQ.filter(q => q.d === d && q.lvl === l);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* Fisher-Yates. Used to randomize answer order so screen position never becomes a tell. */
export const shuffleArr = a => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
export const orderFor = q => shuffleArr(q.a.map((_, i) => i));

/* Mock exam: 60 questions distributed by the official blueprint weights. */
export const MOCK_PLAN = { config: 9, object: 9, sales: 6, service: 6, prod: 6, data: 10, auto: 9, agent: 5 };
export const MOCK_SECONDS = 105 * 60;
export const PASS_MARK = 0.65;
export const MOCK_LEN = Object.values(MOCK_PLAN).reduce((a, b) => a + b, 0);

export function buildMock() {
  const qs = [];
  for (const d of DOMAINS) qs.push(...shuffleArr(ALLQ.filter(x => x.d === d.k)).slice(0, MOCK_PLAN[d.k]));
  const picked = shuffleArr(qs);
  return {
    qs: picked,
    order: Object.fromEntries(picked.map(x => [x.id, orderFor(x)])),
    ans: {}, flag: {}, i: 0, left: MOCK_SECONDS, done: false,
  };
}
export const clockStr = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const DEFAULT_STATE = {
  xp: 0, cleared: {}, stats: {}, best: 0, misses: [], answered: 0, correct: 0, mocks: [],
  bestSurvival: 0, dailyStreak: 0, lastDaily: null, bestPlinko: 0,
};

export const rankForXp = xp => [...RANKS].reverse().find(r => xp >= r.at) || RANKS[0];
export const multOf = s => (s >= 12 ? 3 : s >= 9 ? 2.5 : s >= 6 ? 2 : s >= 3 ? 1.5 : 1);

/* Applies one multiple-choice answer (Board or Rapid Fire) to the persisted state. Pure — returns a new state. */
export function applyAnswer(prev, qq, ok, pts) {
  const st = { ...prev.stats };
  const cur = st[qq.d] || { r: 0, w: 0 };
  st[qq.d] = { r: cur.r + (ok ? 1 : 0), w: cur.w + (ok ? 0 : 1) };
  const misses = ok
    ? prev.misses.filter(m => m !== qq.id)
    : [qq.id, ...prev.misses.filter(m => m !== qq.id)].slice(0, MISS_CAP);
  return { ...prev, xp: prev.xp + pts, stats: st, misses, answered: prev.answered + 1, correct: prev.correct + (ok ? 1 : 0) };
}

/* Applies self-graded flashcard feedback. Feeds the same stats/misses tracking as MC
   answers so Progress stays accurate, but never touches `cleared` — flashcards aren't
   part of the Board's tile progression. XP is a small trickle since grading is honor-system. */
export function applyFlashcardResult(prev, qq, gotIt) {
  const st = { ...prev.stats };
  const cur = st[qq.d] || { r: 0, w: 0 };
  st[qq.d] = { r: cur.r + (gotIt ? 1 : 0), w: cur.w + (gotIt ? 0 : 1) };
  const misses = gotIt
    ? prev.misses.filter(m => m !== qq.id)
    : prev.misses.includes(qq.id) ? prev.misses : [qq.id, ...prev.misses].slice(0, MISS_CAP);
  return {
    ...prev, stats: st, misses,
    answered: prev.answered + 1,
    correct: prev.correct + (gotIt ? 1 : 0),
    xp: prev.xp + (gotIt ? XP_FLASHCARD_HIT : 0),
  };
}

/* Scores a completed mock exam against its answer key. Pure, depends only on `mock` —
   call once and reuse the result for both the mock's `result` and the state update below,
   rather than computing it inside a setP() updater (which StrictMode can double-invoke). */
export function scoreMock(mock) {
  let correct = 0; const by = {}; const missed = [];
  mock.qs.forEach(qq => {
    const ok = mock.ans[qq.id] === qq.c;
    if (ok) correct++; else missed.push(qq.id);
    const b = by[qq.d] || (by[qq.d] = { r: 0, n: 0 });
    b.n++; if (ok) b.r++;
  });
  return { correct, by, missed };
}

/* Folds a scored mock exam into the persisted state. Pure — returns a new state. */
export function applyMockSubmit(prev, mock, scored) {
  const { correct, missed } = scored;
  const st = { ...prev.stats };
  mock.qs.forEach(qq => {
    const ok = mock.ans[qq.id] === qq.c;
    const c = st[qq.d] || { r: 0, w: 0 };
    st[qq.d] = { r: c.r + (ok ? 1 : 0), w: c.w + (ok ? 0 : 1) };
  });
  const right = mock.qs.filter(qq => mock.ans[qq.id] === qq.c).map(qq => qq.id);
  const misses = [...missed, ...prev.misses.filter(x => !missed.includes(x) && !right.includes(x))].slice(0, MOCK_MISS_CAP);

  return {
    ...prev, stats: st, misses,
    answered: prev.answered + mock.qs.length,
    correct: prev.correct + correct,
    xp: prev.xp + correct * 50,
    mocks: [{ at: Date.now(), correct, total: mock.qs.length }, ...(prev.mocks || [])].slice(0, 10),
  };
}

/* ---------------- Survival ---------------- */

/* Called once when a Survival run ends (lives hit 0). Records the personal best;
   per-question scoring during the run itself goes through applyAnswer, same as Board. */
export function applySurvivalEnd(prev, score) {
  return { ...prev, bestSurvival: Math.max(prev.bestSurvival || 0, score) };
}

/* ---------------- Plinko ---------------- */

/* Called once when a Plinko run ends (all drops used). Records the personal best;
   per-question scoring during the run goes through applyAnswer, same as Board,
   with the drop's landed multiplier already folded into the points passed in. */
export function applyPlinkoEnd(prev, score) {
  return { ...prev, bestPlinko: Math.max(prev.bestPlinko || 0, score) };
}

/* ---------------- Boss Rush ---------------- */

export const XP_BOSS_CLEAR_BONUS = 200;

/* Awarded once for clearing all 4 tiers of a domain gauntlet without a miss.
   Per-question scoring during the gauntlet goes through applyAnswer, same as Board. */
export function applyBossBonus(prev) {
  return { ...prev, xp: prev.xp + XP_BOSS_CLEAR_BONUS };
}

/* ---------------- Daily Challenge ---------------- */

export const DAILY_LEN = 10;

/* Small deterministic PRNG (mulberry32-style) seeded from a string, so the same seed
   always produces the same sequence — unlike Math.random(). This is what makes the
   daily set identical for everyone who opens the app on a given calendar date. */
function seededRng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/* UTC-based so "today" doesn't shift mid-evening depending on the viewer's timezone
   relative to whoever else is looking at the same date key. */
export const dailyKeyFor = (date = new Date()) => date.toISOString().slice(0, 10);

/* 10 questions, blueprint-weighted by domain, deterministic per date. Answer order
   (orderFor) is intentionally still randomized per viewer — only which questions
   appear needs to match, not which position the correct answer lands in. */
export function buildDaily(dateKey) {
  const rng = seededRng("forcecamp-daily-" + dateKey);
  const used = new Set();
  const qs = [];
  let guard = 0;
  while (qs.length < DAILY_LEN && guard++ < 2000) {
    const roll = rng() * 100; let acc = 0, target = DOMAINS[0].k;
    for (const d of DOMAINS) { acc += d.weight; if (roll <= acc) { target = d.k; break; } }
    const lvl = Math.floor(rng() * 4) + 1;
    const pl = pool(target, lvl);
    if (!pl.length) continue;
    const nq = pl[Math.floor(rng() * pl.length)];
    if (used.has(nq.id)) continue;
    used.add(nq.id);
    qs.push(nq);
  }
  return {
    date: dateKey, qs,
    order: Object.fromEntries(qs.map(x => [x.id, orderFor(x)])),
    ans: {}, i: 0, done: false,
  };
}

/* Bumps the day-streak counter once, when a daily set is completed. Extends the streak
   if yesterday was the last completed day, otherwise resets to 1. Doesn't touch
   xp/stats — pair with applyAnswer for each question as the user answers it. */
export function applyDailyComplete(prev, dateKey) {
  const d = new Date(dateKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  const yesterdayKey = d.toISOString().slice(0, 10);
  const streak = prev.lastDaily === yesterdayKey ? (prev.dailyStreak || 0) + 1 : 1;
  return { ...prev, dailyStreak: streak, lastDaily: dateKey };
}
