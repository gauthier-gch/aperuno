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

/* Ligne (angle en degrés, écran y vers le bas) passant par le centre. */
function angleLine(angle, len = 60) {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
  return { x1: 50 - dx, y1: 50 - dy, x2: 50 + dx, y2: 50 + dy };
}

export function PearGame({ room, mg, isLauncher, act, busy, waiting }) {
  const stageRef = useRef(null);
  const [pts, setPts] = useState([]);
  const drawing = useRef(false);
  const submitted = mg.cuts && mg.cuts[MYID] != null;
  const target = mg.targetAngle;

  function norm(e) {
    const r = stageRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (t.clientY - r.top) / r.height)) };
  }
  const start = (e) => { if (submitted || mg.phase === "result") return; drawing.current = true; setPts([norm(e)]); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault?.(); setPts((p) => [...p, norm(e)]); };
  const end = () => { drawing.current = false; };

  function submit() {
    const p1 = pts[0], p2 = pts[pts.length - 1];
    let angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    angle = ((angle % 180) + 180) % 180;
    // distance du centre (0.5,0.5) à la droite (p1,p2)
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1e-6;
    const area = Math.abs((p2.x - p1.x) * (p1.y - 0.5) - (p1.x - 0.5) * (p2.y - p1.y));
    const offset = area / len;
    act({ type: "mgPearCut", cut: { angle, offset, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } });
  }

  if (mg.phase === "result") {
    const loser = room.players.find((p) => p.id === mg.loserId);
    const tl = angleLine(target);
    return (
      <div className="center-col">
        <div className="pear-stage">
          <Pear />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <line x1={tl.x1} y1={tl.y1} x2={tl.x2} y2={tl.y2} stroke="#fff" strokeWidth="1.4" strokeDasharray="4 3" />
            {room.players.map((p) => {
              const c = mg.cuts[p.id];
              if (!c || c.x1 == null) return null;
              const isL = p.id === mg.loserId;
              return <line key={p.id} x1={c.x1 * 100} y1={c.y1 * 100} x2={c.x2 * 100} y2={c.y2 * 100}
                stroke={isL ? "#ff3b5c" : "#f4c95d"} strokeWidth={isL ? "2" : "1.4"} strokeLinecap="round" />;
            })}
          </svg>
        </div>
        <p className="muted mb"><span style={{ color: "#fff" }}>┈ cible</span> · reproduis la direction. Le plus éloigné perd.</p>
        <p className="b mb">🍐 {loser.name} s'est le plus écarté → il/elle boit !</p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: mg.loserId })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  const tl = angleLine(target);
  return (
    <div className="center-col">
      <p className="muted mb">Reproduis la coupe <b className="w">cible</b> (pointillés) en la traçant au doigt :</p>
      <div className="pear-stage" ref={stageRef}
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        <Pear />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <line x1={tl.x1} y1={tl.y1} x2={tl.x2} y2={tl.y2} stroke="#fff" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.8" />
          {!submitted && pts.length > 1 && (
            <polyline points={pts.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}
              fill="none" stroke="#f4c95d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </div>
      {submitted
        ? <p className="muted">✅ Coupe validée. En attente des autres… ({Object.keys(mg.cuts).length}/{room.players.length})</p>
        : (
          <div className="row">
            <button className="btn btn-ghost btn-sm auto" disabled={busy || !pts.length} onClick={() => setPts([])}>Effacer</button>
            <button className="btn btn-blue btn-sm auto" disabled={busy || pts.length < 2} onClick={submit}>Valider ma coupe 🔪</button>
          </div>
        )}
    </div>
  );
}
