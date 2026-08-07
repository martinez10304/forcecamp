import React from "react";
import { DOMAINS } from "../data/domains.js";
import { LEVELS, VALUE } from "../lib/scoring.js";

export default function Board({ p, onTile, onReset }) {
  const total = Object.keys(p.cleared).length;
  return (
    <section>
      <div className="sechead">
        <h2>The Board</h2>
        <p>{total} of 32 cleared &middot; percentages are the official exam weights</p>
        <div className="spacer" />
        {total > 0 && <button className="btn ghost" onClick={onReset}>Reset board</button>}
      </div>
      <div className="board">
        {DOMAINS.map(d => (
          <div className="cat" key={d.k}>
            <div className="cathead" style={{ borderBottomColor: d.hue }}>
              <div className="catname">{d.short}</div>
              <div className="catwt">{d.weight}% of exam</div>
            </div>
            <div className="tiles">
              {LEVELS.map(l => {
                const st = p.cleared[d.k + ":" + l];
                return (
                  <button key={l} className={"tile" + (st ? " cleared " + st : "")}
                    onClick={() => onTile(d.k, l)} disabled={!!st}
                    aria-label={d.name + ", " + VALUE(l) + " points" + (st ? ", cleared" : "")}>
                    {st ? (st === "hit" ? "✓" : "✗") : VALUE(l)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
