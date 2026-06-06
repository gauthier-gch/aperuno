import React from "react";
import { MYID } from "../me.js";
import { Ava } from "./common.jsx";

export function Win({ room, onReplay, leave }) {
  const w = room.players.find((p) => p.id === room.winnerId) || room.players[0];
  const isHost = room.hostId === MYID;
  const winnerIdx = room.players.findIndex((p) => p.id === room.winnerId);
  return (
    <div className="fade center-col" style={{ minHeight: "80dvh" }}>
      <div style={{ fontSize: 60 }}>🏆</div>
      <Ava p={w} size={92} />
      <h2 className="h-title mt">{w.name} gagne !</h2>
      <p className="muted mb">Plus aucune carte en main. Santé 🥂</p>
      {isHost
        ? <button className="btn btn-primary" style={{ maxWidth: 260 }} onClick={() => onReplay(Math.max(0, winnerIdx))}>Nouvelle manche</button>
        : <p className="muted">En attente de l'hôte pour rejouer…</p>}
      <button className="btn btn-ghost mt" style={{ maxWidth: 260 }} onClick={leave}>Quitter</button>
    </div>
  );
}
