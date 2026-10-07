import React from "react";
import { DesignateLoser } from "../components/common.jsx";
import { PromptChooser } from "./PromptChooser.jsx";

export function CategorieGame({ room, mg, isLauncher, launcher, act, busy }) {
  /* ---- intro : le lanceur choisit la catégorie (suggestion ou la sienne) ---- */
  if (mg.phase === "intro") {
    return <PromptChooser mg={mg} isLauncher={isLauncher} launcher={launcher} act={act} busy={busy}
      what="la catégorie" placeholder="Écris ta propre catégorie…" startLabel="Lancer la catégorie 🗂️" />;
  }

  /* ---- play : tout le monde voit la catégorie, on joue à l'oral ---- */
  return (
    <div className="center-col">
      <p className="muted mb">Catégorie :</p>
      <div className="panel mb" style={{ width: "100%" }}>
        <b className="apr-serif" style={{ fontSize: 24 }}>{mg.word}</b>
      </div>
      <p className="muted mb">À tour de rôle, citez un élément sans répéter. Le premier qui sèche perd !</p>
      {isLauncher ? (
        <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })}
          label="Qui a séché ? (il/elle boit)" />
      ) : (
        <p className="muted">En attente que {launcher.name} désigne le perdant…</p>
      )}
    </div>
  );
}
