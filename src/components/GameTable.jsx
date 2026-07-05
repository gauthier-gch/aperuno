import React, { useState } from "react";
import { MYID } from "../me.js";
import { TYPE_META, CARD_INFO, GAMES, actionDrink } from "../game/constants.js";
import { Overlay, Ava } from "./common.jsx";
import { Minigame } from "../minigames/index.jsx";

function CardFace({ c, onClick, selected }) {
  const m = TYPE_META[c.type];
  return (
    <div className={"card" + (selected ? " sel" : "")} onClick={onClick}
      style={{ background: `linear-gradient(160deg, ${m.color}, ${m.color}cc)`, boxShadow: `0 10px 26px ${m.glow}` }}>
      <div className="tag">{m.tag} <span style={{ float: "right", opacity: 0.8 }}>ⓘ</span></div>
      <div className="big">{c.label}</div>
      <div className="ic">{m.ic}</div>
    </div>
  );
}

function CardSheet({ card, hand, canPlay, hasDiable, close, onActionStack, onDiableStack, onJeu, onEchange, onEchangeCarte }) {
  const m = TYPE_META[card.type];
  const g = card.type === "jeu" ? GAMES.find((x) => x.id === card.gameId) : null;
  const rule = g ? g.rule : CARD_INFO[card.type];
  const sameCount = card.type === "action"
    ? hand.filter((c) => c.sips === card.sips && c.unit === card.unit).length : 1;
  const [qty, setQty] = useState(1);
  const ids = card.type === "action"
    ? hand.filter((c) => c.sips === card.sips && c.unit === card.unit).slice(0, qty).map((c) => c.id)
    : [card.id];
  const total = card.type === "action" ? card.sips * qty : 0;

  return (
    <Overlay>
      <div className="cardhead">
        <div className="mini-card" style={{ background: `linear-gradient(160deg,${m.color},${m.color}cc)`, boxShadow: `0 8px 20px ${m.glow}` }}>{m.ic}</div>
        <div>
          <span className="chip" style={{ borderColor: m.color }}>{m.tag}</span>
          <h3 className="h-title" style={{ margin: "6px 0 0" }}>{card.label}</h3>
        </div>
      </div>
      <p className="muted mb">{rule}</p>
      {!canPlay && <p className="muted dim mb">Ce n'est pas ton tour (ou tu dois d'abord piocher) — tu peux seulement consulter la règle.</p>}

      {canPlay && card.type === "action" && (
        <div className="col-gap">
          {sameCount > 1 && (
            <div className="space">
              <span className="muted">Empiler des « {card.label} » identiques :</span>
              <div className="row" style={{ alignItems: "center" }}>
                <button className="btn btn-ghost btn-sm auto" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <b style={{ minWidth: 18, textAlign: "center" }}>{qty}</b>
                <button className="btn btn-ghost btn-sm auto" disabled={qty >= sameCount} onClick={() => setQty((q) => Math.min(sameCount, q + 1))}>+</button>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => onActionStack(ids)}>Jouer — {actionDrink(total, card.unit)} 🍻</button>
          {hasDiable && (
            <button className="btn" style={{ background: "linear-gradient(135deg,#b15bff,#7d3bff)" }} onClick={() => onDiableStack(ids)}>
              Jouer avec un Diable 😈
            </button>
          )}
        </div>
      )}
      {canPlay && card.type === "jeu" && <button className="btn btn-blue" onClick={onJeu}>Lancer ce jeu 🎲</button>}
      {canPlay && card.type === "echange" && <button className="btn" style={{ background: "linear-gradient(135deg,#00c6c6,#0094c6)" }} onClick={onEchange}>Échanger ma main 🔄</button>}
      {canPlay && card.type === "echangecarte" && <button className="btn" style={{ background: "linear-gradient(135deg,#12b3a6,#0a8f85)" }} onClick={onEchangeCarte}>Échanger une carte 🔃</button>}
      {canPlay && card.type === "diable" && <p className="muted" style={{ color: "#c78bff" }}>Ouvre plutôt une carte <b>action</b> puis « Jouer avec un Diable ».</p>}
      {canPlay && card.type === "joker" && <p className="muted" style={{ color: "#27d17c" }}>Garde-la : elle se déclenchera quand un diable te visera.</p>}
      {canPlay && card.type === "plus" && <p className="muted" style={{ color: "#ff9b2f" }}>Se joue en réaction quand un diable te vise : tu renvoies la peine +{card.value} à un autre joueur.</p>}
      <button className="btn btn-ghost btn-sm mt" onClick={close}>Fermer</button>
    </Overlay>
  );
}

