import React, { useState } from "react";

export function TimerGame({ mg, g, isLauncher, act, busy, waiting }) {
  const [word, setWord] = useState("");
  if (!isLauncher) return waiting;
  if (g.id === "motinterdit") {
    return (
      <div>
        <input className="input mb" placeholder="Mot interdit" value={word} onChange={(e) => setWord(e.target.value)} />
        <button className="btn btn-blue" disabled={busy || !word.trim()} onClick={() => act({ type: "mgStartTimer", label: `Mot interdit : ${word.trim()}` })}>
          Lancer le chrono 10 min ⏳
        </button>
      </div>
    );
  }
  return (
    <button className="btn btn-blue" disabled={busy} onClick={() => act({ type: "mgStartTimer", label: "Ni oui ni non" })}>
      Lancer le chrono 10 min ⏳
    </button>
  );
}
