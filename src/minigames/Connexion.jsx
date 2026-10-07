import React from "react";
import { sipsFor } from "../game/constants.js";

/* « Connexion » : une catégorie simple est affichée. Le décompte et les mots
   se font à l'oral (rien à saisir). Tous ceux qui ont dit le même mot sont
   « connectés » et boivent — le lanceur termine simplement le jeu. */
export function ConnexionGame({ room, mg, isLauncher, launcher, act, busy }) {
  const sips = sipsFor(room.mode, room.premium);
  return (
    <div className="center-col">
      <p className="muted">Catégorie</p>
      <div className="apr-logo"><span className="a" style={{ fontSize: 30 }}>{mg.category}</span></div>
      <p className="muted mt mb">
        Au décompte (à l'oral : 3… 2… 1 !), chacun annonce un mot de cette catégorie.
        Ceux qui ont dit le <b className="w">même mot</b> sont connectés et boivent {sips} gorgée{sips > 1 ? "s" : ""} 🔗
      </p>

      {isLauncher ? (
        <>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ type: "mgConnexionReroll" })}>🔁 Changer de catégorie</button>
          <button className="btn btn-primary mt" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: `Connexion 🔗 : les joueurs connectés boivent ${sips} gorgée${sips > 1 ? "s" : ""} 🍻`,
          })}>Terminer le jeu</button>
        </>
      ) : (
        <p className="muted mt">En attente que {launcher.name} termine…</p>
      )}
    </div>
  );
}
