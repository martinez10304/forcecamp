import React, { useState, useEffect, useCallback } from "react";
import { ALLQ } from "../data/questions.js";
import { DOMAINS, DMAP } from "../data/domains.js";
import { shuffleArr } from "../lib/scoring.js";

const DECK_SOURCE = ALLQ.filter(q => q.lvl === 1);
const buildDeck = domainFilter => shuffleArr(domainFilter ? DECK_SOURCE.filter(q => q.d === domainFilter) : DECK_SOURCE);

export default function Flashcards({ onGrade, onHome }) {
  const [domainFilter, setDomainFilter] = useState("");
  const [deck, setDeck] = useState(() => buildDeck(""));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(0);
  const [gotIt, setGotIt] = useState(0);
  const [missed, setMissed] = useState(0);
  const [done, setDone] = useState(false);

  const card = deck[index];

  const restart = useCallback(filter => {
    setDomainFilter(filter);
    setDeck(buildDeck(filter));
    setIndex(0); setFlipped(false);
    setSeen(0); setGotIt(0); setMissed(0); setDone(false);
  }, []);

  const grade = useCallback(got => {
    if (!card || !flipped) return;
    onGrade(card, got);
    setSeen(s => s + 1);
    if (got) setGotIt(g => g + 1); else setMissed(m => m + 1);
    if (index + 1 >= deck.length) { setDone(true); return; }
    setIndex(i => i + 1); setFlipped(false);
  }, [card, flipped, index, deck.length, onGrade]);

  useEffect(() => {
    if (done) return;
    const h = e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(f => !f); }
      else if (flipped && (e.key === "ArrowRight" || e.key.toLowerCase() === "g")) grade(true);
      else if (flipped && (e.key === "ArrowLeft" || e.key.toLowerCase() === "m")) grade(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [flipped, grade, done]);

  if (!card && !done) {
    return (
      <section className="qwrap">
        <div className="empty">No recall-tier questions in this domain yet.</div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="qwrap" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Deck complete</div>
        <div className="disp" style={{ fontSize: "clamp(56px,14vw,110px)", color: "var(--gold)", marginBottom: 10 }}>
          {gotIt}/{seen}
        </div>
        <p className="lede" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          {gotIt} got it, {missed} missed, out of {seen} cards.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => restart(domainFilter)}>New deck</button>
          <button className="btn ghost" onClick={onHome}>Home</button>
        </div>
      </section>
    );
  }

  const d = DMAP[card.d];

  return (
    <section className="qwrap">
      <div className="qmeta">
        <span className="chip" style={{ background: d.hue + "26", color: d.hue }}>{d.name}</span>
        <span className="chip">{index + 1} / {deck.length}</span>
        <div className="spacer" />
        <select className="nb" value={domainFilter} onChange={e => restart(e.target.value)} aria-label="Filter flashcards by domain">
          <option value="">All domains</option>
          {DOMAINS.map(dm => <option key={dm.k} value={dm.k}>{dm.short}</option>)}
        </select>
      </div>

      <button
        className="opt"
        style={{ width: "100%", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 28 }}
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? "Card back, showing answer. Press again to flip back." : "Card front, showing question. Press to flip."}
      >
        {!flipped ? (
          <p className="qtext" style={{ margin: 0 }}>{card.q}</p>
        ) : (
          <div>
            <div className="verdict ok" style={{ marginBottom: 12 }}>{card.a[card.c]}</div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#CFE0F2" }}>{card.e}</p>
          </div>
        )}
      </button>

      <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
        {!flipped ? (
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#7E9AC4" }}>press space or enter to flip</span>
        ) : (
          <>
            <button className="btn ghost" onClick={() => grade(false)} style={{ borderColor: "var(--rose)", color: "var(--rose)" }}>Missed it</button>
            <button className="btn" onClick={() => grade(true)}>Got it</button>
          </>
        )}
      </div>
    </section>
  );
}
