import React from "react";
import { MYID } from "../me.js";

function PlayCard({ value, suit, red }) {
  const col = red ? "#e11d48" : "#15102c";
  return (
    <div className="playcard" style={{ color: col }}>
      <span className="pc-corner tl">{value}<br />{suit}</span>
      <span className="pc-mid">{suit}</span>
      <span className="pc-corner br">{value}<br />{suit}</span>
    </div>
  );
}

export function DixGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const myGuess = mg.guesses ? mg.guesses[MYID] : undefined;
  const guessers = room.players.filter((p) => p.id !== launcher.id);

  if (mg.phase === "reveal") {
    const launcherSips = mg.launcherSips || 0;
    return (
      <div className="center-col">
        <PlayCard value={mg.value} suit={mg.suit} red={mg.red} />
        <p className="muted mt mb">Chacun boit l'écart entre sa note et la carte :</p>
        <div className="pb-table" style={{ width: "100%" }}>
          {guessers.map((p) => {
            const gv = mg.guesses[p.id];
            const ecart = gv != null ? Math.abs(gv - mg.value) : null;
            return (
              <div className="pb-row space" key={p.id}>
                <b>{p.name}</b>
                <span className="muted">{gv != null ? `a dit ${gv} → boit ${ecart} 🍻` : "pas de note"}</span>
              </div>
            );
          })}
          <div className="pb-row space" style={{ borderTop: "1px solid rgba(255,255,255,.15)" }}>
            <b>{launcher.name} <span className="dim">(lanceur)</span></b>
            <span className="muted">boit la moyenne des écarts → {launcherSips} 🍻</span>
          </div>
        </div>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: `« C'est un 10 mais » : ${launcher.name} boit ${launcherSips} gorgée${launcherSips > 1 ? "s" : ""} (moyenne des écarts) 🍻` })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  /* phase guess */
  if (isLauncher) {
    return (
      <div className="center-col">
        <p className="muted mb">Ta carte (garde-la secrète !) — lance ton « c'est un 10 mais… » 🎤</p>
        <PlayCard value={mg.value} suit={mg.suit} red={mg.red} />
        <p className="muted mt">{Object.keys(mg.guesses || {}).length}/{guessers.length} joueurs ont noté</p>
        <button className="btn btn-primary mt" disabled={busy} onClick={() => act({ type: "mgDixReveal" })}>Montrer la carte 👀</button>
      </div>
    );
  }
  if (myGuess != null) {
    return <div className="center-col"><p className="muted">✅ Ta note : <b className="w">{myGuess}</b>. En attente du dévoilement…</p></div>;
  }
  return (
    <div className="center-col">
      <p className="muted mb">Écoute le « c'est un 10 mais… » puis donne ta note de 1 à 10 :</p>
      <div className="wrap" style={{ justifyContent: "center" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <button key={i} className="btn btn-blue btn-sm auto" disabled={busy} onClick={() => act({ type: "mgDixGuess", value: i + 1 })}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}
