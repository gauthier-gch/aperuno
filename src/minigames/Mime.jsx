import React, { useState } from "react";
import { DesignateLoser } from "../components/common.jsx";

export function MimeGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [own, setOwn] = useState("");
  if (!isLauncher) {
    return (
      <div className="center-col">
        <p className="muted">{launcher.name} choisit un mot à mimer…</p>
        <p className="muted dim">Préparez-vous à mimer, puis {launcher.name} désignera le pire.</p>
      </div>
    );
  }
  const toMime = own.trim() || mg.word;
  return (
    <div className="center-col">
      <p className="muted mb">À mimer (visible par toi seul) :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 22 }}>{toMime}</b>
      </div>
      <input className="input mb-sm" placeholder="Écris ton propre mot / situation…" value={own}
        onChange={(e) => setOwn(e.target.value)} />
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setOwn(""); act({ type: "mgMimeReroll" }); }}>🔁 Suggérer une autre idée</button>
      <div className="mt" style={{ width: "100%" }}>
        <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })}
          label="Tout le monde a mimé → qui a fait le pire mime ? (il/elle boit)" />
      </div>
    </div>
  );
}
