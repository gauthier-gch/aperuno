import React, { useRef, useState } from "react";
import { MYID } from "../me.js";

function Pear() {
  return (
    <svg viewBox="0 0 240 300" width="240" height="300" style={{ position: "absolute", inset: 0 }}>
      <path d="M120 40 C118 55 116 70 112 82 C90 96 74 122 74 162 C74 226 96 268 120 268 C144 268 166 226 166 162 C166 122 150 96 128 82 C124 70 122 55 120 40 Z"
        fill="#b6d957" stroke="#8bbf3a" strokeWidth="3" />
      <path d="M120 44 C124 30 134 22 150 22 C146 38 136 46 120 46 Z" fill="#5fa83a" />
      <line x1="120" y1="44" x2="120" y2="20" stroke="#7a5a2a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PearGame({ room, mg, isLauncher, act, busy, waiting }) {
  const stageRef = useRef(null);
  const [pts, setPts] = useState([]);     // points normalisés 0..1 du trait dessiné
  const drawing = useRef(false);
  const submitted = mg.cuts && mg.cuts[MYID] != null;

  function norm(e) {
    const r = stageRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (t.clientY - r.top) / r.height)) };
  }
  const start = (e) => { if (submitted || mg.phase === "result") return; drawing.current = true; setPts([norm(e)]); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault?.(); setPts((p) => [...p, norm(e)]); };
  const end = () => { drawing.current = false; };

  const meanX = pts.length ? pts.reduce((s, p) => s + p.x, 0) / pts.length : 0.5;

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
      <p className="muted mb">Trace ta coupe au doigt, le plus au centre possible :</p>
      <div className="pear-stage" ref={stageRef}
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        <Pear />
        {submitted && <div className="cut-line you" style={{ left: `${mg.cuts[MYID] * 100}%` }} />}
        {!submitted && pts.length > 1 && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <polyline points={pts.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}
              fill="none" stroke="#f4c95d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {submitted
        ? <p className="muted">✅ Coupe validée. En attente des autres… ({Object.keys(mg.cuts).length}/{room.players.length})</p>
        : (
          <div className="row">
            <button className="btn btn-ghost btn-sm auto" disabled={busy || !pts.length} onClick={() => setPts([])}>Effacer</button>
            <button className="btn btn-blue btn-sm auto" disabled={busy || pts.length < 2} onClick={() => act({ type: "mgPearCut", x: meanX })}>Valider ma coupe 🔪</button>
          </div>
        )}
    </div>
  );
}
