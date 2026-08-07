import React from "react";
import { ALLQ } from "../data/questions.js";
import { DOMAINS, DMAP } from "../data/domains.js";
import { rankForXp } from "../lib/scoring.js";
import { RANKS } from "../data/ranks.js";

export default function Stats({ p, weakest, onRapid, onMock, onRanks }) {
  const acc = p.answered ? Math.round((p.correct / p.answered) * 100) : 0;
  const missed = p.misses.map(id => ALLQ[id]).filter(Boolean);
  const rank = rankForXp(p.xp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];

  return (
    <section style={{ paddingTop: 30 }}>
      <div className="sechead"><h2>Progress</h2></div>
      <div className="cards">
        <div className="card"><b>{acc}%</b><i>Overall accuracy</i></div>
        <div className="card"><b>{p.answered}</b><i>Questions answered</i></div>
        <div className="card"><b>{p.xp.toLocaleString()}</b><i>Total XP</i></div>
        <div className="card"><b>{missed.length}</b><i>Open misses</i></div>
      </div>

      <div className="note">
        Rank: <b>{rank.name}</b>
        {nextRank ? ` · ${(nextRank.at - p.xp).toLocaleString()} XP to ${nextRank.name}` : " · top rank reached"}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn ghost" onClick={onRanks}>See the full rank ladder</button>
        </div>
      </div>

      {weakest ? (
        <div className="note">
          Spend your next session on <b>{weakest.d.name}</b> &mdash; you're at {Math.round(weakest.acc * 100)}% there,
          and it carries {weakest.d.weight}% of the exam.
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={onRapid}>Drill it in Rapid Fire</button>
          </div>
        </div>
      ) : (
        <div className="note">Answer at least three questions in a domain and this will start telling you where to focus.</div>
      )}

      {(p.mocks && p.mocks.length > 0) && (
        <>
          <div className="sechead"><h2 style={{ fontSize: 26 }}>Mock exam history</h2></div>
          <div className="bars" style={{ marginBottom: 8 }}>
            {p.mocks.map((m, i) => {
              const pct = Math.round((m.correct / m.total) * 100);
              const passed = pct >= 65;
              return (
                <div className="barrow" key={i}>
                  <div className="barlbl">
                    <b style={{ color: passed ? "var(--mint)" : "var(--rose)" }}>{pct}% &mdash; {passed ? "Pass" : "Fail"}</b>
                    <span>{m.correct}/{m.total} &middot; {new Date(m.at).toLocaleDateString()}</span>
                  </div>
                  <div className="bartrack"><div className="barfill" style={{ width: pct + "%", background: passed ? "var(--mint)" : "var(--rose)" }} /></div>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginBottom: 10 }}><button className="btn ghost" onClick={onMock}>Take another mock exam</button></div>
        </>
      )}

      <div className="sechead"><h2 style={{ fontSize: 26 }}>By domain</h2></div>
      <div className="bars">
        {DOMAINS.map(d => {
          const s = p.stats[d.k] || { r: 0, w: 0 };
          const n = s.r + s.w;
          const pct = n ? Math.round((s.r / n) * 100) : 0;
          return (
            <div className="barrow" key={d.k}>
              <div className="barlbl">
                <b>{d.name}</b>
                <span>{(n ? pct + "% · " + n + " seen" : "not started") + " · " + d.weight + "%"}</span>
              </div>
              <div className="bartrack"><div className="barfill" style={{ width: (n ? pct : 0) + "%", background: d.hue }} /></div>
            </div>
          );
        })}
      </div>

      <div className="sechead"><h2 style={{ fontSize: 26 }}>Questions you missed</h2></div>
      {missed.length === 0 ? (
        <div className="empty">Nothing here yet. Misses land in this list with the explanation, and clear once you get them right.</div>
      ) : (
        <div className="misslist">
          {missed.map(m => (
            <div className="missitem" key={m.id}>
              <div className="tag">{DMAP[m.d].name}</div>
              <p className="mq">{m.q}</p>
              <p className="ma">&rarr; {m.a[m.c]}</p>
              <p className="me">{m.e}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
