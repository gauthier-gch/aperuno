import React, { useState } from "react";
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

/* Ligne graduée de 1 à 9 : on fait glisser le curseur pour placer sa note. */
function GradedLine({ value, onChange }) {
  return (
    <div className="dix-scale">
      <input type="range" min="1" max="9" step="1" value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <div className="dix-ticks">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={i + 1 === value ? "on" : ""} onClick={() => onChange(i + 1)}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

export function DixGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const myGuess = mg.guesses ? mg.guesses[MYID] : undefined;
  const [note, setNote] = useState(5);
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
        {/* changement discret : seul le lanceur voit ce bouton, aucune annonce */}
        {!Object.keys(mg.guesses || {}).length && (
          <button className="btn btn-ghost btn-sm auto dim mt" disabled={busy} onClick={() => act({ type: "mgDixReroll" })}>🔁 Autre carte</button>
        )}
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
      <p className="muted mb">Écoute le « c'est un 10 mais… » puis place ta note de 1 à 9 :</p>
      <div className="big-num">{note}</div>
      <GradedLine value={note} onChange={setNote} />
      <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgDixGuess", value: note })}>Valider ma note</button>
    </div>
  );
}
