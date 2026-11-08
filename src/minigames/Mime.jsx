import React, { useState } from "react";
import { Ava } from "../components/common.jsx";
import { sipsFor } from "../game/constants.js";
import { PromptChooser } from "./PromptChooser.jsx";

export function MimeGame({ room, mg, isLauncher, launcher, act, busy }) {
  const [best, setBest] = useState(null);

  /* ---- intro : le lanceur choisit la chose à mimer, puis lance ---- */
  if (mg.phase === "intro") {
    return <PromptChooser mg={mg} isLauncher={isLauncher} launcher={launcher} act={act} busy={busy}
      what="la chose à mimer" placeholder="Écris ta propre idée…" startLabel="Lancer le mime 🎭" />;
  }

  const n = sipsFor(room.mode, room.premium);
  const pick = (list, onPick) => (
    <div className="wrap" style={{ justifyContent: "center" }}>
      {list.map((p) => (
        <button key={p.id} className="btn btn-gold btn-sm auto" disabled={busy} onClick={() => onPick(p.id)}>
          <Ava p={p} size={20} /> {p.name}
        </button>
      ))}
    </div>
  );

  /* ---- play : tout le monde voit la chose à mimer ---- */
  return (
    <div className="center-col">
      <p className="muted mb">À mimer :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 24 }}>{mg.word}</b>
      </div>
      {!isLauncher ? (
        <p className="muted">Mimez ! En attente que {launcher.name} désigne le meilleur et le pire mime…</p>
      ) : best == null ? (
        <>
          <p className="muted mb">🏆 Tout le monde a mimé → qui a fait le <b>meilleur mime</b> ? <span className="dim">(distribue 3 gorgées)</span></p>
          {pick(room.players, setBest)}
        </>
      ) : (
        <>
          <p className="muted mb">🙈 Et le <b>pire mime</b> ? <span className="dim">(boit {n} gorgée{n > 1 ? "s" : ""})</span></p>
          {pick(room.players.filter((p) => p.id !== best), (id) => act({ type: "mgMimeVerdict", bestId: best, worstId: id }))}
          <button className="btn btn-ghost btn-sm mt" onClick={() => setBest(null)}>← Changer le meilleur mime</button>
        </>
      )}
    </div>
  );
}
