import React, { useEffect, useRef, useState } from "react";
import { MYID } from "./me.js";
import { ensureAuth } from "./firebase.js";
import { useRoom, usePresence, startGame, doMove } from "./net/useRoom.js";
import { applyMove } from "./game/engine.js";
import { Shell } from "./components/common.jsx";
import { Home, Rules, MiniList, Install, Terms, Privacy, Legal, AgeGate } from "./components/Home.jsx";
import { CreateForm, JoinForm } from "./components/Forms.jsx";
import { Lobby } from "./components/Lobby.jsx";
import { GameTable } from "./components/GameTable.jsx";
import { Win } from "./components/Win.jsx";

/* Coups DÉTERMINISTES (résultat identique en local et côté serveur) → on peut
   les afficher en optimiste. On EXCLUT tout ce qui tire de l'aléatoire (lancer
   un jeu / mini-jeux : dés, lettres, roulette, cartes…), qui doit venir du
   serveur pour être cohérent entre les téléphones. */
const OPTIMISTIC_MOVES = new Set([
  "drawTurn", "action", "actionDiable", "reactDrink",
  "echange", "echangeCarte", "pass", "skipCurrent", "winnerSec",
]);

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(null);
  const [screen, setScreen] = useState("home");
  const [code, setCode] = useState(() => localStorage.getItem("aperuno_code") || null);
  const [toast, setToast] = useState(null);
  const [announce, setAnnounce] = useState(null);
  const [busy, setBusy] = useState(false);
  // Confirmation de majorité (déclaration sur l'honneur), mémorisée une fois donnée.
  const [adult, setAdult] = useState(() => {
    try { return localStorage.getItem("aperuno_adult") === "1"; } catch (e) { return false; }
  });
  const confirmAdult = () => {
    try { localStorage.setItem("aperuno_adult", "1"); } catch (e) {}
    setAdult(true);
  };
  const [, tick] = useState(0);
  const { room: serverRoom, error } = useRoom(code);
  // Affichage optimiste : on montre le coup localement tout de suite, puis on
  // resynchronise avec le serveur (via le compteur `rev`).
  const [optimistic, setOptimistic] = useState(null);
  const room = optimistic ? optimistic.room : serverRoom;
  const online = usePresence(code, MYID, !!(room && room.players));
  const toastTimer = useRef();
  const annTimer = useRef();
  const busyRef = useRef(false);
  const optTimer = useRef();

  const flash = (m, ms = 3200) => {
    clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };
  const showAnnounce = (m, ms = 7000) => {
    clearTimeout(annTimer.current);
    setAnnounce(m);
    annTimer.current = setTimeout(() => setAnnounce(null), ms);
  };

  useEffect(() => { ensureAuth().then(() => setAuthed(true)).catch((e) => setAuthErr(e.message)); }, []);
  useEffect(() => {
    if (code) localStorage.setItem("aperuno_code", code);
    else localStorage.removeItem("aperuno_code");
  }, [code]);

  // Bannière centrale sur chaque nouvelle annonce de jeu (reste ~7 s).
  // Pilotée par l'état SERVEUR (pas l'optimiste) pour éviter une double bannière.
  const lastTs = useRef(0);
  useEffect(() => {
    const a = serverRoom && serverRoom.announce;
    if (a && a.ts !== lastTs.current) { lastTs.current = a.ts; showAnnounce(a.text, a.long ? 7000 : 2200); }
  }, [serverRoom && serverRoom.announce && serverRoom.announce.ts]);

  // Resynchronisation : dès que le serveur a rattrapé (ou dépassé) notre coup
  // optimiste, on repasse sur l'état serveur (source de vérité).
  useEffect(() => {
    if (!optimistic) return;
    const caughtUp = serverRoom === false || (serverRoom && (serverRoom.rev || 0) >= optimistic.expectedRev);
    if (caughtUp) {
      clearTimeout(optTimer.current);
      setOptimistic(null); busyRef.current = false; setBusy(false);
    }
  }, [serverRoom && serverRoom.rev, serverRoom, optimistic]);

  // Rafraîchit l'affichage des chronos chaque seconde.
  useEffect(() => {
    if (!room || !room.timers || room.timers.length === 0) return;
    const i = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [room && room.timers && room.timers.length]);

  // Action de jeu, protégée contre le double-envoi (latence).
  // Pour les coups déterministes, on applique le résultat en local tout de suite
  // (affichage instantané), puis le serveur confirme et on resynchronise via `rev`.
  const act = (m) => {
    if (busyRef.current) return;
    const canOpt = OPTIMISTIC_MOVES.has(m.type) && serverRoom && !optimistic;
    if (canOpt) {
      let next;
      try { next = applyMove(serverRoom, m, MYID); }
      catch (e) { flash(e.message); return; } // invalide en local → on n'envoie rien
      setOptimistic({ room: next, expectedRev: (serverRoom.rev || 0) + 1 });
      // Filet de sécurité : si la resynchro n'arrive jamais, on débloque.
      clearTimeout(optTimer.current);
      optTimer.current = setTimeout(() => { setOptimistic(null); busyRef.current = false; setBusy(false); }, 6000);
    }
    busyRef.current = true; setBusy(true);
    doMove(code, m, MYID)
      .then(() => { if (!canOpt) { busyRef.current = false; setBusy(false); } })
      .catch((e) => {
        if (canOpt) { clearTimeout(optTimer.current); setOptimistic(null); }
        busyRef.current = false; setBusy(false); flash(e.message);
      });
  };
  const leave = () => { clearTimeout(optTimer.current); setOptimistic(null); busyRef.current = false; setBusy(false); setCode(null); setScreen("home"); };

  if (authErr) return <Shell><p className="muted">Connexion impossible : {authErr}. Vérifie la config Firebase.</p></Shell>;
  if (!authed) return <Shell><div className="center-col"><div className="apr-logo"><span className="a">apéruno</span></div><p className="muted">Connexion…</p></div></Shell>;

  if (code) {
    if (room === false) return (
      <Shell><div className="center-col">
        <h2 className="h-title">Salon introuvable</h2>
        <p className="muted">Le code « {code} » n'existe pas (ou la partie est terminée).</p>
        <button className="btn btn-primary" onClick={leave}>Accueil</button>
      </div>{!adult && <AgeGate onConfirm={confirmAdult} />}</Shell>
    );
    if (!room) return <Shell><div className="center-col"><p className="muted">Chargement du salon…</p></div>{!adult && <AgeGate onConfirm={confirmAdult} />}</Shell>;
    return (
      <Shell timers={room.timers}>
        {room.status === "lobby" && <Lobby room={room} onStart={(i) => startGame(code, i)} leave={leave} online={online} />}
        {room.status === "playing" && <GameTable room={room} act={act} flash={flash} leave={leave} busy={busy} online={online} />}
        {room.status === "finished" && <Win room={room} onReplay={(i) => startGame(code, i)} leave={leave} act={act} busy={busy} />}
        {announce && <div className="announce-banner pop" onClick={() => setAnnounce(null)}>{announce}</div>}
        {toast && <div className="toast pop">{toast}</div>}
        {!adult && <AgeGate onConfirm={confirmAdult} />}
      </Shell>
    );
  }

  return (
    <Shell>
      {screen === "home" && <Home go={setScreen} />}
      {screen === "rules" && <Rules back={() => setScreen("home")} />}
      {screen === "minijeux" && <MiniList back={() => setScreen("home")} />}
      {screen === "install" && <Install back={() => setScreen("home")} />}
      {screen === "terms" && <Terms back={() => setScreen("home")} />}
      {screen === "privacy" && <Privacy back={() => setScreen("home")} />}
      {screen === "legal" && <Legal back={() => setScreen("home")} />}
      {screen === "create" && <CreateForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {screen === "join" && <JoinForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {toast && <div className="toast pop">{toast}</div>}
      {!adult && <AgeGate onConfirm={confirmAdult} />}
    </Shell>
  );
}