export function GameTable({ room, act, flash, leave, busy, online = {} }) {
  const me = room.players.find((p) => p.id === MYID) || { hand: [] };
  const meIdx = room.players.findIndex((p) => p.id === MYID);
  const turnId = room.players[room.current] && room.players[room.current].id;
  const isMyTurn = turnId === MYID && !room.minigame && !room.reaction;
  const drawn = room.turn && room.turn.drawn;
  const mustDraw = isMyTurn && !drawn;
  const canPlay = isMyTurn && drawn;
  const top = room.discard[0];
  const [sheet, setSheet] = useState(null);
  const [target, setTarget] = useState(null);     // { cardIds, diableId } -> diable
  const [swap, setSwap] = useState(null);          // { cardId } -> échange de main
  const [swapCard, setSwapCard] = useState(null);  // { cardId } -> échange de carte
  const [reactPlus, setReactPlus] = useState(null);
  const hasDiable = me.hand.some((c) => c.type === "diable");
  const turnName = room.players[room.current] ? room.players[room.current].name : "";

  function playActionStack(ids) { setSheet(null); act({ type: "action", cardIds: ids }); }
  function openDiable(ids) { setSheet(null); setTarget({ cardIds: ids, diableId: me.hand.find((x) => x.type === "diable").id }); }
  function sendDiable(targetId) { const t = target; setTarget(null); act({ type: "actionDiable", cardIds: t.cardIds, diableId: t.diableId, targetId }); }
  function playJeu(c) { setSheet(null); act({ type: "playJeu", cardId: c.id }); }
  function openEchange(c) { setSheet(null); setSwap({ cardId: c.id }); }
  function sendEchange(targetId) { const sw = swap; setSwap(null); act({ type: "echange", cardId: sw.cardId, targetId }); }
  function openEchangeCarte(c) { setSheet(null); setSwapCard({ cardId: c.id }); }
  function sendEchangeCarte(discardId) { const sw = swapCard; setSwapCard(null); act({ type: "echangeCarte", cardId: sw.cardId, discardId }); }

  return (
    <div className="fade">
      <div className="space" style={{ marginBottom: 6 }}>
        <span className="apr-logo" style={{ textAlign: "left" }}><span className="a" style={{ fontSize: 24 }}>apéruno</span></span>
        <button className="btn btn-ghost btn-sm auto" onClick={leave}>Quitter</button>
      </div>

      <div className={"turnbar " + (isMyTurn ? "mine" : "")}>
        {mustDraw ? "🃏 À toi — pioche d'abord une carte !"
          : canPlay ? "🎯 À toi — joue une carte !"
          : `Au tour de ${turnName}`}
      </div>
      {room.hostId === MYID && !isMyTurn && !room.minigame && !room.reaction && (
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} disabled={busy}
          onClick={() => act({ type: "skipCurrent" })}>⏭️ Passer le tour de {turnName} (absent)</button>
      )}

      <div className="opps">
        {room.players.map((p, i) => p.id !== MYID && (
          <div className={"opp" + (i === room.current ? " turn" : "")} key={p.id}>
            <div className="av-wrap"><Ava p={p} size={40} online={online[p.id] !== false} /></div>
            <div className="stack">
              {Array.from({ length: Math.min(p.hand.length, 4) }).map((_, k) => (
                <div className="mini" key={k} style={{ left: k * 3, top: k * 2 }} />
              ))}
            </div>
            <div className="nm">{p.name}</div>
            <div className="cnt">{p.hand.length} cartes</div>
          </div>
        ))}
      </div>

      <div className="center-zone">
        <div className="pile">
          <div className={"pile-card pile-back" + (mustDraw && !busy ? " draw-now" : "")}
            onClick={() => mustDraw && !busy && act({ type: "drawTurn" })}>{room.deck.length}</div>
          <div className="pile-lbl">{mustDraw ? "Pioche 👆" : "Pioche"}</div>
        </div>
        <div className="pile">
          {top
            ? <div className="pile-card" style={{ background: `linear-gradient(160deg,${TYPE_META[top.type].color},${TYPE_META[top.type].color}cc)`, fontSize: 12, padding: 6, textAlign: "center" }}>{top.label}</div>
            : <div className="pile-card pile-empty">vide</div>}
          <div className="pile-lbl">Défausse</div>
        </div>
      </div>

      <div className="space" style={{ alignItems: "baseline" }}>
        <b className="apr-serif" style={{ fontSize: 18 }}>Ta main</b>
        <span className="muted dim">appuie pour les règles · {me.hand.length} cartes</span>
      </div>
      <div className="hand">
        {me.hand.map((c) => <CardFace key={c.id} c={c} onClick={() => setSheet(c)} />)}
      </div>

      {canPlay && (
        <button className="btn btn-ghost mt" disabled={busy} onClick={() => act({ type: "pass" })}>
          Passer mon tour 🙅
        </button>
      )}

      {sheet && (
        <CardSheet card={sheet} hand={me.hand} canPlay={canPlay} hasDiable={hasDiable}
          close={() => setSheet(null)}
          onActionStack={playActionStack} onDiableStack={openDiable}
          onJeu={() => playJeu(sheet)} onEchange={() => openEchange(sheet)} onEchangeCarte={() => openEchangeCarte(sheet)} />
      )}

      {swapCard && (
        <Overlay>
          <h3 className="h-title">Quelle carte défausser ? 🔃</h3>
          <p className="muted mb">Elle sera remplacée par une carte de la pioche.</p>
          <div className="wrap">
            {me.hand.filter((c) => c.id !== swapCard.cardId).map((c) => (
              <button key={c.id} className="btn btn-ghost btn-sm auto" onClick={() => sendEchangeCarte(c.id)}>
                <span style={{ color: TYPE_META[c.type].color }}>{TYPE_META[c.type].ic}</span> {c.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt" onClick={() => setSwapCard(null)}>Annuler</button>
        </Overlay>
      )}

      {target && (
        <Overlay>
          <h3 className="h-title">À qui le diable ? 😈</h3>
          <p className="muted mb">La peine part chez…</p>
          <div className="wrap">
            {room.players.map((p, i) => i !== meIdx && (
              <button key={p.id} className="btn btn-ghost btn-sm auto" onClick={() => sendDiable(p.id)}>
                <Ava p={p} size={24} /> {p.name}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt" onClick={() => setTarget(null)}>Annuler</button>
        </Overlay>
      )}

      {swap && (
        <Overlay>
          <h3 className="h-title">Échanger ta main avec… 🔄</h3>
          <p className="muted mb">Vous échangez intégralement vos mains.</p>
          <div className="wrap">
            {room.players.map((p, i) => i !== meIdx && (
              <button key={p.id} className="btn btn-ghost btn-sm auto" onClick={() => sendEchange(p.id)}>
                <Ava p={p} size={24} /> {p.name} <span className="dim">({p.hand.length})</span>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt" onClick={() => setSwap(null)}>Annuler</button>
        </Overlay>
      )}

      {room.reaction && room.reaction.targetId === MYID && !reactPlus && (() => {
        const joker = me.hand.find((c) => c.type === "joker");
        const p2 = me.hand.find((c) => c.type === "plus" && c.value === 2);
        const p4 = me.hand.find((c) => c.type === "plus" && c.value === 4);
        const bonus = room.reaction.bonus;
        return (
          <Overlay>
            <h3 className="h-title">😈 Tu es visé !</h3>
            <p className="muted mb">« {room.reaction.baseLabel} »{bonus > 0 ? ` + ${bonus} gorgée${bonus > 1 ? "s" : ""} de relances` : ""}. Que fais-tu ?</p>
            <div className="col-gap">
              <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "reactDrink", choice: "subir" })}>Subir 🍻</button>
              {joker && <button className="btn" style={{ background: "linear-gradient(135deg,#27d17c,#15a85e)" }} disabled={busy} onClick={() => act({ type: "reactDrink", choice: "joker" })}>Refuser (joker) 🃏</button>}
              {p2 && <button className="btn" style={{ background: "linear-gradient(135deg,#ff9b2f,#ff7a00)" }} onClick={() => setReactPlus(2)}>Renvoyer +2 ⏫</button>}
              {p4 && <button className="btn" style={{ background: "linear-gradient(135deg,#ff6a2f,#e8401e)" }} onClick={() => setReactPlus(4)}>Renvoyer +4 ⏫</button>}
            </div>
          </Overlay>
        );
      })()}

      {room.reaction && room.reaction.targetId === MYID && reactPlus && (
        <Overlay>
          <h3 className="h-title">+{reactPlus} vers qui ? ⏫</h3>
          <p className="muted mb">La peine repart avec +{reactPlus} gorgées en plus.</p>
          <div className="wrap">
            {room.players.map((p) => p.id !== MYID && (
              <button key={p.id} className="btn btn-ghost btn-sm auto" onClick={() => { const v = reactPlus; setReactPlus(null); act({ type: "reactDrink", choice: "plus", value: v, nextId: p.id }); }}>
                <Ava p={p} size={24} /> {p.name}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt" onClick={() => setReactPlus(null)}>← Retour</button>
        </Overlay>
      )}

      {room.reaction && room.reaction.targetId !== MYID && (
        <Overlay>
          <div className="center-col">
            <p className="muted">😈 {(room.players.find((p) => p.id === room.reaction.targetId) || {}).name || "Un joueur"} décide : subir, joker ou relancer…</p>
          </div>
        </Overlay>
      )}

      {room.minigame && <Minigame room={room} act={act} flash={flash} busy={busy} leave={leave} />}
    </div>
  );
}
