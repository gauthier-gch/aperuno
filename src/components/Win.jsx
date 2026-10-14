import React from "react";
import { MYID } from "../me.js";
import { Ava, DesignateLoser } from "./common.jsx";

/* Récap de la manche : gorgées, shots et culs secs bus par joueur (non loggé),
   du plus assoiffé au plus sobre. Équivalences pour le classement :
   1 cul sec = 15 gorgées, 1 shot = 5 gorgées. */
const SEC_SIPS = 15, SHOT_SIPS = 5;
function DrinksBoard({ room }) {
  const drinks = room.drinks || {};
  const rows = room.players
    .map((p) => {
      const d = { sips: 0, secs: 0, shots: 0, ...drinks[p.id] };
      return { p, ...d, score: d.sips + d.secs * SEC_SIPS + d.shots * SHOT_SIPS };
    })
    .sort((a, b) => b.score - a.score);
  const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  return (
    <div className="panel mb" style={{ width: "100%", maxWidth: 340 }}>
      <p className="b mb" style={{ textAlign: "center" }}>🍻 Qui a le plus bu ?*</p>
      <div className="pb-table" style={{ marginBottom: 8 }}>
        {rows.map(({ p, sips, secs, shots, score }, i) => (
          <div className="pb-row space" key={p.id}>
            <b style={{ margin: 0 }}>{i === 0 && score ? "🥇 " : `${i + 1}. `}{p.name}</b>
            <span className="muted" style={{ textAlign: "right" }}>
              {plural(sips, "gorgée", "gorgées")} · {plural(shots, "shot", "shots")} · {plural(secs, "cul sec", "culs secs")}
            </span>
          </div>
        ))}
      </div>
      <p className="dim" style={{ fontSize: 12, textAlign: "center" }}>
        Classement : 1 cul sec = {SEC_SIPS} gorgées, 1 shot = {SHOT_SIPS} gorgées.<br />
        * Certains mini-jeux se terminent hors app : ils ne permettent donc pas d'attribuer les gorgées aux joueurs qui les ont bues.
      </p>
    </div>
  );
}

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

      <DrinksBoard room={room} />

      {isHost
        ? <button className="btn btn-primary" style={{ maxWidth: 260 }} disabled={busy} onClick={() => onReplay(Math.max(0, winnerIdx))}>Nouvelle manche</button>
        : <p className="muted">En attente de l'hôte pour rejouer…</p>}
      <button className="btn btn-ghost mt" style={{ maxWidth: 260 }} onClick={leave}>Quitter</button>
    </div>
  );
}
