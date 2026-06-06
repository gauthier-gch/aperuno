import React from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";

export function VoteGame({ room, mg, isLauncher, act, busy, waiting }) {
  if (mg.phase !== "result") {
    if (mg.votes && mg.votes[MYID]) {
      return (
        <div className="center-col">
          <p className="muted">✅ Vote enregistré. En attente des autres… ({Object.keys(mg.votes).length}/{room.players.length})</p>
        </div>
      );
    }
    return (
      <div>
        <p className="muted mb">Vote en secret pour celui qui perd (tu peux voter pour toi) :</p>
        <div className="wrap">
          {room.players.map((p) => (
            <button key={p.id} className="btn btn-ghost btn-sm auto" disabled={busy} onClick={() => act({ type: "mgVote", targetId: p.id })}>
              <Ava p={p} size={20} /> {p.name}{p.id === MYID ? " (moi)" : ""}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const loser = room.players.find((p) => p.id === mg.loserId);
  return (
    <div className="pop center">
      <p className="b mb">🏆 Le plus voté : {loser.name} — il/elle boit !</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: mg.loserId })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
