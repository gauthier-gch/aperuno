import React from "react";
import { DesignateLoser } from "../components/common.jsx";

export function MimeGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  if (!isLauncher) {
    return (
      <div className="center-col">
        <p className="muted">{launcher.name} choisit un mot à mimer…</p>
        <p className="muted dim">Préparez-vous à mimer, puis {launcher.name} désignera le pire.</p>
      </div>
    );
  }
  return (
    <div className="center-col">
      <p className="muted mb">À mimer (visible par toi seul) :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 22 }}>{mg.word}</b>
      </div>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ type: "mgMimeReroll" })}>🔁 Autre mot</button>
      <div className="mt" style={{ width: "100%" }}>
        <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })}
          label="Tout le monde a mimé → qui a fait le pire mime ? (il/elle boit)" />
      </div>
    </div>
  );
}
