import React from "react";
import { DesignateLoser } from "../components/common.jsx";

export function DuelGame({ room, mg, g, isLauncher, launcher, others, act, busy, waiting }) {
  /* étape 1 : choisir qui défier */
  if (mg.phase !== "duel") {
    if (!isLauncher) return waiting;
    return (
      <>
        <p className="muted mb">{launcher.name} défie :</p>
        <div className="wrap">
          {others.map(({ p }) => (
            <button key={p.id} className="btn btn-blue btn-sm auto" disabled={busy} onClick={() => act({ type: "mgDuelPick", oppId: p.id })}>{p.name}</button>
          ))}
        </div>
      </>
    );
  }
  /* étape 2 : désigner le perdant entre les deux duellistes */
  const opp = room.players[mg.oppIdx];
  const duo = [launcher, opp];
  const label = g.drawLoser ? "Qui a perdu le duel ? (il/elle pioche une carte)" : "Qui a perdu le duel ? (il/elle boit)";
  return (
    <div className="center-col">
      <p className="b mb">{launcher.name} 🆚 {opp.name}</p>
      {isLauncher
        ? <DesignateLoser players={duo} onPick={(id) => act({ type: "mgFinish", loserId: id })} label={label} />
        : <p className="muted">En attente du résultat désigné par {launcher.name}…</p>}
    </div>
  );
}
