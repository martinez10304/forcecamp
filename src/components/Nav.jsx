import React from "react";
import { multOf, clockStr } from "../lib/scoring.js";

export default function Nav({
  view, go, startRun, startMock,
  inMock, mock,
  runOver, streak, runScore,
  p, rank, railPct,
  auth,
}) {
  return (
    <header className="top">
      <div className="topin">
        <div className="brand">Force<span>camp</span></div>
        <nav className="nav">
          <button className={"nb" + (view === "home" ? " on" : "")} onClick={() => go("home")}>Home</button>
          <button className={"nb" + (view === "board" || view === "q" ? " on" : "")} onClick={() => go("board")}>Board</button>
          <button className={"nb" + (view === "rapid" ? " on" : "")} onClick={startRun}>Rapid Fire</button>
          <button className={"nb" + (view === "flash" ? " on" : "")} onClick={() => go("flash")}>Flashcards</button>
          <button className={"nb" + (view === "survival" ? " on" : "")} onClick={() => go("survival")}>Survival</button>
          <button className={"nb" + (view === "boss" ? " on" : "")} onClick={() => go("boss")}>Boss Rush</button>
          <button className={"nb" + (view === "daily" ? " on" : "")} onClick={() => go("daily")}>Daily</button>
          <button className={"nb" + (view === "plinko" ? " on" : "")} onClick={() => go("plinko")}>Plinko</button>
          <button className={"nb" + (view === "mock" ? " on" : "")} onClick={startMock}>Mock Exam</button>
          <button className={"nb" + (view === "stats" ? " on" : "")} onClick={() => go("stats")}>Progress</button>
          <button className={"nb" + (view === "ranks" ? " on" : "")} onClick={() => go("ranks")}>Ranks</button>
        </nav>
        <div className="spacer" />
        {inMock ? (
          <>
            <div className="stat"><b>{Object.keys(mock.ans).length}/{mock.qs.length}</b><i>Answered</i></div>
            <div className={"bigclock" + (mock.left <= 300 ? " low" : "")}>{clockStr(mock.left)}</div>
          </>
        ) : view === "rapid" && !runOver ? (
          <div className="combo">
            <div>
              <div className="comboval">{multOf(streak)}&times;</div>
              <div className="combolbl">{streak} streak</div>
            </div>
            <div className="stat"><b>{runScore.toLocaleString()}</b><i>Run</i></div>
          </div>
        ) : (
          <>
            <div className="stat"><b>{p.xp.toLocaleString()}</b><i>XP</i></div>
            <div className="stat"><b>{rank.name}</b><i>Rank</i></div>
          </>
        )}
        {auth && auth.status === "signedIn" && (
          <button className="nb" onClick={auth.onSignOut} title={auth.email}>Sign out</button>
        )}
        {auth && auth.status === "guest" && (
          <button className="nb" onClick={auth.onGoAuth}>Sign in to save to the cloud</button>
        )}
      </div>
      <div className="rail"><div className="railfill" style={{ width: Math.max(2, railPct) + "%" }} /></div>
    </header>
  );
}
