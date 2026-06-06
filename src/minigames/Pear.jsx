import React, { useRef, useState } from "react";
import { MYID } from "../me.js";

function Pear() {
  return (
    <svg viewBox="0 0 240 300" width="240" height="300">
      <path d="M120 40 C118 55 116 70 112 82 C90 96 74 122 74 162 C74 226 96 268 120 268 C144 268 166 226 166 162 C166 122 150 96 128 82 C124 70 122 55 120 40 Z"
        fill="#b6d957" stroke="#8bbf3a" strokeWidth="3" />
      <path d="M120 44 C124 30 134 22 150 22 C146 38 136 46 120 46 Z" fill="#5fa83a" />
      <line x1="120" y1="44" x2="120" y2="20" stroke="#7a5a2a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PearGame({ room, mg, isLauncher, act, busy, waiting }) {
  const stageRef = useRef(null);
  const [x, setX] = useState(0.5);
  const submitted = mg.cuts && mg.cuts[MYID] != null;

  function pick(e) {
    if (submitted || mg.phase === "result") return;
    const r = stageRef.current.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setX(Math.max(0, Math.min(1, cx / r.width)));
  }

  if (mg.phase === "result") {
    const loser = room.players.find((p) => p.id === mg.loserId);
    return (
      <div className="center-col">
        <div className="pear-stage">
          <Pear />
          <div className="cut-line" style={{ left: "50%", opacity: 0.5 }} />
          {room.players.map((p) => mg.cuts[p.id] != null && (
            <div key={p.id} className={"cut-line" + (p.id === mg.loserId ? " you" : "")} style={{ left: `${mg.cuts[p.id] * 100}%` }} />
          ))}
        </div>
        <p className="muted mb">Coupe parfaite = ligne centrale. Le plus éloigné perd.</p>
        <p className="b mb">🍐 {loser.name} est le plus loin → il/elle boit !</p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: mg.loserId })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  return (
    <div className="center-col">
      <p className="muted mb">Place ta coupe verticale au centre de la poire :</p>
      <div className="pear-stage" ref={stageRef}
        onClick={pick} onTouchStart={pick} onTouchMove={pick}>
        <Pear />
        <div className={"cut-line you"} style={{ left: `${(submitted ? mg.cuts[MYID] : x) * 100}%` }} />
      </div>
      {submitted
        ? <p className="muted">✅ Coupe validée. En attente des autres… ({Object.keys(mg.cuts).length}/{room.players.length})</p>
        : <button className="btn btn-blue" disabled={busy} onClick={() => act({ type: "mgPearCut", x })}>Couper ici 🔪</button>}
    </div>
  );
}
