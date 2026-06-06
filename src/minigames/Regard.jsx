import React, { useEffect, useState } from "react";

export function RegardGame({ mg, isLauncher, act, busy, waiting }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!mg.endsAt) return;
    const i = setInterval(() => force((x) => x + 1), 200);
    return () => clearInterval(i);
  }, [mg.endsAt]);

  if (mg.phase === "intro") {
    if (!isLauncher) return waiting;
    return (
      <div className="center-col">
        <p className="muted mb">Tout le monde fixe la table. Au top, levez les yeux.</p>
        <button className="btn btn-blue" disabled={busy} onClick={() => act({ type: "mgRegardCount" })}>Lancer le décompte ⏱️</button>
      </div>
    );
  }
  const left = Math.ceil((mg.endsAt - Date.now()) / 1000);
  if (left > 0) return <div className="center-col"><div className="big-num">{left}</div></div>;
  return (
    <div className="pop center">
      <div className="apr-logo"><span className="a" style={{ fontSize: 60 }}>👀</span></div>
      <p className="b mb">Les joueurs qui se sont regardés boivent une gorgée !</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "👀 Les regards croisés boivent 🍻" })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
