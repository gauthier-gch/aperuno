import React, { useState } from "react";

export function Shell({ children, timers }) {
  const active = (timers || []).filter((t) => t.endsAt > Date.now());
  return (
    <div className="apr-root">
      <div className="apr-app">
        {active.length > 0 && (
          <div className="chrono-bar">
            {active.map((t) => {
              const left = Math.max(0, t.endsAt - Date.now());
              const m = Math.floor(left / 60000);
              const s = Math.floor((left % 60000) / 1000);
              return (
                <div className="one" key={t.id}>
                  <span>⏳ {t.label}</span>
                  <span className="t">{m}:{String(s).padStart(2, "0")}</span>
                </div>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Ava({ p, size = 40, online }) {
  const st = { width: size, height: size, fontSize: size * 0.42 };
  const off = online === false;
  if (p && p.photo) return <img className={"avatar" + (off ? " off" : "")} style={st} src={p.photo} alt="" />;
  return (
    <div className={"avatar" + (off ? " off" : "")} style={st}>
      {(p && p.name && p.name[0] && p.name[0].toUpperCase()) || "?"}
    </div>
  );
}

export function Overlay({ children }) {
  return (
    <div className="overlay">
      <div className="sheet pop">{children}</div>
    </div>
  );
}

/* Échappatoire universelle si un joueur (ou le lanceur lui-même) a quitté la
   pièce et bloque un mini-jeu : n'importe qui peut désigner le perdant ou
   simplement terminer le jeu sans perdant. */
export function ManualEscape({ players, onPick, onClose }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return <button className="btn btn-ghost btn-sm mt" onClick={() => setOpen(true)}>⚠️ Un joueur absent bloque le jeu ?</button>;
  return (
    <div className="mt">
      <DesignateLoser players={players} onPick={onPick} label="Débloquer — désigner le perdant (il/elle boit) :" />
      {onClose && <button className="btn btn-ghost btn-sm mt" onClick={onClose}>Terminer sans perdant ⏭️</button>}
      <button className="btn btn-ghost btn-sm mt" onClick={() => setOpen(false)}>Annuler</button>
    </div>
  );
}

/* Boutons de désignation d'un joueur (perdant / cible). */
export function DesignateLoser({ players, onPick, label, exclude }) {
  return (
    <div>
      <p className="muted mb">{label}</p>
      <div className="wrap">
        {players.filter((p) => p.id !== exclude).map((p) => (
          <button key={p.id} className="btn btn-gold btn-sm auto" onClick={() => onPick(p.id)}>
            <Ava p={p} size={20} /> {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
