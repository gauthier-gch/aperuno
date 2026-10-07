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

/* Poire / ville : au lieu de désigner un perdant à l'aveugle, on arrête la
   manche et on affiche les résultats de ceux qui ont déjà joué. */
export function PartialEscape({ mg, room, onStop }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return <button className="btn btn-ghost btn-sm mt" onClick={() => setOpen(true)}>⚠️ Un joueur absent bloque le jeu ?</button>;
  const done = Object.keys((mg.kind === "inapp_pear" ? mg.cuts : mg.marks) || {}).length;
  return (
    <div className="mt center-col">
      <p className="muted mb">{done}/{room.players.length} joueurs ont joué. Le perdant sera désigné parmi eux.</p>
      <button className="btn btn-gold btn-sm" disabled={!done} onClick={() => { setOpen(false); onStop(); }}>
        Arrêter avec les joueurs qui ont joué ⏭️
      </button>
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

/* Texte de règle légèrement mis en forme (mini-syntaxe façon Markdown) :
   **gras**, *italique*, __souligné__, saut de ligne avec \n, ligne vide =
   nouveau paragraphe, lignes commençant par « - » = liste à puces. */
function inline(s) {
  return s.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g).map((t, i) => {
    if (t.startsWith("**") && t.endsWith("**") && t.length > 4) return <b key={i} className="w">{t.slice(2, -2)}</b>;
    if (t.startsWith("__") && t.endsWith("__") && t.length > 4) return <u key={i}>{t.slice(2, -2)}</u>;
    if (t.startsWith("*") && t.endsWith("*") && t.length > 2) return <i key={i}>{t.slice(1, -1)}</i>;
    return t;
  });
}

export function RichText({ text, className = "" }) {
  const blocks = [];
  String(text || "").split("\n").forEach((line) => {
    const last = blocks[blocks.length - 1];
    if (/^\s*[-•]\s+/.test(line)) {
      const item = line.replace(/^\s*[-•]\s+/, "");
      if (last && last.type === "ul") last.items.push(item);
      else blocks.push({ type: "ul", items: [item] });
    } else if (!line.trim()) {
      blocks.push({ type: "gap" });
    } else if (last && last.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  });
  return (
    <div className={"rich " + className}>
      {blocks.map((b, i) => {
        if (b.type === "ul") return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
        if (b.type === "p") return <p key={i}>{b.lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(l)}</React.Fragment>)}</p>;
        return null;
      })}
    </div>
  );
}
