import React from "react";
import { DesignateLoser } from "../components/common.jsx";
import { PromptChooser } from "./PromptChooser.jsx";

export function MimeGame({ room, mg, isLauncher, launcher, act, busy }) {
  /* ---- intro : le lanceur choisit la chose à mimer, puis lance ---- */
  if (mg.phase === "intro") {
    return <PromptChooser mg={mg} isLauncher={isLauncher} launcher={launcher} act={act} busy={busy}
      what="la chose à mimer" placeholder="Écris ta propre idée…" startLabel="Lancer le mime 🎭" />;
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
