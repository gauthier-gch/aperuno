import React, { useState } from "react";
import { MYID } from "../me.js";
import { ADVENT_LAYOUT, adventChallenge, adventText } from "../game/seasonal.js";

/* Calendrier de l'avent (décembre) : une maison de Noël à 24 cases. Chaque
   joueur ouvre une case ; derrière la porte, un défi. Le calendrier (room.advent)
   est tiré une fois par partie et identique pour tous ; les cases déjà ouvertes
   par un joueur restent ouvertes pour lui jusqu'à la fin de la partie. */
export function AdventGame({ room, mg, isLauncher, act, busy, waiting }) {
  const [info, setInfo] = useState(false);
  const adv = room.advent || { cells: [], opened: {} };
  const picks = mg.picks || {};
  const myPick = picks[MYID];
  const myOpened = (adv.opened || {})[MYID] || [];
  const challengeAt = (n) => adventChallenge(adv.cells[n - 1]);
  const full = !myPick && myOpened.length >= ADVENT_LAYOUT.length;

  const mine = myPick ? challengeAt(myPick) : null;
  const nDone = Object.keys(picks).length;
  const others = room.players.filter((p) => p.id !== MYID && picks[p.id]);

  return (
    <div className="center-col">
      {/* Une fois la case ouverte, le défi passe au-dessus de la maison
          (sinon il serait caché sous le bouton « Terminer » collant). */}
      {full ? (
        <p className="muted">Ton calendrier est terminé : toutes les cases sont ouvertes 🎉</p>
      ) : !myPick ? (
        <p className="b">Choisis une case et ouvre-la ! 🎁</p>
      ) : mine && (
        <div className="adv-reveal">
          <span className="ic">{mine.ic}</span>
          <p className="dim">Case {myPick}</p>
          <b>{adventText(mine, room.mode)}</b>
          {mine.info && (
            <>
              <button className="adv-info" aria-label="Explication" onClick={() => setInfo((x) => !x)}>i</button>
              {info && <p className="muted adv-info-txt">{mine.info}</p>}
            </>
          )}
        </div>
      )}

      <AdventHouse
        opened={myOpened} current={myPick} challengeAt={challengeAt}
        disabled={busy || !!myPick || full}
        onOpen={(n) => act({ type: "mgAdventOpen", cell: n })} />

      {others.length > 0 && (
        <div className="adv-others mt">
          {others.map((p) => {
            const c = challengeAt(picks[p.id]);
            return (
              <p key={p.id} className="muted">
                <b className="w">{p.name}</b> · case {picks[p.id]} : {c ? <>{c.ic} {adventText(c, room.mode)}</> : "…"}
              </p>
            );
          })}
        </div>
      )}

      {isLauncher
        ? <button className="btn btn-primary mt" disabled={busy} onClick={() => act({
            type: "mgFinish", text: "Calendrier de l'avent 🎄 : à demain pour la prochaine case ! 🎁", long: false,
          })}>Terminer le tour <span className="dim">({nDone}/{room.players.length} ouvertes)</span></button>
        : waiting}
    </div>
  );
}

/* La maison : toit enneigé, guirlande, 24 portes numérotées (ordre mélangé). */
function AdventHouse({ opened, current, challengeAt, disabled, onOpen }) {
  return (
    <div className="adv-house">
      <div className="adv-chimney"><span className="adv-smoke" /></div>
      <div className="adv-roof"><span className="adv-star">⭐</span></div>
      <div className="adv-lights">
        {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ animationDelay: `${(i % 4) * 0.35}s` }} />)}
      </div>
      <div className="adv-wall">
        {ADVENT_LAYOUT.map((n) => {
          const isOpen = opened.includes(n) || current === n;
          const c = isOpen ? challengeAt(n) : null;
          return (
            <button key={n} type="button"
              className={"adv-cell" + (isOpen ? " open" : "") + (current === n ? " now" : "") + (n % 3 === 0 ? " alt" : "")}
              disabled={disabled || isOpen} aria-label={`Case ${n}`}
              onClick={() => onOpen(n)}>
              <span className="adv-back">{c ? c.ic : ""}</span>
              <span className="adv-door"><span>{n}</span></span>
            </button>
          );
        })}
      </div>
      <div className="adv-ground" />
    </div>
  );
}
