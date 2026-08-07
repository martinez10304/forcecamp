import React from "react";

export default function RunOver({ score, count, best, onAgain, onHome }) {
  const isBest = score >= best && score > 0;
  return (
    <section className="qwrap" style={{ textAlign: "center" }}>
      <div className="eyebrow" style={{ textAlign: "center" }}>{isBest ? "New personal best" : "Time"}</div>
      <div className="disp" style={{ fontSize: "clamp(70px,18vw,150px)", color: "var(--gold)", marginBottom: 10 }}>
        {score.toLocaleString()}
      </div>
      <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
        {count} question{count === 1 ? "" : "s"} in 90 seconds. Best run: {Math.max(best, score).toLocaleString()}.
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn" onClick={onAgain}>Run it again</button>
        <button className="btn ghost" onClick={onHome}>Home</button>
      </div>
    </section>
  );
}
