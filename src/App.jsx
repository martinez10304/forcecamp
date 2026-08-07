import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ALLQ } from "./data/questions.js";
import { DOMAINS } from "./data/domains.js";
import { RANKS } from "./data/ranks.js";
import {
  pool, pick, orderFor, buildMock, scoreMock, applyMockSubmit,
  applyAnswer, applyFlashcardResult, applySurvivalEnd, applyBossBonus, applyDailyComplete, applyPlinkoEnd,
  rankForXp, multOf, VALUE,
} from "./lib/scoring.js";
import { useAuth } from "./hooks/useAuth.js";
import { useProgress } from "./hooks/useProgress.js";

import Nav from "./components/Nav.jsx";
import AuthGate from "./components/AuthGate.jsx";
import ImportPrompt from "./components/ImportPrompt.jsx";
import Home from "./views/Home.jsx";
import Board from "./views/Board.jsx";
import Question from "./views/Question.jsx";
import RapidFire from "./views/RapidFire.jsx";
import MockExam from "./views/Mock.jsx";
import MockResult from "./views/MockResult.jsx";
import Stats from "./views/Stats.jsx";
import Ranks from "./views/Ranks.jsx";
import Flashcards from "./views/Flashcards.jsx";
import Survival from "./views/Survival.jsx";
import Boss from "./views/Boss.jsx";
import Daily from "./views/Daily.jsx";
import Plinko from "./views/Plinko.jsx";

/* ============================================================
   FORCECAMP — Salesforce Certified Platform Administrator
   Exam blueprint effective Dec 15, 2025
   ============================================================ */

