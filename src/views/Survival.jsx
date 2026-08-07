import React, { useState, useRef, useEffect } from "react";
import { ALLQ } from "../data/questions.js";
import { DOMAINS } from "../data/domains.js";
import { pick, orderFor, VALUE } from "../lib/scoring.js";
import Question from "./Question.jsx";

const START_LIVES = 3;

function pickWeighted(candidates) {
  const roll = Math.random() * 100; let acc = 0, target = DOMAINS[0].k;
  for (const d of DOMAINS) { acc += d.weight; if (roll <= acc) { target = d.k; break; } }
  const w = candidates.filter(x => x.d === target);
  return w.length ? w : candidates;
}

function drawQuestion(askedSet) {
  let candidates = ALLQ.filter(x => !askedSet.has(x.id));
  if (!candidates.length) { askedSet.clear(); candidates = ALLQ; }
  candidates = pickWeighted(candidates);
  const nq = pick(candidates);
  askedSet.add(nq.id);
  return nq;
}

/* Endless run, no timer — accuracy over speed, the opposite bet from Rapid Fire.
   Three lives; a wrong answer costs one. Correct answers score like the Board
   (tile value by difficulty). Ends when lives hit zero. */
export default function Survival({ onAnswer, onEnd, onHome }) {
  const asked = useRef(new Set());
  const [session, setSession] = useState(() => {
    const nq = drawQuestion(asked.current);
    return { q: nq, order: orderFor(nq) };
  });
  const [chosen, setChosen] = useState(null);
  const [gain, setGain] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [over, setOver] = useState(false);

  const answer = idx => {
    if (chosen !== null || over) return;
    const q = session.q;
    const ok = idx === q.c;
    setChosen(idx);
    const pts = ok ? VALUE(q.lvl) : 0;
    setGain(pts);
    const newScore = ok ? score + pts : score;
    if (ok) setScore(newScore);
    setCount(c => c + 1);
    onAnswer(q, ok, pts);
    if (!ok) {
      const nl = lives - 1;
      setLives(nl);
      if (nl <= 0) {
        setOver(true);
        onEnd(newScore);
      }
    }
  };

  const cont = () => {
    if (over) return;
    const nq = drawQuestion(asked.current);
    setSession({ q: nq, order: orderFor(nq) });
    setChosen(null); setGain(0);
  };

  const restart = () => {
    asked.current.clear();
    const nq = drawQuestion(asked.current);
    setSession({ q: nq, order: orderFor(nq) });
    setChosen(null); setGain(0);
    setLives(START_LIVES); setScore(0); setCount(0); setOver(false);
  };

  useEffect(() => {
    if (over) return;
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

  if (over) {
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Out of lives</div>
        <div className="disp" style={{ fontSize: "clamp(70px,18vw,150px)", color: "var(--gold)", marginBottom: 10 }}>
          {score.toLocaleString()}
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {count} question{count === 1 ? "" : "s"} survived.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={restart}>Run it again</button>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  const hearts = "♥".repeat(lives) + "♡".repeat(START_LIVES - lives);

  return (
    <Question
      q={session.q} order={session.order} chosen={chosen} onAnswer={answer} onNext={cont}
      gain={gain} clock={null} mode="survival" nextLabel="Next question"
      extra={<span className="chip" style={{ color: "var(--rose)" }} aria-label={`${lives} of ${START_LIVES} lives left`}>{hearts}</span>}
    />
  );
}
