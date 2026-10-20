import React, { useEffect, useRef, useState } from "react";
import { MYID } from "../me.js";
import { compteTwist, compteTarget, compteLabel } from "../game/constants.js";
import { Ava, DesignateLoser, RichText } from "../components/common.jsx";

/* Pause après un départ / une remise à zéro : le temps que tout le monde
   voie l'écran avant de recompter (compte à rebours local, sans horloge
   partagée). */
const RESTART_MS = 2500;

function TwistCard({ twist }) {
  const t = compteTwist(twist);
  return (
    <div className="pb-row" style={{ width: "100%", textAlign: "center" }}>
      <div style={{ fontSize: 34 }}>{t.ic}</div>
      <b className="apr-serif" style={{ fontSize: 18 }}>Règle bonus : {t.name}</b>
      <RichText className="muted" text={t.desc} />
    </div>
  );
}

/* « Comptez-vous » : chacun touche le bouton pour dire le chiffre suivant.
   Deux joueurs sur le même chiffre → collision, ils boivent, on recommence. */
export function CompteGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const players = room.players;
  const target = compteTarget(mg.twist, players.length);
  const lbl = (k) => compteLabel(mg.twist, k, target);
  const per = mg.twist === "double" ? 2 : 1;
  const mine = mg.taps.filter((t) => t.id === MYID).length;

  const [now, setNow] = useState(Date.now());
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [foul, setFoul] = useState(false);
  const seenRound = useRef(null);
  useEffect(() => {
    if (mg.phase !== "count") return;
    if (seenRound.current !== mg.round) {
      if (seenRound.current != null && navigator.vibrate) navigator.vibrate([200, 80, 200]);
      seenRound.current = mg.round;
      setBlockedUntil(Date.now() + RESTART_MS);
    }
  }, [mg.phase, mg.round]);
  useEffect(() => {
    if (now >= blockedUntil) return;
    const t = setTimeout(() => setNow(Date.now()), 100);
    return () => clearTimeout(t);
  }, [now, blockedUntil]);
  useEffect(() => { setNow(Date.now()); }, [blockedUntil]);

  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <TwistCard twist={mg.twist} />
        <p className="muted mt">Objectif : arriver à <b className="w">{lbl(target)}</b> ({target} chiffre{target > 1 ? "s" : ""}) sans collision.</p>
        {isLauncher ? (
          <>
            <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={() => act({ type: "mgCompteReroll" })}>🔁 Autre règle bonus</button>
            <button className="btn btn-primary mt" disabled={busy} onClick={() => act({ type: "mgCompteStart" })}>Lancer le compte 🔢</button>
          </>
        ) : waiting}
      </div>
    );
  }

  if (mg.phase === "done") {
    const last = mg.lastId && players.find((p) => p.id === mg.lastId);
    return (
      <div className="center-col pop">
        <div style={{ fontSize: 56 }}>🎉</div>
        <p className="b" style={{ fontSize: 20 }}>Réussi {mg.round > 1 ? `en ${mg.round} essais` : "du premier coup"} !</p>
        {last && <p className="muted">🐢 {last.name} a dit le dernier chiffre et boit !</p>}
        {isLauncher
          ? <button className="btn btn-primary mt" disabled={busy} onClick={() => act({ type: "mgFinish", text: `Comptez-vous réussi${mg.round > 1 ? ` en ${mg.round} essais` : " du premier coup"} 🎉`, long: false })}>Terminer le jeu</button>
          : waiting}
      </div>
    );
  }

  /* phase count */
  const left = Math.max(0, blockedUntil - now);
  const next = mg.count + 1;
  const lastTap = mg.taps[mg.taps.length - 1];
  const lastName = lastTap && (players.find((p) => p.id === lastTap.id) || {}).name;
  const L = mg.last && mg.last.round === mg.round - 1 ? mg.last : null;
  const doneIds = new Set(mg.taps.map((t) => t.id));
  const canTap = mine < per && left === 0 && mg.count < target;

  return (
    <div className="center-col">
      <TwistCard twist={mg.twist} />
      {L && (
        <p className="b mt pop" key={mg.round} style={{ color: "#ff3b5c" }}>
          {L.kind === "collision"
            ? `💥 ${L.ids.map((id) => (players.find((p) => p.id === id) || {}).name).join(" & ")} : « ${lbl(L.n)} » en même temps → ${L.sips} gorgée${L.sips > 1 ? "s" : ""} chacun !`
            : `🚫 ${(players.find((p) => p.id === L.ids[0]) || {}).name} ${L.reason} → ${L.sips} gorgée${L.sips > 1 ? "s" : ""} !`}
        </p>
      )}
      <p className="muted mt">Essai n°{mg.round} · {mg.count}/{target}</p>
      <div className="big-num">{mg.count ? lbl(mg.count) : "–"}</div>
      <p className="muted">{lastName ? `dit par ${lastName}` : "Personne n'a encore parlé…"}</p>

      <div className="wrap mt" style={{ justifyContent: "center" }}>
        {players.map((p) => (
          <span key={p.id} className="chip" style={{ opacity: doneIds.has(p.id) ? 0.4 : 1 }}>
            <Ava p={p} size={20} /> {p.name}{doneIds.has(p.id) ? " ✅" : ""}
          </span>
        ))}
      </div>

      {left > 0 ? (
        <p className="b mt" style={{ fontSize: 22, color: "var(--gold)" }}>Prêts… {Math.ceil(left / 1000)}</p>
      ) : mine >= per ? (
        <p className="muted mt">✅ Tu as dit {per > 1 ? "tes chiffres" : "ton chiffre"}. Croise les doigts 🤞</p>
      ) : (
        <p className="muted mt">Quand tu le sens, touche le bouton{mg.twist === "silence" ? " (sans un mot !)" : " et annonce-le à voix haute"} :</p>
      )}
      <button
        className="btn btn-primary mt"
        style={{ fontSize: 22, padding: "18px 12px" }}
        disabled={busy || !canTap}
        onClick={() => act({ type: "mgCompteTap", n: next, round: mg.round })}>
        Je dis « {lbl(next <= target ? next : target)} » 🗣️
      </button>

      {isLauncher && (
        foul
          ? <div className="mt"><DesignateLoser players={players} label="Qui a triché ? Il boit et on recommence :" onPick={(id) => { setFoul(false); act({ type: "mgCompteFoul", targetId: id }); }} /></div>
          : <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={() => setFoul(true)}>🚨 Siffler une triche</button>
      )}
    </div>
  );
}
