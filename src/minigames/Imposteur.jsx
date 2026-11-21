import React, { useState } from "react";
import { MYID } from "../me.js";
import { roleLabel, IMPOSTER_MIN } from "../game/engine.js";
import { DesignateLoser, Ava } from "../components/common.jsx";

export function ImposteurGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const [guess, setGuess] = useState("");
  const [shown, setShown] = useState(false); // mot révélé (local) ?
  const [picked, setPicked] = useState(() => room.players.map((p) => p.id)); // joueurs présents
  const myRole = mg.roles ? mg.roles[MYID] : null;
  const myWord = myRole === "imposteur" ? mg.imposterWord : myRole === "white" ? null : mg.civilWord;
  // Seuls les joueurs présents (avec un rôle) participent.
  const players = room.players.filter((p) => mg.roles && mg.roles[p.id]);
  const active = players.filter((p) => !(mg.eliminated || []).includes(p.id));

  /* pas assez de joueurs */
  if (mg.cantPlay) {
    return (
      <div className="center-col">
        <p className="muted mb">Il faut au moins {IMPOSTER_MIN} joueurs pour Undercover.</p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "Undercover annulé (pas assez de joueurs)", long: false })}>Terminer</button>
          : waiting}
      </div>
    );
  }

  /* Le lanceur coche les joueurs présents avant le tirage des rôles. */
  if (mg.phase === "select") {
    if (!isLauncher) return <div className="center-col"><p className="muted">{launcher.name} sélectionne les joueurs présents…</p></div>;
    const toggle = (id) => setPicked((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
    const ids = picked.filter((id) => room.players.some((p) => p.id === id));
    return (
      <div className="center-col">
        <p className="b mb">Qui joue ? Décoche les absents :</p>
        <div className="wrap mb">
          {room.players.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button key={p.id} className={"btn btn-sm auto " + (on ? "btn-gold" : "btn-ghost")} style={on ? undefined : { opacity: 0.55 }} onClick={() => toggle(p.id)}>
                <Ava p={p} size={20} /> {on ? "✅" : "⬜"} {p.name}
              </button>
            );
          })}
        </div>
        {ids.length < IMPOSTER_MIN ? (
          <>
            <p className="muted mb">Il faut au moins {IMPOSTER_MIN} joueurs présents pour jouer.</p>
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "Undercover annulé (pas assez de joueurs présents)", long: false })}>Annuler l'Undercover</button>
          </>
        ) : (
          <>
            {ids.length === 3 && <p className="muted mb">À 3 joueurs : pas de Mister White.</p>}
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgImpSetup", playerIds: ids })}>
              Distribuer les mots ({ids.length} joueurs) 🎲
            </button>
          </>
        )}
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

  /* Mot secret caché derrière un bouton « Révéler mon mot » (chacun le fait
     sur son téléphone, quand personne ne regarde). */
  const MyWordCard = () => {
    if (!myRole) return <div className="panel mb" style={{ width: "100%", textAlign: "center" }}><p className="muted">Tu ne participes pas à cette manche (absent au lancement).</p></div>;
    if (!shown) return <button className="btn btn-blue mb" onClick={() => setShown(true)}>👀 Révéler mon mot</button>;
    return (
      <div className="panel mb" style={{ width: "100%", textAlign: "center" }}>
        <p className="dim">Ton mot secret</p>
        {myRole === "white"
          ? <b className="apr-serif" style={{ fontSize: 20 }}>🕵️ Tu es Mister White — aucun mot, bluffe !</b>
          : <b className="apr-serif" style={{ fontSize: 26 }}>{myWord}</b>}
        <div><button className="btn btn-ghost btn-sm auto mt" style={{ margin: "10px auto 0" }} onClick={() => setShown(false)}>🙈 Cacher</button></div>
      </div>
    );
  };

  /* fin de manche */
  if (mg.phase === "over") {
    const res = mg.result;
    const title = res === "civils" ? "🎉 Les civils gagnent !" : res === "imposteurs" ? "😈 L'undercover gagne !" : res === "white" ? "🎭 Mister White gagne !" : "Fin";
    return (
      <div className="center-col">
        <p className="b mb">{title}</p>
        <p className="muted mb">Mot des civils : <b className="w">{mg.civilWord}</b> · mot undercover : <b className="w">{mg.imposterWord}</b></p>
        <div className="pb-table" style={{ width: "100%" }}>
          {players.map((p) => (
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
        <p className="muted mb">Chacun touche « Révéler mon mot » et le regarde en secret. À tour de rôle, décrivez-le sans le dire !</p>
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
