import React, { useState, useRef, useEffect } from "react";
import { ALLQ } from "../data/questions.js";
import { DOMAINS } from "../data/domains.js";
import { pick, orderFor, VALUE } from "../lib/scoring.js";
import Question from "./Question.jsx";
import PlinkoBoard from "../components/PlinkoBoard.jsx";

const RUN_LEN = 8;
const ROWS = 8;
/* Symmetric payout table, ROWS+1 = 9 slots. Center is the most probable landing spot
   (true random walk, like a physical Plinko board) and pays the least; edges are rare
   jackpots. Never below 1x's neighbor by much and never punishing — a correct answer
   always earns something, the drop just decides how much extra. */
const MULTIPLIERS = [5, 2, 1.5, 1, 0.75, 1, 1.5, 2, 5];

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

/* Random walk of ROWS coin flips, exactly like a physical Plinko board — the sum
   naturally lands near the center most often (binomial distribution), rarely at the
   edges. `steps` is the chip's position after each row, for the drop animation. */
function rollPath() {
  let pos = 0;
  const steps = [0];
  for (let i = 0; i < ROWS; i++) {
    pos += Math.random() < 0.5 ? -1 : 1;
    steps.push(pos);
  }
  const slot = (pos + ROWS) / 2;
  return { steps, slot };
}

export default function Plinko({ onAnswer, onEnd, onHome }) {
  const asked = useRef(new Set());
  const [session, setSession] = useState(() => {
    const nq = drawQuestion(asked.current);
    return { q: nq, order: orderFor(nq) };
  });
  const [chosen, setChosen] = useState(null);
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("question"); // question | dropping | done
  const [drop, setDrop] = useState(null); // { steps, slot, q }

  const answer = idx => {
    if (chosen !== null || phase !== "question") return;
    const q = session.q;
    const ok = idx === q.c;
    setChosen(idx);
    if (!ok) onAnswer(q, false, 0);
    // correct answers are scored after the drop resolves, once the multiplier is known
  };

  const advance = (currentScore = score) => {
    const nextCount = count + 1;
    setCount(nextCount);
    if (nextCount >= RUN_LEN) {
      setPhase("done");
      onEnd(currentScore);
      return;
    }
    const nq = drawQuestion(asked.current);
    setSession({ q: nq, order: orderFor(nq) });
    setChosen(null);
    setPhase("question");
  };

  const cont = () => {
    const q = session.q;
    const ok = chosen === q.c;
    if (ok) {
      const { steps, slot } = rollPath();
      setDrop({ steps, slot, q });
      setPhase("dropping");
    } else {
      advance();
    }
  };

  const resolveDrop = pts => {
    const newScore = score + pts;
    setScore(newScore);
    onAnswer(drop.q, true, pts);
    setDrop(null);
    advance(newScore);
  };

  const restart = () => {
    asked.current.clear();
    const nq = drawQuestion(asked.current);
    setSession({ q: nq, order: orderFor(nq) });
    setChosen(null); setCount(0); setScore(0); setDrop(null); setPhase("question");
  };

  useEffect(() => {
    if (phase !== "question") return;
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

  if (phase === "done") {
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Run complete</div>
        <div className="disp" style={{ fontSize: "clamp(70px,18vw,150px)", color: "var(--gold)", marginBottom: 10 }}>
          {score.toLocaleString()}
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {RUN_LEN} questions, {RUN_LEN} chances to drop.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={restart}>Drop again</button>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  if (phase === "dropping" && drop) {
    return (
      <section className="qwrap">
        <div className="qmeta">
          <span className="chip val">{score.toLocaleString()} pts</span>
          <span className="chip">{count + 1}/{RUN_LEN}</span>
        </div>
        <PlinkoBoard
          steps={drop.steps} slot={drop.slot} multipliers={MULTIPLIERS}
          basePoints={VALUE(drop.q.lvl)} onDone={resolveDrop}
        />
      </section>
    );
  }

  return (
    <Question
      q={session.q} order={session.order} chosen={chosen} onAnswer={answer} onNext={cont}
      gain={0} clock={null} mode="plinko" nextLabel={chosen === session.q.c ? "Drop the chip" : "Next question"}
      extra={<span className="chip val">{score.toLocaleString()} pts</span>}
    />
  );
}
