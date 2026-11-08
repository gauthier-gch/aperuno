import React from "react";
import { cardMeta } from "../game/constants.js";

/* Face d'une carte (main, pioche révélée, cadeau du Secret Santa…).
   Carte Jeu éphémère : bleu plus clair + icône de la période en haut à droite. */
export function CardFace({ c, onClick, selected, className = "", style, ...rest }) {
  const m = cardMeta(c);
  return (
    <div className={"card" + (m.season ? " seasonal" : "") + (selected ? " sel" : "") + (className ? " " + className : "")} onClick={onClick} {...rest}
      style={{ background: `linear-gradient(160deg, ${m.color}, ${m.color}cc)`, boxShadow: `0 10px 26px ${m.glow}`, ...style }}>
      <div className="tag">{m.tag} {m.season
        ? <span className="season-ic" title={m.season.name}>{m.season.emoji}</span>
        : <span style={{ float: "right", opacity: 0.8 }}>ⓘ</span>}</div>
      <div className="big">{c.label}</div>
      <div className="ic">{m.ic}</div>
    </div>
  );
}
