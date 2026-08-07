import React, { useState, useEffect, useMemo } from "react";
import { buildDaily, dailyKeyFor, VALUE } from "../lib/scoring.js";
import Question from "./Question.jsx";

/* One seeded 10-question set, identical for everyone who opens the app on the same
   calendar date (buildDaily is deterministic per date, not Math.random). Completing
   it once a day extends a streak; it's locked once done until the next UTC day. */
export default function Daily({ p, onAnswer, onComplete, onHome }) {
  const todayKey = useMemo(() => dailyKeyFor(), []);
  const alreadyDone = p.lastDaily === todayKey;

  const [daily] = useState(() => buildDaily(todayKey));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [gain, setGain] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = daily.qs[index];
  const order = q ? daily.order[q.id] : null;

  const answer = idx => {
    if (chosen !== null || alreadyDone || finished || !q) return;
    const ok = idx === q.c;
    setChosen(idx);
    const pts = ok ? VALUE(q.lvl) : 0;
    setGain(pts);
    if (ok) setCorrectCount(c => c + 1);
    onAnswer(q, ok, pts);
  };

  const cont = () => {
    if (index + 1 >= daily.qs.length) {
      setFinished(true);
      onComplete(todayKey);
      return;
    }
    setIndex(i => i + 1);
    setChosen(null); setGain(0);
  };

  useEffect(() => {
    if (alreadyDone || finished || !q) return;
    const h = e => {
      if (chosen === null) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) answer(order[n - 1]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cont();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (alreadyDone && !finished) {
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Come back tomorrow</div>
        <div className="disp" style={{ fontSize: "clamp(56px,14vw,110px)", color: "var(--gold)", marginBottom: 10 }}>
          {p.dailyStreak || 0}
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {(p.dailyStreak || 0) === 1 ? "1 day" : `${p.dailyStreak || 0} days`} in a row. You've already done today's 10 —
          a fresh set unlocks after midnight UTC.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Streak extended</div>
        <div className="disp" style={{ fontSize: "clamp(70px,18vw,150px)", color: "var(--gold)", marginBottom: 10 }}>
          {correctCount}/{daily.qs.length}
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {(p.dailyStreak || 0) === 1 ? "1 day" : `${p.dailyStreak || 0} days`} and counting. Come back tomorrow for a new set.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  return (
    <Question
      q={q} order={order} chosen={chosen} onAnswer={answer} onNext={cont}
      gain={gain} clock={null} mode="daily" nextLabel={index + 1 >= daily.qs.length ? "Finish" : "Next question"}
      extra={<span className="chip">{index + 1}/{daily.qs.length}</span>}
    />
  );
}
