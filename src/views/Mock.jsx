import React, { useState } from "react";
import { DMAP } from "../data/domains.js";

export default function MockExam({ mock, setMock, onSubmit }) {
  const [confirming, setConfirming] = useState(false);
  const q = mock.qs[mock.i];
  const d = DMAP[q.d];
  const order = mock.order[q.id];
  const picked = mock.ans[q.id];
  const answered = Object.keys(mock.ans).length;
  const remaining = mock.qs.length - answered;

  const choose = orig => setMock(m => ({ ...m, ans: { ...m.ans, [q.id]: orig } }));
  const jump = i => { setMock(m => ({ ...m, i })); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const step = n => jump(Math.min(mock.qs.length - 1, Math.max(0, mock.i + n)));

  return (
    <section className="qwrap">
      <div className="exambar">
        <div className="examnum">{mock.i + 1}<small> / {mock.qs.length}</small></div>
        <div className="spacer" />
        <button className={"nb" + (mock.flag[q.id] ? " on" : "")}
          onClick={() => setMock(m => ({ ...m, flag: { ...m.flag, [q.id]: !m.flag[q.id] } }))}>
          {mock.flag[q.id] ? "Flagged" : "Flag for review"}
        </button>
      </div>

      <div className="qmeta">
        <span className="chip" style={{ background: d.hue + "26", color: d.hue }}>{d.name}</span>
      </div>
      <p className="qtext">{q.q}</p>
      <div className="opts">
        {order.map((orig, i) => (
          <button key={orig} className={"opt" + (picked === orig ? " picked" : "")} onClick={() => choose(orig)}>
            <span className="key">{i + 1}</span>
            <span>{q.a[orig]}</span>
          </button>
        ))}
      </div>

      <div className="row">
        <button className="btn ghost" onClick={() => step(-1)} disabled={mock.i === 0}>Previous</button>
        <button className="btn" onClick={() => step(1)} disabled={mock.i === mock.qs.length - 1}>Next</button>
        <div className="spacer" />
        <button className="btn ghost" onClick={() => setConfirming(true)}>Submit exam</button>
      </div>
      <div className="legend" style={{ marginTop: 14 }}>
        <span>1&ndash;4 answer</span><span>&larr; &rarr; navigate</span><span>F flag</span>
      </div>

      {confirming && (
        <div className="confirm">
          {remaining > 0
            ? <>You have <b>{remaining}</b> unanswered question{remaining === 1 ? "" : "s"}. There's no penalty for guessing on the real exam, so it's always worth answering.</>
            : <>All {mock.qs.length} answered. Ready to score?</>}
          <div className="row">
            <button className="btn" onClick={onSubmit}>Submit and score</button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>Keep working</button>
          </div>
        </div>
      )}

      <div className="palette">
        {mock.qs.map((x, i) => (
          <button key={x.id}
            className={"pq" + (mock.ans[x.id] !== undefined ? " ansd" : "") + (mock.flag[x.id] ? " flagd" : "") + (i === mock.i ? " cur" : "")}
            onClick={() => jump(i)} aria-label={"Go to question " + (i + 1)}>{i + 1}</button>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: "rgba(1,118,211,.55)" }} />Answered</span>
        <span><i style={{ border: "1px solid var(--ember)" }} />Flagged</span>
        <span><i style={{ border: "1px solid rgba(124,194,255,.22)" }} />Untouched</span>
      </div>
    </section>
  );
}
