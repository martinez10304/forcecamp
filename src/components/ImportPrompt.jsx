import React from "react";

export default function ImportPrompt({ local, onImport, onDiscard }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Import existing progress">
      <div className="modalcard">
        <div className="eyebrow">Found existing progress on this device</div>
        <p className="lede" style={{ marginBottom: 20 }}>
          This browser has {local.answered} answered question{local.answered === 1 ? "" : "s"} and {local.xp.toLocaleString()} XP
          saved locally from before you signed in. Import it into your new account?
        </p>
        <div className="row">
          <button className="btn" onClick={onImport}>Import it</button>
          <button className="btn ghost" onClick={onDiscard}>Start fresh</button>
        </div>
      </div>
    </div>
  );
}
