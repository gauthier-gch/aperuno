import React, { useEffect, useState } from "react";
import { MYID } from "../me.js";

/* « Connexion » : une catégorie est tirée, au décompte chacun écrit un mot.
   Tous ceux qui ont écrit le même mot sont « connectés » et boivent. */
export function ConnexionGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [word, setWord] = useState("");
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(i);
  }, []);

  const submitted = !!(mg.words && mg.words[MYID]);
  const count = mg.words ? Object.keys(mg.words).length : 0;

  /* ---- intro : le lanceur peut changer la catégorie puis lance ---- */
  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <p className="muted">Catégorie</p>
        <div className="apr-logo"><span className="a" style={{ fontSize: 30 }}>{mg.category}</span></div>
        {isLauncher ? (
          <>
            <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={() => act({ type: "mgConnexionReroll" })}>🔁 Changer la catégorie</button>
            <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgConnexionStart" })}>Lancer le décompte ⚡</button>
          </>
        ) : <p className="muted">En attente que {launcher.name} lance…</p>}
      </div>
    );
  }

  /* ---- révélation : qui est connecté ? ---- */
  if (mg.phase === "reveal") {
    const connected = mg.connectedIds || [];
    const someConnected = connected.length > 0;
    return (
      <div className="pop">
        <p className="muted mb">Catégorie : <b className="w">{mg.category}</b>. Les mots :</p>
        <div className="pb-table" style={{ width: "100%" }}>
          {room.players.map((p) => {
            const w = mg.words && mg.words[p.id];
            const isConnected = connected.includes(p.id);
            return (
              <div className="pb-row space" key={p.id}
                style={isConnected ? { borderLeft: "3px solid var(--gold)" } : undefined}>
                <b>{p.name}</b>
                <span className="muted">{w ? w.raw : "—"}{isConnected ? " 🔗 boit" : ""}</span>
              </div>
            );
          })}
        </div>
        <p className={someConnected ? "b center mb" : "muted center mb"}>
          {someConnected ? "🔗 Les joueurs connectés boivent ! 🍻" : "Personne n'est connecté — personne ne boit 🙅"}
        </p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({
              type: "mgFinish",
              loserIds: connected,
              text: someConnected ? undefined : "Connexion : personne n'est connecté 🙅",
              long: someConnected ? undefined : false,
            })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  /* ---- jeu : compte à rebours puis saisie du mot ---- */
  const notStarted = mg.startsAt && Date.now() < mg.startsAt;
  if (notStarted) {
    const go = Math.ceil((mg.startsAt - Date.now()) / 1000);
    return (
      <div className="center-col">
        <p className="muted">Catégorie : <b className="w">{mg.category}</b></p>
        <p className="muted">Prêt ?</p>
        <div className="big-num">{go}</div>
      </div>
    );
  }

  return (
    <div className="center-col">
      <p className="muted mb">Un mot pour : <b className="w">{mg.category}</b></p>
      {submitted ? (
        <p className="muted center">✅ Mot envoyé : <b className="w">{mg.words[MYID].raw}</b>. En attente des autres… ({count}/{room.players.length})</p>
      ) : (
        <div style={{ width: "100%" }}>
          <input className="input mb" placeholder="Ton mot…" value={word} maxLength={24}
            autoFocus onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && word.trim() && !busy) act({ type: "mgConnexionWord", word }); }} />
          <button className="btn btn-blue" disabled={busy || !word.trim()} onClick={() => act({ type: "mgConnexionWord", word })}>Valider mon mot 🔗</button>
        </div>
      )}
      {isLauncher && (
        <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={() => act({ type: "mgConnexionReveal" })}>
          Révéler maintenant ({count}/{room.players.length})
        </button>
      )}
    </div>
  );
}
