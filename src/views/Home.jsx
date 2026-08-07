import React from "react";

export default function Home({ p, rank, nextRank, weakest, onBoard, onRapid, onStats, onMock, onFlash, onSurvival, onBoss, onDaily, onPlinko }) {
  const acc = p.answered ? Math.round((p.correct / p.answered) * 100) : null;
  return (
    <section className="hero">
      <div className="eyebrow">Platform Administrator &middot; ADM-201</div>
      <h1 className="h1">Stop reading.<em>Start scoring.</em></h1>
      <p className="lede">
        Every question is scenario-based, weighted to the real exam, and followed by the reasoning &mdash; because
        knowing <em>why</em> the other three are wrong is what actually gets you through test day.
      </p>
      <div className="modes">
        <button className="mode" onClick={onBoard}>
          <span className="num">01</span>
          <h3>The Board</h3>
          <p>Eight categories, four difficulty tiers. Clear tiles for points and watch the exam blueprint fill in.</p>
        </button>
        <button className="mode" onClick={onRapid}>
          <span className="num">02</span>
          <h3>Rapid Fire</h3>
          <p>90 seconds. Build a streak to triple your multiplier. One wrong answer and the combo resets.</p>
        </button>
        <button className="mode" onClick={onFlash}>
          <span className="num">03</span>
          <h3>Flashcards</h3>
          <p>Pure-recall facts, self-graded. Flip the card, mark it Got it or Missed it, keep moving.</p>
        </button>
        <button className="mode" onClick={onSurvival}>
          <span className="num">04</span>
          <h3>Survival</h3>
          <p>No clock. Three lives, one run. A wrong answer costs a life &mdash; how far can you go on accuracy alone?</p>
        </button>
        <button className="mode" onClick={onBoss}>
          <span className="num">05</span>
          <h3>Boss Rush</h3>
          <p>Pick a domain, face all four difficulty tiers back-to-back. Clean sweep earns a bonus.</p>
        </button>
        <button className="mode" onClick={onDaily}>
          <span className="num">06</span>
          <h3>Daily Challenge</h3>
          <p>The same 10 questions for everyone, every day. Come back tomorrow and keep the streak alive.</p>
        </button>
        <button className="mode" onClick={onPlinko}>
          <span className="num">07</span>
          <h3>Plinko</h3>
          <p>Answer right, drop the chip. Where it lands sets your multiplier &mdash; edges pay big, center is safe.</p>
        </button>
        <button className="mode" onClick={onMock}>
          <span className="num">08</span>
          <h3>Mock Exam</h3>
          <p>60 questions, 105 minutes, blueprint-weighted. No explanations until you submit. 65% to pass.</p>
        </button>
      </div>
      {p.answered > 0 && (
        <div className="cards" style={{ marginTop: 30 }}>
          <div className="card"><b>{acc}%</b><i>Accuracy</i></div>
          <div className="card"><b>{p.answered}</b><i>Answered</i></div>
          <div className="card"><b>{p.best.toLocaleString()}</b><i>Best run</i></div>
          <div className="card"><b>{nextRank ? (nextRank.at - p.xp).toLocaleString() : "—"}</b><i>{nextRank ? "XP to " + nextRank.name : "Max rank"}</i></div>
        </div>
      )}
      {weakest && (
        <div className="note" style={{ marginTop: 20 }}>
          Weakest area right now: <b>{weakest.d.name}</b> at {Math.round(weakest.acc * 100)}% &mdash; worth {weakest.d.weight}% of the exam.
          Rapid Fire pulls extra questions from here automatically.
        </div>
      )}
      <div className="row" style={{ marginTop: 20 }}>
        <button className="btn ghost" onClick={onStats}>Progress</button>
      </div>
    </section>
  );
}
