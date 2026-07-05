import React, { useEffect, useRef, useState } from "react";
import { MYID } from "../me.js";
import { PETITBAC_CATS } from "../game/constants.js";
import { DesignateLoser } from "../components/common.jsx";

export function PetitBacGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [answers, setAnswers] = useState({});
  const [, force] = useState(0);
  const autoSent = useRef(false);

  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(i);
  }, []);

  const submitted = !!(mg.answers && mg.answers[MYID]);

  // Auto-envoi des réponses (même non validées) dès qu'un joueur a validé OU à
  // la fin du chrono → les réponses de tout le monde sont visibles.
  const timeOver = mg.endsAt && Date.now() > mg.endsAt;
  useEffect(() => {
    if (!submitted && !autoSent.current && (mg.phase === "reveal" || (mg.phase === "play" && timeOver))) {
      autoSent.current = true;
      act({ type: "mgAnswer", answers });
    }
  });

  /* ---- intro : changer la lettre puis démarrer ---- */
  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <div className="apr-logo"><span className="a" style={{ fontSize: 54 }}>{mg.letter}</span></div>
        {isLauncher ? (
          <>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ type: "mgPbReroll" })}>🔁 Changer la lettre</button>
            <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgPbStart" })}>Démarrer le petit bac ⏱️</button>
          </>
        ) : <p className="muted">En attente que {launcher.name} démarre…</p>}
      </div>
    );
  }

  /* ---- révélation ---- */
  const timeUp = mg.endsAt && Date.now() > mg.endsAt;
  if (mg.phase === "reveal" || (mg.phase === "play" && timeUp)) {
    if (mg.phase !== "reveal") {
      return (
        <div className="center-col">
          <div className="apr-logo"><span className="a" style={{ fontSize: 54 }}>{mg.letter}</span></div>
          <p className="muted mt">Temps écoulé !</p>
          {isLauncher
            ? <button className="btn btn-primary mt" disabled={busy} onClick={() => act({ type: "mgReveal" })}>Voir les réponses</button>
            : waiting}
        </div>
      );
    }
    return (
      <div className="pop">
        <p className="muted mb">Lettre : <b className="w">{mg.letter}</b>. Réponses :</p>
        <div className="pb-scroll">
          <table className="pb-grid">
            <thead>
              <tr>
                <th>Joueur</th>
                {PETITBAC_CATS.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {room.players.map((p) => (
                <tr key={p.id}>
                  <th>{p.name}{!mg.answers[p.id] ? " *" : ""}</th>
                  {PETITBAC_CATS.map((c) => (
                    <td key={c}>{(mg.answers[p.id] && mg.answers[p.id][c]) ? mg.answers[p.id][c] : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dim mb">* n'a pas validé (réponses en cours)</p>
        {isLauncher
          ? <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })} label="Qui a perdu ? (il/elle boit)" />
          : <p className="muted center mt">En attente de {launcher.name}…</p>}
      </div>
    );
  }

  /* ---- jeu : compte à rebours synchronisé ---- */
  const notStarted = mg.startsAt && Date.now() < mg.startsAt;
  if (notStarted) {
    const go = Math.ceil((mg.startsAt - Date.now()) / 1000);
    return (
      <div className="center-col">
        <p className="muted">Prêt ?</p>
        <div className="big-num">{go}</div>
      </div>
    );
  }
  const left = Math.max(0, Math.ceil((mg.endsAt - Date.now()) / 1000));
  return (
    <div>
      <div className="center">
        <div className="apr-logo"><span className="a" style={{ fontSize: 48 }}>{mg.letter}</span></div>
        <p className="b">⏱️ {left}s</p>
      </div>
      {submitted
        ? <p className="muted center mt">✅ Réponses envoyées. En attente du chrono…</p>
        : (
          <>
            {PETITBAC_CATS.map((c) => (
              <input key={c} className="input mb-sm" placeholder={c} value={answers[c] || ""}
                onChange={(e) => setAnswers({ ...answers, [c]: e.target.value })} />
            ))}
            <button className="btn btn-blue" disabled={busy} onClick={() => act({ type: "mgAnswer", answers })}>Valider mes réponses</button>
          </>
        )}
    </div>
  );
}