export default function ForceCamp() {
  const { status: authStatus, signOut } = useAuth();
  const [guest, setGuest] = useState(false);
  const { state: p, setState: setP, importOffer, resolveImport } = useProgress(guest ? "guest" : authStatus);

  const [view, setView] = useState("home");

  // active question
  const [q, setQ] = useState(null);
  const [qOrder, setQOrder] = useState([0, 1, 2, 3]);
  const [mock, setMock] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [tileKey, setTileKey] = useState(null);
  const [gain, setGain] = useState(0);

  // rapid run
  const [streak, setStreak] = useState(0);
  const [runScore, setRunScore] = useState(0);
  const [clock, setClock] = useState(90);
  const [running, setRunning] = useState(false);
  const [runOver, setRunOver] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const asked = useRef(new Set());
  const started = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setClock(c => {
      if (c <= 1) { setRunning(false); setRunOver(true); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running]);

  const record = useCallback((qq, ok, pts) => {
    setP(prev => applyAnswer(prev, qq, ok, pts));
  }, []);

  const gradeFlashcard = useCallback((qq, gotIt) => {
    setP(prev => applyFlashcardResult(prev, qq, gotIt));
  }, []);

  const endSurvival = useCallback(score => {
    setP(prev => applySurvivalEnd(prev, score));
  }, []);

  const awardBossBonus = useCallback(() => {
    setP(prev => applyBossBonus(prev));
  }, []);

  const completeDaily = useCallback(dateKey => {
    setP(prev => applyDailyComplete(prev, dateKey));
  }, []);

  const endPlinko = useCallback(score => {
    setP(prev => applyPlinkoEnd(prev, score));
  }, []);

  const weakest = useMemo(() => {
    const scored = DOMAINS.map(d => {
      const s = p.stats[d.k] || { r: 0, w: 0 };
      const n = s.r + s.w;
      return { d, n, acc: n ? s.r / n : null };
    }).filter(x => x.n >= 3);
    if (!scored.length) return null;
    return scored.sort((a, b) => a.acc - b.acc)[0];
  }, [p.stats]);

  /* ---------- board ---------- */
  const openTile = (dk, lvl) => {
    const key = dk + ":" + lvl;
    if (p.cleared[key]) return;
    const pl = pool(dk, lvl);
    if (!pl.length) return;
    const nq = pick(pl);
    setQ(nq); setQOrder(orderFor(nq)); setChosen(null); setTileKey(key); setGain(0);
    started.current = Date.now();
    setView("q");
  };

  /* ---------- rapid ---------- */
  const nextRapid = useCallback(() => {
    let candidates = ALLQ.filter(x => !asked.current.has(x.id));
    if (!candidates.length) { asked.current.clear(); candidates = ALLQ; }
    // 35% of the time, target the weakest domain the user has data on
    if (weakest && Math.random() < 0.35) {
      const w = candidates.filter(x => x.d === weakest.d.k);
      if (w.length) candidates = w;
    } else {
      // otherwise weight by exam blueprint
      const roll = Math.random() * 100; let acc = 0, target = DOMAINS[0].k;
      for (const d of DOMAINS) { acc += d.weight; if (roll <= acc) { target = d.k; break; } }
      const w = candidates.filter(x => x.d === target);
      if (w.length) candidates = w;
    }
    const nq = pick(candidates);
    asked.current.add(nq.id);
    setQ(nq); setQOrder(orderFor(nq)); setChosen(null); setGain(0);
    started.current = Date.now();
  }, [weakest]);

  const startRun = () => {
    asked.current.clear();
    setStreak(0); setRunScore(0); setRunCount(0); setClock(90); setRunOver(false);
    nextRapid(); setRunning(true); setView("rapid");
  };

  const answer = idx => {
    if (chosen !== null || !q) return;
    const ok = idx === q.c;
    setChosen(idx);
    const secs = (Date.now() - started.current) / 1000;

    if (view === "rapid") {
      setRunning(false);
      const s = ok ? streak + 1 : 0;
      const mult = multOf(ok ? streak : 0);
      const pts = ok ? Math.round(100 * mult) + (secs < 8 ? 25 : 0) : 0;
      setStreak(s); setRunScore(v => v + pts); setRunCount(c => c + 1); setGain(pts);
      record(q, ok, pts);
    } else {
      const pts = ok ? VALUE(q.lvl) : 0;
      setGain(pts);
      record(q, ok, pts);
      setP(prev => ({ ...prev, cleared: { ...prev.cleared, [tileKey]: ok ? "hit" : "miss" } }));
    }
  };

  const cont = () => {
    if (view === "rapid") {
      if (clock <= 0) { setRunOver(true); return; }
      nextRapid(); setRunning(true);
    } else { setQ(null); setView("board"); }
  };

  useEffect(() => {
    const h = e => {
      if (view !== "q" && view !== "rapid") return;
      if (mock && !mock.done) return;
      if (runOver) return;
      if (chosen === null && q) { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) answer(qOrder[n - 1]); }
      else if (chosen !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); cont(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  useEffect(() => {
    if (runOver) setP(prev => ({ ...prev, best: Math.max(prev.best || 0, runScore) }));
  }, [runOver]);

  /* ---------- mock exam ---------- */
  const startMock = () => { setMock(buildMock()); setQ(null); setRunning(false); setView("mock"); };

  const submitMock = useCallback(() => {
    if (!mock || mock.done) return;
    const scored = scoreMock(mock);
    setMock(m => ({ ...m, done: true, result: { correct: scored.correct, by: scored.by, at: Date.now() } }));
    setP(prev => applyMockSubmit(prev, mock, scored));
  }, [mock]);

  const inMock = view === "mock" && mock && !mock.done;

  useEffect(() => {
    if (!inMock) return;
    const t = setInterval(() => setMock(m => (!m || m.done ? m : { ...m, left: Math.max(0, m.left - 1) })), 1000);
    return () => clearInterval(t);
  }, [inMock]);

  useEffect(() => { if (mock && !mock.done && mock.left === 0) submitMock(); }, [mock, submitMock]);

  useEffect(() => {
    if (!inMock) return;
    const h = e => {
      const cur = mock.qs[mock.i];
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) setMock(m => ({ ...m, ans: { ...m.ans, [cur.id]: m.order[cur.id][n - 1] } }));
      else if (e.key === "ArrowRight") setMock(m => ({ ...m, i: Math.min(m.qs.length - 1, m.i + 1) }));
      else if (e.key === "ArrowLeft") setMock(m => ({ ...m, i: Math.max(0, m.i - 1) }));
      else if (e.key.toLowerCase() === "f") setMock(m => ({ ...m, flag: { ...m.flag, [cur.id]: !m.flag[cur.id] } }));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [inMock, mock]);

  const rank = rankForXp(p.xp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const railPct = view === "mock" && mock && !mock.done
    ? (Object.keys(mock.ans).length / mock.qs.length) * 100
    : view === "rapid"
    ? Math.min(100, (streak / 12) * 100)
    : nextRank ? ((p.xp - rank.at) / (nextRank.at - rank.at)) * 100 : 100;

  const go = v => { setQ(null); setRunning(false); setView(v); };

  if (authStatus === "loading") {
    return <div className="bc" />;
  }
  if (authStatus === "signedOut" && !guest) {
    return <AuthGate onGuest={() => setGuest(true)} />;
  }

  return (
    <div className="bc">
      {importOffer && (
        <ImportPrompt
          local={importOffer.local}
          onImport={() => resolveImport("import")}
          onDiscard={() => resolveImport("discard")}
        />
      )}
      <Nav
        view={view} go={go} startRun={startRun} startMock={startMock}
        inMock={inMock} mock={mock}
        runOver={runOver} streak={streak} runScore={runScore}
        p={p} rank={rank} railPct={railPct}
        auth={{
          status: guest ? "guest" : "signedIn",
          onSignOut: signOut,
          onGoAuth: () => setGuest(false),
        }}
      />

      <div className="wrap">
        {view === "home" && (
          <Home
            p={p} rank={rank} nextRank={nextRank} weakest={weakest}
            onBoard={() => go("board")} onRapid={startRun} onStats={() => go("stats")} onMock={startMock}
            onFlash={() => go("flash")} onSurvival={() => go("survival")} onBoss={() => go("boss")} onDaily={() => go("daily")}
            onPlinko={() => go("plinko")}
          />
        )}
        {view === "board" && <Board p={p} onTile={openTile} onReset={() => setP(prev => ({ ...prev, cleared: {} }))} />}
        {view === "q" && q && (
          <Question q={q} order={qOrder} chosen={chosen} onAnswer={answer} onNext={cont} gain={gain} clock={null} mode="q" />
        )}
        {view === "rapid" && (
          <RapidFire
            q={q} order={qOrder} chosen={chosen} onAnswer={answer} onNext={cont} gain={gain} clock={clock}
            runOver={runOver} runScore={runScore} runCount={runCount} best={p.best}
            onAgain={startRun} onHome={() => go("home")}
          />
        )}
        {view === "mock" && mock && !mock.done && <MockExam mock={mock} setMock={setMock} onSubmit={submitMock} />}
        {view === "mock" && mock && mock.done && <MockResult mock={mock} onAgain={startMock} onHome={() => { setMock(null); go("home"); }} />}
        {view === "flash" && <Flashcards onGrade={gradeFlashcard} onHome={() => go("home")} />}
        {view === "survival" && <Survival onAnswer={record} onEnd={endSurvival} onHome={() => go("home")} />}
        {view === "boss" && <Boss onAnswer={record} onBonus={awardBossBonus} onHome={() => go("home")} />}
        {view === "daily" && <Daily p={p} onAnswer={record} onComplete={completeDaily} onHome={() => go("home")} />}
        {view === "plinko" && <Plinko onAnswer={record} onEnd={endPlinko} onHome={() => go("home")} />}
        {view === "stats" && <Stats p={p} weakest={weakest} onRapid={startRun} onMock={startMock} onRanks={() => go("ranks")} />}
        {view === "ranks" && <Ranks xp={p.xp} />}

        <div className="foot">
          Built on the Salesforce Certified Platform Administrator blueprint effective December&nbsp;15,&nbsp;2025 &mdash; 60 questions, 105 minutes, 65% to pass.
          Domain weights shown on the board are the official ones. {ALLQ.length} questions in the bank.
        </div>
      </div>
    </div>
  );
}
