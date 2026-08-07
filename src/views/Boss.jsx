import React, { useState, useEffect } from "react";
import { DOMAINS } from "../data/domains.js";
import { pool, pick, orderFor, VALUE, XP_BOSS_CLEAR_BONUS } from "../lib/scoring.js";
import Question from "./Question.jsx";

function drawTier(domainKey, lvl) {
  const nq = pick(pool(domainKey, lvl));
  return { q: nq, order: orderFor(nq) };
}

/* Pick a domain, face all four difficulty tiers back-to-back, in order. A clean
   4/4 run earns a bonus on top of the normal per-tile XP each answer already awards. */
export default function Boss({ onAnswer, onBonus, onHome }) {
  const [domain, setDomain] = useState(null);
  const [tierIndex, setTierIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [gain, setGain] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const start = dk => {
    setDomain(dk);
    setTierIndex(0);
    setCorrectCount(0);
    setDone(false);
    setSession(drawTier(dk, 1));
    setChosen(null); setGain(0);
  };

  const answer = idx => {
    if (chosen !== null || !session) return;
    const q = session.q;
    const ok = idx === q.c;
    setChosen(idx);
    const pts = ok ? VALUE(q.lvl) : 0;
    setGain(pts);
    if (ok) setCorrectCount(c => c + 1);
    onAnswer(q, ok, pts);
  };

  const cont = () => {
    if (!session) return;
    const nextTier = tierIndex + 1;
    if (nextTier >= 4) {
      setDone(true);
      if (correctCount === 4) onBonus();
      return;
    }
    setTierIndex(nextTier);
    setSession(drawTier(domain, nextTier + 1));
    setChosen(null); setGain(0);
  };

  useEffect(() => {
    if (!session || done) return;
    const h = e => {
      if (chosen === null) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) answer(session.order[n - 1]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cont();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!domain) {
    return (
      <section>
        <div className="sechead">
          <h2>Boss Rush</h2>
          <p>Pick a domain — face all four difficulty tiers back-to-back, in order.</p>
        </div>
        <div className="modes">
          {DOMAINS.map((d, i) => (
            <button key={d.k} className="mode" onClick={() => start(d.k)} style={{ borderColor: d.hue + "55" }}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{d.short}</h3>
              <p>{d.weight}% of the exam &middot; 4 tiers, 100 to 400 points</p>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (done) {
    const clean = correctCount === 4;
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>{clean ? "Clean clear" : "Gauntlet complete"}</div>
        <div className="disp" style={{ fontSize: "clamp(70px,18vw,150px)", color: "var(--gold)", marginBottom: 10 }}>
          {correctCount}/4
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {clean ? `Perfect run — bonus +${XP_BOSS_CLEAR_BONUS.toLocaleString()} XP.` : "Missed one or more — no clean-clear bonus this time."}
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => start(domain)}>Run it back</button>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  return (
    <Question
      q={session.q} order={session.order} chosen={chosen} onAnswer={answer} onNext={cont}
      gain={gain} clock={null} mode="boss" nextLabel={tierIndex === 3 ? "See results" : "Next tier"}
      extra={<span className="chip">Tier {tierIndex + 1}/4</span>}
    />
  );
}
