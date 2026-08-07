import React from "react";
import { RANKS } from "../data/ranks.js";
import { rankForXp } from "../lib/scoring.js";

export default function Ranks({ xp }) {
  const current = rankForXp(xp);
  return (
    <section style={{ paddingTop: 30 }}>
      <div className="sechead">
        <h2>Ranks</h2>
        <p>Lowest to highest &middot; earn XP across every mode to climb</p>
      </div>
      <div className="bars">
        {RANKS.map((r, i) => {
          const achieved = xp >= r.at;
          const isCurrent = r.name === current.name;
          const next = RANKS[i + 1];
          const pct = isCurrent && next ? Math.min(100, Math.max(0, ((xp - r.at) / (next.at - r.at)) * 100)) : achieved ? 100 : 0;
          return (
            <div className="barrow" key={r.name} style={{ opacity: achieved ? 1 : 0.5 }}>
              <div className="barlbl">
                <b style={{ color: isCurrent ? "var(--gold)" : undefined }}>
                  {r.name}{isCurrent && " · you are here"}
                </b>
                <span>{r.at.toLocaleString()} XP{next ? ` – ${(next.at - 1).toLocaleString()} XP` : "+"}</span>
              </div>
              <div className="bartrack">
                <div className="barfill" style={{ width: pct + "%", background: isCurrent ? "var(--gold)" : "var(--mint)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
