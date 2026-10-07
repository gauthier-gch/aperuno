import React, { useState } from "react";
import { MYID } from "../me.js";
import { roleLabel } from "../game/engine.js";
import { DesignateLoser } from "../components/common.jsx";

export function ImposteurGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [guess, setGuess] = useState("");
  const myRole = mg.roles ? mg.roles[MYID] : null;
  const myWord = myRole === "imposteur" ? mg.imposterWord : myRole === "white" ? null : mg.civilWord;
  const active = room.players.filter((p) => !(mg.eliminated || []).includes(p.id));

  /* pas assez de joueurs */
  if (mg.cantPlay) {
    return (
      <div className="center-col">
        <p className="muted mb">Il faut au moins 3 joueurs pour Undercover.</p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "Undercover annulé (pas assez de joueurs)", long: false })}>Terminer</button>
          : waiting}
      </div>
    );
  }

  /* Composition de la partie, visible par tous. */
  const roleVals = Object.values(mg.roles || {});
  const nImp = roleVals.filter((r) => r === "imposteur").length;
  const nWhite = roleVals.filter((r) => r === "white").length;
  const Composition = () => (
    <p className="muted mb center">
      Dans cette partie : <b className="w">{nImp} Undercover</b>
      {" · "}<b className="w">{nWhite ? `${nWhite} Mister White` : "pas de Mister White"}</b>
    </p>
  );

  const MyWordCard = () => (
    <div className="panel mb" style={{ width: "100%", textAlign: "center" }}>
      <p className="dim">Ton mot secret</p>
      {myRole === "white"
        ? <b className="apr-serif" style={{ fontSize: 20 }}>🕵️ Tu es Mister White — aucun mot, bluffe !</b>
        : <b className="apr-serif" style={{ fontSize: 26 }}>{myWord}</b>}
    </div>
  );

  /* fin de manche */
  if (mg.phase === "over") {
    const res = mg.result;
    const title = res === "civils" ? "🎉 Les civils gagnent !" : res === "imposteurs" ? "😈 L'undercover gagne !" : res === "white" ? "🎭 Mister White gagne !" : "Fin";
    return (
      <div className="center-col">
        <p className="b mb">{title}</p>
        <p className="muted mb">Mot des civils : <b className="w">{mg.civilWord}</b> · mot undercover : <b className="w">{mg.imposterWord}</b></p>
        <div className="pb-table" style={{ width: "100%" }}>
          {room.players.map((p) => (
            <div className="pb-row space" key={p.id}>
              <b>{p.name}</b>
              <span className="muted">{roleLabel(mg.roles[p.id])}{mg.eliminated.includes(p.id) ? " · éliminé" : ""}</span>
            </div>
          ))}
        </div>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: title, long: false })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  /* révélation des mots */
  if (mg.phase === "reveal") {
    return (
      <div className="center-col">
        <MyWordCard />
        <Composition />
        <p className="muted mb">Chacun regarde son mot en secret. À tour de rôle, décrivez-le sans le dire !</p>
        {isLauncher
          ? <button className="btn btn-blue" disabled={busy} onClick={() => act({ type: "mgImpStart" })}>Commencer les tours de parole 🎤</button>
          : <p className="muted">En attente que {launcher.name} lance…</p>}
      </div>
    );
  }

  /* tours de parole : l'ordre est visible par tous, on parle à l'oral sans
     cliquer entre chaque joueur. Le lanceur passe ensuite à l'élimination. */
  if (mg.phase === "play") {
    /* Ordre de parole calculé par le moteur (Mister White ne commence jamais). */
    const order = mg.speakOrder && mg.speakOrder.length
      ? mg.speakOrder.map((id) => room.players.find((p) => p.id === id)).filter(Boolean)
      : active;
    return (
      <div className="center-col">
        <MyWordCard />
        <Composition />
        <p className="b mb">🎤 Tours de parole — manche {mg.round}</p>
        <p className="muted mb">Chacun décrit son mot à l'oral, dans cet ordre :</p>
        <div className="pb-table" style={{ width: "100%" }}>
          {order.map((p, i) => (
            <div className="pb-row space" key={p.id}>
              <b>{i + 1}. {p.name}{p.id === MYID ? " (toi)" : ""}</b>
              {i === 0 && <span className="muted">commence</span>}
            </div>
          ))}
        </div>
        {(mg.eliminated || []).length > 0 && (
          <p className="dim mb">Éliminés : {mg.eliminated.map((id) => (room.players.find((p) => p.id === id) || {}).name).filter(Boolean).join(", ")}</p>
        )}
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgImpToVote" })}>Tout le monde a parlé → heure de l'élimination 🗳️</button>
          : <p className="muted dim">Quand tout le monde a parlé, {launcher.name} lance l'élimination.</p>}
      </div>
    );
  }

  /* Mister White tente de deviner */
  if (mg.phase === "whiteguess") {
    if (mg.lastElim && mg.lastElim.id === MYID) {
      return (
        <div className="center-col">
          <p className="b mb">🎭 Tu es Mister White, éliminé ! Devine le mot des civils pour renverser la partie :</p>
          <input className="input mb" placeholder="Le mot des civils…" value={guess} onChange={(e) => setGuess(e.target.value)} />
          <button className="btn btn-primary" disabled={busy || !guess.trim()} onClick={() => act({ type: "mgImpWhiteGuess", guess })}>Proposer</button>
        </div>
      );
    }
    return <div className="center-col"><p className="muted">🎭 Mister White tente de deviner le mot des civils…</p></div>;
  }

  /* élimination */
  if (mg.phase === "elim") {
    if (!mg.lastElim) {
      return (
        <div className="center-col">
          <p className="b mb">🗳️ Heure de l'élimination — manche {mg.round}</p>
          <Composition />
          {isLauncher
            ? <DesignateLoser players={active} onPick={(id) => act({ type: "mgImpEliminate", targetId: id })} label="Qui les joueurs ont-ils voté d'éliminer ?" />
            : <p className="muted">Votez entre vous, puis {launcher.name} indique l'éliminé.</p>}
        </div>
      );
    }
    const elim = room.players.find((p) => p.id === mg.lastElim.id);
    return (
      <div className="center-col">
        <p className="b mb">{elim.name} était <b className="w">{roleLabel(mg.lastElim.role)}</b> — boit 1 gorgée 🍻</p>
        {mg.whiteGuessFailed && <p className="muted mb">Mister White n'a pas trouvé le mot.</p>}
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgImpNextRound" })}>Manche suivante ▶</button>
          : waiting}
      </div>
    );
  }

  return waiting;
}
