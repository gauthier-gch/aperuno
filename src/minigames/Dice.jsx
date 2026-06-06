import React, { useEffect, useState } from "react";
import { MYID } from "../me.js";

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, rolling }) {
  // Pendant le lancer, on fait défiler des faces aléatoires pour l'effet.
  const [shown, setShown] = useState(value || 1);
  useEffect(() => {
    if (rolling) {
      const i = setInterval(() => setShown(1 + Math.floor(Math.random() * 6)), 90);
      return () => clearInterval(i);
    }
    if (value) setShown(value);
  }, [rolling, value]);
  const face = PIPS[shown] || PIPS[1];
  return (
    <div className={"die" + (rolling ? " rolling" : "")}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span className="cell" key={i}>{face.includes(i) ? <span className="pip" /> : null}</span>
      ))}
    </div>
  );
}

export function DiceGame({ room, mg, isLauncher, launcher, others, act, busy, waiting }) {
  const oppName = mg.oppIdx != null ? room.players[mg.oppIdx].name : "";
  const iAmOpp = mg.oppIdx != null && room.players[mg.oppIdx].id === MYID;

  if (mg.phase === "intro") {
    if (!isLauncher) return waiting;
    return (
      <>
        <p className="muted mb">{launcher.name} défie :</p>
        <div className="wrap">
          {others.map(({ p }) => (
            <button key={p.id} className="btn btn-blue btn-sm auto" disabled={busy} onClick={() => act({ type: "mgDicePick", oppId: p.id })}>{p.name}</button>
          ))}
        </div>
      </>
    );
  }

  const loser = mg.phase === "result" ? (mg.d1 < mg.d2 ? launcher : room.players[mg.oppIdx]) : null;
  const diff = mg.phase === "result" ? Math.abs(mg.d1 - mg.d2) : 0;

  return (
    <div className="center">
      <div className="dice-row">
        <div className="dice-col"><Die value={mg.d1} rolling={mg.phase === "roll" && !mg.d1} /><p className="muted">{launcher.name}</p></div>
        <div className="dice-col"><Die value={mg.d2} rolling={mg.phase === "roll" && !mg.d2} /><p className="muted">{oppName}</p></div>
      </div>
      {mg.phase === "roll" && (
        <>
          {isLauncher && !mg.d1 && <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgDiceRoll" })}>Lance ton dé 🎲</button>}
          {iAmOpp && !mg.d2 && <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgDiceRoll" })}>Lance ton dé 🎲</button>}
          {((isLauncher && mg.d1) || (iAmOpp && mg.d2) || (!isLauncher && !iAmOpp)) && (
            <p className="muted">{mg.tie ? "Égalité ! On relance… " : ""}En attente des lancers…</p>
          )}
        </>
      )}
      {mg.phase === "result" && (
        <>
          <p className="b mb">{loser.name} a le plus bas → boit {diff} gorgée{diff > 1 ? "s" : ""} 🍻</p>
          {isLauncher ? (
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: loser.id, sips: diff })}>Terminer le tour</button>
          ) : waiting}
        </>
      )}
    </div>
  );
}
