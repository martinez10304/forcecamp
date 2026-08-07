import React, { useState, useEffect } from "react";

const STEP_MS = 160;
const LAND_PAUSE_MS = 1400;

/* Purely visual — the outcome (steps/slot) is already decided by Plinko.jsx's random
   walk before this mounts. This just steps the chip down through the precomputed
   positions on a timer and reveals the landed slot, then reports the points earned. */
export default function PlinkoBoard({ steps, slot, multipliers, basePoints, onDone }) {
  const [rowIndex, setRowIndex] = useState(0);
  const [landed, setLanded] = useState(false);
  const lastRow = steps.length - 1;
  const mult = multipliers[slot];
  const pts = Math.round(basePoints * mult);

  useEffect(() => {
    if (rowIndex >= lastRow) {
      setLanded(true);
      const t = setTimeout(() => onDone(pts), LAND_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRowIndex(i => i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [rowIndex]);

  const pos = steps[rowIndex];
  const leftPct = ((pos + lastRow) / (2 * lastRow)) * 100;
  const topPct = (rowIndex / lastRow) * 100;

  return (
    <div className="plinko">
      <div className="plinko-board">
        {Array.from({ length: lastRow }).map((_, r) => (
          <div className="plinko-row" key={r}>
            {Array.from({ length: r + 2 }).map((_, i) => <span className="peg" key={i} />)}
          </div>
        ))}
        <div className="plinko-chip" style={{ left: leftPct + "%", top: topPct + "%" }} />
      </div>
      <div className="plinko-slots">
        {multipliers.map((m, i) => (
          <div key={i} className={"plinko-slot" + (landed && i === slot ? " hit" : "")}>{m}&times;</div>
        ))}
      </div>
      {landed && (
        <div className="plinko-result">
          Landed on <b>{mult}&times;</b> &mdash; +{pts.toLocaleString()} XP
        </div>
      )}
    </div>
  );
}
