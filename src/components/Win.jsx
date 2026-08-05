import React from "react";
import { MYID } from "../me.js";
import { Ava, DesignateLoser } from "./common.jsx";

export function Win({ room, onReplay, leave, act, busy }) {
  const w = room.players.find((p) => p.id === room.winnerId) || room.players[0];
  const isHost = room.hostId === MYID;
  const isWinner = room.winnerId === MYID;
  const winnerIdx = room.players.findIndex((p) => p.id === room.winnerId);
  const secTarget = room.secTarget ? room.players.find((p) => p.id === room.secTarget) : null;

  return (
    <div className="fade center-col" style={{ minHeight: "80dvh" }}>
      <div style={{ fontSize: 60 }}>🏆</div>
      <Ava p={w} size={92} />
      <h2 className="h-title mt">{w.name} gagne !</h2>
      <p className="muted mb">Plus aucune carte en main. Santé 🥂</p>

      {/* Le gagnant distribue un cul sec au joueur de son choix. */}
      {secTarget ? (
        <div className="panel mb" style={{ maxWidth: 320, textAlign: "center" }}>
          <p className="muted">🥃 <b className="w">{w.name}</b> offre un cul sec à <b className="w">{secTarget.name}</b> !</p>
        </div>
      ) : isWinner ? (
        <div className="panel mb" style={{ maxWidth: 320 }}>
          <DesignateLoser
            players={room.players}
            exclude={MYID}
            onPick={(id) => act && act({ type: "winnerSec", targetId: id })}
            label="🥃 Tu as gagné ! À qui offres-tu un cul sec ?"
          />
        </div>
      ) : (
        <p className="muted mb">🥃 {w.name} choisit à qui offrir un cul sec…</p>
      )}

      {isHost
        ? <button className="btn btn-primary" style={{ maxWidth: 260 }} disabled={busy} onClick={() => onReplay(Math.max(0, winnerIdx))}>Nouvelle manche</button>
        : <p className="muted">En attente de l'hôte pour rejouer…</p>}
      <button className="btn btn-ghost mt" style={{ maxWidth: 260 }} onClick={leave}>Quitter</button>
    </div>
  );
}
