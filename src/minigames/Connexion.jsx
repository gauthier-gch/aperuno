import React, { useState } from "react";
import { Ava } from "../components/common.jsx";
import { sipsFor } from "../game/constants.js";

/* « Connexion » : une catégorie simple est affichée. Le décompte et les mots
   se font à l'oral (rien à saisir). Tous ceux qui ont dit le même mot sont
   « connectés » et boivent — le lanceur les désigne puis termine. */
export function ConnexionGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [picked, setPicked] = useState([]); // ids des joueurs connectés

  const toggle = (id) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="center-col">
      <p className="muted">Catégorie</p>
      <div className="apr-logo"><span className="a" style={{ fontSize: 30 }}>{mg.category}</span></div>
      <p className="muted mt mb">
        Au décompte (à l'oral : 3… 2… 1 !), chacun annonce un mot de cette catégorie.
        Ceux qui ont dit le <b className="w">même mot</b> sont connectés et boivent 🔗
      </p>

      {isLauncher ? (
        <>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ type: "mgConnexionReroll" })}>🔁 Changer de mot</button>

          <div className="mt" style={{ width: "100%" }}>
            <p className="muted mb">Qui était connecté ? (touche pour sélectionner)</p>
            <div className="wrap">
              {room.players.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button key={p.id} className={"btn btn-sm auto " + (on ? "btn-gold" : "btn-ghost")}
                    onClick={() => toggle(p.id)}>
                    <Ava p={p} size={20} /> {p.name}{on ? " 🔗" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn btn-primary mt" disabled={busy} onClick={() => {
            const sips = sipsFor(room.mode);
            const names = picked.map((id) => (room.players.find((p) => p.id === id) || {}).name).filter(Boolean).join(", ");
            act(picked.length
              ? { type: "mgFinish", text: `Connexion 🔗 : ${names} ${picked.length > 1 ? "étaient connectés et boivent" : "était connecté et boit"} ${sips} gorgée${sips > 1 ? "s" : ""} 🍻` }
              : { type: "mgFinish", text: "Connexion : personne n'est connecté 🙅", long: false });
          }}>
            {picked.length ? `${picked.length} connecté${picked.length > 1 ? "s" : ""} boivent 🍻` : "Personne n'est connecté — terminer"}
          </button>
        </>
      ) : (
        <p className="muted mt">En attente que {launcher.name} conclue…</p>
      )}
    </div>
  );
}
