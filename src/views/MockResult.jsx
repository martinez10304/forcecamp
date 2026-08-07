import React from "react";
import { DOMAINS, DMAP } from "../data/domains.js";
import { PASS_MARK, MOCK_SECONDS, clockStr } from "../lib/scoring.js";
import { generateMockResultPdf } from "../lib/pdf.js";

export default function MockResult({ mock, onAgain, onHome }) {
  const { correct, by } = mock.result;
  const total = mock.qs.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_MARK * 100;
  const missed = mock.qs.filter(q => mock.ans[q.id] !== q.c);
  const used = MOCK_SECONDS - mock.left;

  return (
    <section className="qwrap">
      <div className="eyebrow">{passed ? "Above the pass mark" : "Below the pass mark"}</div>
      <div className={"scorebig " + (passed ? "pass" : "fail")}>{pct}%</div>
      <div className="gate">
        <div className="gatefill" style={{ width: pct + "%", background: passed ? "var(--mint)" : "var(--rose)" }} />
        <div className="gatemark" />
      </div>
      <p className="lede" style={{ marginTop: 6 }}>
        {correct} of {total} correct in {clockStr(used)}. The real exam needs 39 of 60, and the gold line above is that 65% mark.
        {!passed && ` You were ${Math.ceil(total * PASS_MARK) - correct} question${Math.ceil(total * PASS_MARK) - correct === 1 ? "" : "s"} short.`}
      </p>

      <div className="sechead"><h2 style={{ fontSize: 26 }}>Where the points went</h2></div>
      <div className="bars">
        {DOMAINS.map(dm => {
          const b = by[dm.k] || { r: 0, n: 0 };
          const dp = b.n ? Math.round((b.r / b.n) * 100) : 0;
          return (
            <div className="barrow" key={dm.k}>
              <div className="barlbl">
                <b>{dm.name}</b>
                <span>{b.r}/{b.n} &middot; {dm.weight}% of exam</span>
              </div>
              <div className="bartrack"><div className="barfill" style={{ width: dp + "%", background: dp >= 65 ? dm.hue : "var(--rose)" }} /></div>
            </div>
          );
        })}
      </div>

      <div className="sechead"><h2 style={{ fontSize: 26 }}>Review</h2><p>{missed.length} missed</p></div>
      {missed.length === 0 ? (
        <div className="empty">Clean sweep. Take another one to confirm it wasn't the question draw.</div>
      ) : (
        <div className="misslist">
          {missed.map(q => (
            <div className="missitem" key={q.id}>
              <div className="tag">{DMAP[q.d].name}</div>
              <p className="mq">{q.q}</p>
              {mock.ans[q.id] !== undefined
                ? <p className="me" style={{ color: "var(--rose)", marginBottom: 6 }}>You chose: {q.a[mock.ans[q.id]]}</p>
                : <p className="me" style={{ color: "var(--dim)", marginBottom: 6 }}>Left blank</p>}
              <p className="ma">&rarr; {q.a[q.c]}</p>
              <p className="me">{q.e}</p>
            </div>
          ))}
        </div>
      )}

      <div className="row">
        <button className="btn" onClick={onAgain}>New mock exam</button>
        <button className="btn ghost" onClick={onHome}>Home</button>
        <button className="btn ghost" onClick={() => generateMockResultPdf(mock)}>Download PDF</button>
      </div>
    </section>
  );
}
