import React, { useState } from "react";
import { MYID } from "../me.js";
import { cardMeta } from "../game/constants.js";
import { CardFace } from "../components/CardFace.jsx";

/* Secret Santa (Noël) : chacun offre une carte de sa main au joueur tiré au
   sort pour lui ; chacun reçoit un cadeau emballé… sans savoir de qui. */
export function SantaGame({ room, mg, isLauncher, act, busy, waiting }) {
  const me = room.players.find((p) => p.id === MYID) || { hand: [] };
  const to = room.players.find((p) => p.id === (mg.santa || {})[MYID]);
  const gifts = mg.gifts || {};
  const [opening, setOpening] = useState(false);

  /* ---- choix du cadeau ---- */
  if (mg.phase === "give") {
    const n = Object.keys(gifts).length;
    if (gifts[MYID]) {
      const c = me.hand.find((x) => x.id === gifts[MYID]);
      return (
        <div className="center-col">
          <div className="gift-box small"><span>🎁</span></div>
          <p className="muted">Cadeau emballé pour <b className="w">{to ? to.name : "…"}</b>{c ? <> : « {c.label} »</> : null} 🎀</p>
          <p className="muted">En attente des autres pères Noël… ({n}/{room.players.length})</p>
        </div>
      );
    }
    return (
      <div className="center-col">
        <div style={{ fontSize: 48 }}>🎅🎁</div>
        <p className="muted mb">Tu es le père Noël secret de <b className="w">{to ? to.name : "…"}</b> 🤫<br />Choisis la carte que tu lui offres :</p>
        <div className="santa-hand">
          {me.hand.map((c) => {
            const m = cardMeta(c);
            return (
              <button key={c.id} className={"santa-card" + (m.season ? " seasonal" : "")} disabled={busy}
                style={{ background: `linear-gradient(160deg, ${m.color}, ${m.color}cc)` }}
                onClick={() => act({ type: "mgSantaGive", cardId: c.id })}>
                <span className="t">{m.tag}</span>
                <b>{c.label}</b>
                <span className="i">{m.season ? m.season.emoji : m.ic}</span>
              </button>
            );
          })}
        </div>
        <p className="dim mt">{n}/{room.players.length} cadeaux emballés</p>
      </div>
    );
  }

  /* ---- ouverture des cadeaux ---- */
  const mine = (mg.received || {})[MYID];
  const opened = !!(mg.opened || {})[MYID] || opening;
  const nOpen = Object.keys(mg.opened || {}).length;
  const nGifts = Object.keys(mg.received || {}).length;
  return (
    <div className="center-col">
      {mg.partial && <p className="dim mb">Arrêt anticipé : seuls les cadeaux déjà emballés ont été distribués.</p>}
      {!mine ? (
        <>
          <div style={{ fontSize: 48 }}>🎄😢</div>
          <p className="muted">Pas de cadeau pour toi cette fois… ton père Noël secret était absent !</p>
        </>
      ) : !opened ? (
        <>
          <p className="muted mb">Un cadeau t'attend sous le sapin 🎄</p>
          <button className="gift-box" aria-label="Ouvrir le cadeau"
            onClick={() => { setOpening(true); act({ type: "mgSantaOpen" }); }}>
            <span>🎁</span>
          </button>
          <p className="b mt">Touche pour l'ouvrir !</p>
        </>
      ) : (
        <>
          <p className="muted mb">🎉 Ton cadeau :</p>
          <div className="reveal-card"><CardFace c={mine} onClick={() => {}} /></div>
          <p className="dim mt">Elle rejoint ta main 🂠 — mais qui te l'a offerte ? 🤫</p>
        </>
      )}
      {isLauncher
        ? <button className="btn btn-primary mt" disabled={busy} onClick={() => act({
            type: "mgFinish", text: "Secret Santa 🎅 : joyeux Noël, les cadeaux sont dans vos mains ! 🎁", long: false,
          })}>Terminer le tour <span className="dim">({nOpen}/{nGifts} ouverts)</span></button>
        : waiting}
    </div>
  );
}
