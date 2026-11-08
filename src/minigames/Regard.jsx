import React from "react";

/* Le regard : pas de décompte dans l'appli, le lanceur le fait à voix haute. */
export function RegardGame({ isLauncher, launcher, act, busy, waiting }) {
  return (
    <div className="pop center">
      <div className="apr-logo"><span className="a" style={{ fontSize: 60 }}>👀</span></div>
      <p className="b mb">
        {isLauncher ? "Fais le décompte à voix haute : 3, 2, 1… top !" : `${launcher.name} fait le décompte à voix haute : 3, 2, 1… top !`}
      </p>
      <p className="muted mb">Les joueurs qui se sont regardés boivent une gorgée !</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "👀 Les regards croisés boivent 🍻" })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
