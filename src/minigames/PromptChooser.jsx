import React, { useState } from "react";

/* Étape « intro » commune au mime, à la catégorie et au vote secret : le
   lanceur voit une suggestion, peut en demander une autre ou écrire la sienne,
   puis lance le jeu (le texte devient alors visible par tous). */
export function PromptChooser({ mg, isLauncher, launcher, act, busy, what, placeholder, startLabel }) {
  const [own, setOwn] = useState("");
  if (!isLauncher) {
    return <div className="center-col"><p className="muted">{launcher.name} choisit {what}…</p></div>;
  }
  const chosen = own.trim() || mg.word;
  return (
    <div className="center-col">
      <p className="muted mb">Choisis {what} (suggestion ou la tienne) :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 22 }}>{chosen}</b>
      </div>
      <input className="input mb-sm" placeholder={placeholder} value={own} maxLength={140}
        onChange={(e) => setOwn(e.target.value)} />
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setOwn(""); act({ type: "mgPromptReroll" }); }}>🔁 Autre suggestion</button>
      <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgPromptStart", word: own.trim() })}>
        {startLabel}
      </button>
    </div>
  );
}
