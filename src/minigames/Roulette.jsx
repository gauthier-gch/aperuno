import React, { useEffect, useState } from "react";
import { ROULETTE } from "../game/constants.js";
import { DesignateLoser } from "../components/common.jsx";

const N = ROULETTE.length;
const SEG = 360 / N;
const SHORT = ["3 gorgées", "Distrib. 3", "+ alcool (toi)", "Cul-sec 🥃", "5 gorgées", "Distrib. 5", "+ alcool (choix)", "Un sec 🥃"];

function polar(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
}
function slicePath(i) {
  const [x0, y0] = polar(i * SEG, 48);
  const [x1, y1] = polar((i + 1) * SEG, 48);
  return `M50,50 L${x0.toFixed(2)},${y0.toFixed(2)} A48,48 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

export function RouletteGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [rot, setRot] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (mg.segment == null || !mg.spinId) return;
    const center = mg.segment * SEG + SEG / 2;
    setRot(360 * 5 * mg.spinId + (360 - center));
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 4300);
    return () => clearTimeout(t);
  }, [mg.spinId, mg.segment]);

  const seg = mg.segment != null ? ROULETTE[mg.segment] : null;

  return (
    <div className="center-col">
      <div className="wheel-wrap">
        <div className="wheel-pin">🔻</div>
        <svg className="wheel" viewBox="0 0 100 100" style={{ transform: `rotate(${rot}deg)` }}>
          {ROULETTE.map((s, i) => <path key={i} d={slicePath(i)} fill={s.color} stroke="rgba(0,0,0,.25)" strokeWidth="0.4" />)}
          {ROULETTE.map((s, i) => {
            const [tx, ty] = polar(i * SEG + SEG / 2, 30);
            return <text key={"t" + i} x={tx} y={ty} fontSize="3.4" fill="#1a1430" fontWeight="700"
              textAnchor="middle" dominantBaseline="middle"
              transform={`rotate(${i * SEG + SEG / 2} ${tx} ${ty})`}>{SHORT[i]}</text>;
          })}
        </svg>
        <div className="wheel-cap" />
      </div>

      {mg.phase !== "result" && (
        isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgRouletteSpin" })}>Lancer la roue 🎡</button>
          : waiting
      )}

      {mg.phase === "result" && !revealed && <p className="b">La roue tourne… 🎡</p>}

      {mg.phase === "result" && revealed && (
        <>
          <p className="b mb">🎯 {seg.label}</p>
          {!isLauncher ? waiting : seg.needsTarget ? (
            <DesignateLoser players={room.players} label="Pour qui ?"
              onPick={(id) => {
                const target = room.players.find((p) => p.id === id);
                act({ type: "mgFinish", text: `🎡 ${target.name} ${seg.give}` });
              }} />
          ) : (
            <button className="btn btn-primary" disabled={busy}
              onClick={() => act({ type: "mgFinish", text: `🎡 ${launcher.name} ${seg.self}` })}>Terminer le tour</button>
          )}
        </>
      )}
    </div>
  );
}
