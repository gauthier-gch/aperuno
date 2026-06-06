import React, { useState } from "react";
import { DesignateLoser } from "../components/common.jsx";

export function MimeGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [own, setOwn] = useState("");

  /* ---- intro : le lanceur choisit la chose à mimer, puis lance ---- */
  if (mg.phase === "intro") {
    if (!isLauncher) {
      return <div className="center-col"><p className="muted">{launcher.name} choisit la chose à mimer…</p></div>;
    }
    const chosen = own.trim() || mg.word;
    return (
      <div className="center-col">
        <p className="muted mb">Choisis la chose à mimer (suggestion ou la tienne) :</p>
        <div className="panel mb" style={{ width: "100%" }}>
          <b className="apr-serif" style={{ fontSize: 22 }}>{chosen}</b>
        </div>
        <input className="input mb-sm" placeholder="Écris ta propre idée…" value={own}
          onChange={(e) => setOwn(e.target.value)} />
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setOwn(""); act({ type: "mgMimeReroll" }); }}>🔁 Autre suggestion</button>
        <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgMimeStart", word: own.trim() })}>
          Lancer le mime 🎭
        </button>
      </div>
    );
  }

  /* ---- play : tout le monde voit la chose à mimer ---- */
  return (
    <div className="center-col">
      <p className="muted mb">À mimer :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 24 }}>{mg.word}</b>
      </div>
      {isLauncher ? (
        <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })}
          label="Tout le monde a mimé → qui a fait le pire mime ? (il/elle boit)" />
      ) : (
        <p className="muted">Mimez ! En attente que {launcher.name} désigne le pire mime…</p>
      )}
    </div>
  );
}
