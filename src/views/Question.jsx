import React from "react";
import { DMAP } from "../data/domains.js";
import { VALUE } from "../lib/scoring.js";

export default function Question({ q, order, chosen, onAnswer, onNext, gain, clock, mode, extra, nextLabel }) {
  const d = DMAP[q.d];
  const done = chosen !== null;
  const ok = chosen === q.c;
  const label = nextLabel || (mode === "rapid" ? "Next question" : "Back to board");
  return (
    <section className="qwrap">
      <div className="qmeta">
        <span className="chip" style={{ background: d.hue + "26", color: d.hue }}>{d.name}</span>
        {mode === "q" && <span className="chip val">{VALUE(q.lvl)}</span>}
        {clock !== null && <span className={"chip time" + (clock <= 10 ? " low" : "")}>{clock}s</span>}
        {extra}
      </div>
      <p className="qtext">{q.q}</p>
      <div className="opts">
        {order.map((orig, i) => {
          let cls = "opt";
          if (done) {
            if (orig === q.c) cls += " right";
            else if (orig === chosen) cls += " wrong";
            else cls += " faded";
          }
          return (
            <button key={orig} className={cls} onClick={() => onAnswer(orig)} disabled={done}>
              <span className="key">{i + 1}</span>
              <span>{q.a[orig]}</span>
            </button>
          );
        })}
      </div>

      {done && (
        <>
          <div className="expl">
            <div className={"verdict " + (ok ? "ok" : "no")}>{ok ? "Correct" : "Not quite"}</div>
            {gain > 0 && <div className="gain">+{gain.toLocaleString()} XP</div>}
            <div className="lbl" style={{ marginTop: 14 }}>Why</div>
            <p>{q.e}</p>
          </div>
          <div className="row">
            <button className="btn" onClick={onNext} autoFocus>
              {label}
            </button>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#7E9AC4" }}>
              press enter
            </span>
          </div>
        </>
      )}
      {!done && (
        <div className="row">
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#7E9AC4" }}>
            press 1&ndash;4 to answer
          </span>
        </div>
      )}
    </section>
  );
}
