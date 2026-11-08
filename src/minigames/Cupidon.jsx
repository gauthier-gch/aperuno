import React from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";

/* Cupidon (Love Season) : chacun choisit secrètement un autre joueur ; les
   choix réciproques forment des couples, qui distribuent 3 gorgées chacun. */
export function CupidonGame({ room, mg, isLauncher, act, busy, waiting }) {
  const byId = Object.fromEntries(room.players.map((p) => [p.id, p]));

  if (mg.phase !== "result") {
    const n = Object.keys(mg.votes || {}).length;
    if (mg.votes && mg.votes[MYID]) {
      const t = byId[mg.votes[MYID]];
      return (
        <div className="center-col">
          <div style={{ fontSize: 50 }}>💘</div>
          <p className="muted">Ta flèche est partie vers <b className="w">{t ? t.name : "…"}</b> 🏹</p>
          <p className="muted">En attente des autres… ({n}/{room.players.length})</p>
        </div>
      );
    }
    return (
      <div className="center-col">
        <div style={{ fontSize: 50 }}>🏹💘</div>
        <p className="muted mb">Choisis <b className="w">en secret</b> la personne de ton choix :</p>
        <div className="wrap" style={{ justifyContent: "center" }}>
          {room.players.filter((p) => p.id !== MYID).map((p) => (
            <button key={p.id} className="btn btn-ghost btn-sm auto cupid-btn" disabled={busy}
              onClick={() => act({ type: "mgCupidVote", targetId: p.id })}>
              <Ava p={p} size={22} /> {p.name}
            </button>
          ))}
        </div>
        <p className="dim mt">{n}/{room.players.length} ont déjà choisi</p>
      </div>
    );
  }

  const couples = (mg.couples || []).filter(([a, b]) => byId[a] && byId[b]);
  const names = couples.map(([a, b]) => `${byId[a].name} & ${byId[b].name}`).join(", ");
  return (
    <div className="center-col pop">
      {mg.partial && <p className="dim mb">Arrêt anticipé : seuls {Object.keys(mg.votes).length}/{room.players.length} joueurs ont choisi.</p>}
      {couples.length ? (
        <>
          <p className="b mb" style={{ fontSize: 18 }}>💞 {couples.length > 1 ? "Les couples" : "Le couple"} de la soirée</p>
          <div className="col-gap" style={{ width: "100%" }}>
            {couples.map(([a, b]) => (
              <div className="panel cupid-couple" key={a + b}>
                <Ava p={byId[a]} size={44} />
                <span className="cupid-heart">💘</span>
                <Ava p={byId[b]} size={44} />
                <div className="muted" style={{ flexBasis: "100%", textAlign: "center" }}>
                  <b className="w">{byId[a].name}</b> & <b className="w">{byId[b].name}</b> distribuent <b className="w">3 gorgées</b> chacun
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 50 }}>💔</div>
          <p className="b">Aucun coup de foudre réciproque…</p>
          <p className="muted mb">Cupidon a raté toutes ses flèches cette fois !</p>
        </>
      )}
      {isLauncher
        ? <button className="btn btn-primary mt" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: couples.length ? `Cupidon 💘 : ${names} distribuent 3 gorgées chacun 🍻` : "Cupidon 💔 : aucun couple cette fois !",
            long: couples.length > 0,
          })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
