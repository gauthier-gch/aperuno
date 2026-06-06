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
  const losers = (mg.loserIds || []).map((id) => room.players.find((p) => p.id === id)).filter(Boolean);
  const names = losers.map((p) => p.name).join(", ");
  const many = losers.length > 1;
  return (
    <div className="pop center">
      <p className="b mb">🏆 {many ? "Égalité ! " : ""}{names} {many ? "boivent" : "boit"} !</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserIds: mg.loserIds })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
