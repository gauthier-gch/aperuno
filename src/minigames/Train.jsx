import React from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import {
  TRAIN_FORKS, TRAIN_MONSTERS, TRAIN_WALLS, TRAIN_SIPS, TRAIN_GIVE,
  trainFork, trainEnd, trainStage, trainDeaths, trainRevealed,
} from "../game/seasonal.js";

/* Position d'un wagon : groupe (M = train au départ, L / R = branche choisie,
   C = tout droit dans le mur) puis case dans une petite grille. */
const ANCHOR = { M: [50, 10, 5], L: [18, 170, 2], R: [82, 170, 2], C: [50, 140, 2] };
const CELL_W = 44, CELL_H = 50;
function wagonPos(group, k, n) {
  const [x, y, cols] = ANCHOR[group];
  const c = Math.min(cols, n);
  const col = k % cols, row = Math.floor(k / cols);
  const rowCount = Math.min(c, n - row * cols);
  const dx = (col - (rowCount - 1) / 2) * CELL_W;
  return { left: `calc(${x}% + ${dx}px)`, bottom: y + (group === "M" ? row : -row) * CELL_H };
}
import { useClock, useRetrySend } from "./hooks.js";

/* Liste des passagers (en haut à droite du décor) : qui a été attrapé, où. */
function Passengers({ room, deaths }) {
  return (
    <div className="train-list">
      {room.players.map((p) => {
        const d = deaths[p.id];
        return (
          <div key={p.id} className={"train-pass" + (d ? " dead" : "")}>
            <Ava p={p} size={16} /> <span className="nm">{p.name}</span>{d ? <span>{d.ic}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

/* Évite les monstres (Spooky) : train fantôme synchronisé, 3 bifurcations.
   Chacun choisit gauche / droite en 5 s ; un des chemins cache un monstre,
   ne pas choisir = tout droit dans le mur (et son monstre). */
export function TrainGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const playing = mg.phase === "play";
  const now = useClock(100, playing);
  // Tous les joueurs attrapés → on arrête le train après la révélation.
  const revealedNow = playing ? trainRevealed(mg, now) : 0;
  const allDead = playing && revealedNow > 0
    && Object.keys(trainDeaths(mg, room.players, revealedNow)).length >= room.players.length
    && now >= trainFork(mg, revealedNow - 1).reveal + 2200;
  useRetrySend(playing && (allDead || now >= trainEnd(mg)), () => act({ type: "mgTrainEnd" }), isLauncher ? 300 : 2500);

  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🎃🚃👻</div>
        <p className="muted">3 bifurcations, 5 secondes pour choisir à chaque fois. Un des deux chemins cache un monstre… et si tu ne choisis pas, c'est le mur !</p>
        {isLauncher
          ? <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgTrainStart" })}>En voiture ! 🚃</button>
          : <p className="muted mt">En attente que {launcher.name} fasse partir le train…</p>}
      </div>
    );
  }

  if (playing) {
    const st = trainStage(mg, now);
    const f = st.fork;
    // Bifurcations déjà révélées (la courante compte dès sa révélation).
    const resolved = st.step === "prep" ? 0 : st.step === "reveal" || st.step === "done" ? f + 1 : f;
    const deaths = trainDeaths(mg, room.players, resolved);
    const myChoice = mg.choices && mg.choices[MYID] && mg.choices[MYID][f];
    const w = trainFork(mg, f);
    const secLeft = Math.max(0, Math.ceil((w.reveal - now) / 1000));
    const rolling = st.step === "ride" || st.step === "prep" || st.step === "done";
    const revealing = st.step === "reveal";
    const diedHere = !!(revealing && deaths[MYID] && deaths[MYID].fork === f);
    const deadBefore = !!deaths[MYID] && !diedHere;
    const monster = TRAIN_MONSTERS[f], wall = TRAIN_WALLS[f];
    const showFork = st.step === "choose" || revealing;
    return (
      <div className="center-col">
        <div className={"train-stage" + (rolling ? " rolling" : "")}>
          <div className="train-rails" />
          <Passengers room={room} deaths={deaths} />
          <div className="train-fork-no">Bifurcation {Math.min(f + 1, TRAIN_FORKS)}/{TRAIN_FORKS}</div>
          {showFork && (
            <div className="train-fork">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="train-branches">
                <path d="M50 100 L50 74 L18 46 L18 0" />
                <path d="M50 100 L50 74 L82 46 L82 0" />
              </svg>
              <div className="train-wall"><span>{wall.ic}</span>🧱🧱</div>
              <div className={"train-side L" + (revealing ? (mg.monsterSide[f] === "L" ? " bad" : " ok") : "")}>
                {revealing ? (mg.monsterSide[f] === "L" ? monster.ic : "✨") : "❓"}
              </div>
              <div className={"train-side R" + (revealing ? (mg.monsterSide[f] === "R" ? " bad" : " ok") : "")}>
                {revealing ? (mg.monsterSide[f] === "R" ? monster.ic : "✨") : "❓"}
              </div>
            </div>
          )}
          {(() => {
            // Wagons de tous les joueurs encore en jeu (ceux attrapés à
            // cette bifurcation restent visibles le temps de l'explosion).
            const riders = room.players.filter((p) => !deaths[p.id] || (revealing && deaths[p.id].fork === f));
            const groupOf = (p) => {
              if (!revealing) return "M";
              const c = mg.choices && mg.choices[p.id] && mg.choices[p.id][f];
              return c || "C";
            };
            const groups = {};
            riders.forEach((p) => { const g = groupOf(p); (groups[g] = groups[g] || []).push(p); });
            return riders.map((p) => {
              const g = groupOf(p);
              const list = groups[g];
              const pos = wagonPos(g, list.indexOf(p), list.length);
              const me = p.id === MYID;
              // Avant la révélation, chaque wagon penche du côté choisi par son joueur.
              const ch = mg.choices && mg.choices[p.id] && mg.choices[p.id][f];
              const lean = !revealing && st.step === "choose" && ch ? " lean-" + ch : "";
              const boom = revealing && deaths[p.id] && deaths[p.id].fork === f;
              return (
                <div key={p.id} className={"train-cart" + (me ? " me" : "") + lean} style={pos}>
                  <Ava p={p} size={20} />
                  <span className="train-wagon">🚃</span>
                  {boom && <span className="train-boom">💥</span>}
                </div>
              );
            });
          })()}
          {deadBefore && <div className="train-ghost">👻</div>}
          {/* Boutons au milieu de la scène : pas besoin de faire défiler. */}
          {st.step === "choose" && !deadBefore && (
            <div className="train-choice">
              <button className={"btn train-btn" + (myChoice === "L" ? " on" : "")} disabled={busy || !!myChoice}
                onClick={() => act({ type: "mgTrainChoose", fork: f, side: "L" })}>⬅️<br />Gauche</button>
              <span className="train-timer">{secLeft}</span>
              <button className={"btn train-btn" + (myChoice === "R" ? " on" : "")} disabled={busy || !!myChoice}
                onClick={() => act({ type: "mgTrainChoose", fork: f, side: "R" })}>➡️<br />Droite</button>
            </div>
          )}
        </div>

        {st.step === "prep" && <p className="b">Attachez vos ceintures… 🎢</p>}
        {deadBefore ? (
          <p className="muted">{deaths[MYID].ic} {cap(deaths[MYID].name)} t'a attrapé : bois {TRAIN_SIPS} gorgées et regarde la suite 👀</p>
        ) : st.step === "choose" ? (
          <p className="b">{myChoice ? `Tu pars à ${myChoice === "L" ? "gauche" : "droite"}… 🤞` : "Gauche ou droite ? Vite ! ⏱️"}</p>
        ) : revealing ? (
          diedHere
            ? <p className="b">{deaths[MYID].ic} {cap(deaths[MYID].name)} t'a attrapé{deaths[MYID].wall ? " dans le mur" : ""} ! Bois {TRAIN_SIPS} gorgées 🍻</p>
            : <p className="b">Ouf, tu t'en sors ! ✨</p>
        ) : st.step === "ride" ? (
          <p className="muted">Le train fonce dans le noir… 🌑</p>
        ) : (
          <p className="muted">Fin du parcours… 🏁</p>
        )}
      </div>
    );
  }

  /* ---- résultats ---- */
  const deaths = mg.deaths || {};
  const survivors = room.players.filter((p) => !deaths[p.id]);
  const dead = room.players.filter((p) => deaths[p.id]);
  return (
    <div className="center-col pop">
      <div style={{ fontSize: 48 }}>🏁🎃</div>
      <div className="pb-table" style={{ width: "100%" }}>
        {survivors.map((p) => (
          <div className="pb-row space" key={p.id}>
            <span className="row" style={{ alignItems: "center", gap: 8 }}><Ava p={p} size={24} /> <b style={{ margin: 0 }}>{p.name}</b></span>
            <b className="w">✨ distribue {TRAIN_GIVE}</b>
          </div>
        ))}
        {dead.map((p) => (
          <div className="pb-row space" key={p.id}>
            <span className="row" style={{ alignItems: "center", gap: 8 }}><Ava p={p} size={24} /> <b style={{ margin: 0 }}>{p.name}</b></span>
            <span className="muted" style={{ textAlign: "right" }}>{deaths[p.id].ic} bifurcation {deaths[p.id].fork + 1}<br /><b className="w">boit {TRAIN_SIPS} 🍻</b></span>
          </div>
        ))}
      </div>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: [
              survivors.length ? `✨ ${survivors.map((p) => p.name).join(", ")} ${survivors.length > 1 ? "distribuent" : "distribue"} ${TRAIN_GIVE} gorgées` : null,
              dead.length ? `👻 ${dead.map((p) => p.name).join(", ")} ${dead.length > 1 ? "boivent" : "boit"} ${TRAIN_SIPS} gorgées` : null,
            ].filter(Boolean).join(" · "),
          })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
