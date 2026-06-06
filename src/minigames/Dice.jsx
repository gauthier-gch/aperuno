import React from "react";
import { MYID } from "../me.js";

const SHOW = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateY(180deg)",
  3: "rotateY(-90deg)",
  4: "rotateY(90deg)",
  5: "rotateX(-90deg)",
  6: "rotateX(90deg)",
};
const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const FACE_CLASS = ["", "f1", "f2", "f3", "f4", "f5", "f6"];

function Face({ n }) {
  return (
    <div className={"face " + FACE_CLASS[n]}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i}>{PIPS[n].includes(i) ? <span className="pip" /> : null}</span>
      ))}
    </div>
  );
}

function Cube({ value }) {
  const rolling = !value;
  const style = value ? { transform: SHOW[value] } : undefined;
  return (
    <div className="scene">
      <div className={"cube" + (rolling ? " rolling" : "")} style={style}>
        {[1, 2, 3, 4, 5, 6].map((n) => <Face key={n} n={n} />)}
      </div>
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
        <div className="dice-col"><Cube value={mg.d1} /><p className="muted">{launcher.name}</p></div>
        <div className="dice-col"><Cube value={mg.d2} /><p className="muted">{oppName}</p></div>
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
