import React from "react";
import Question from "./Question.jsx";
import RunOver from "./RunOver.jsx";

export default function RapidFire({ q, order, chosen, onAnswer, onNext, gain, clock, runOver, runScore, runCount, best, onAgain, onHome }) {
  if (runOver) {
    return <RunOver score={runScore} count={runCount} best={best} onAgain={onAgain} onHome={onHome} />;
  }
  if (!q) return null;
  return <Question q={q} order={order} chosen={chosen} onAnswer={onAnswer} onNext={onNext} gain={gain} clock={clock} mode="rapid" />;
}
