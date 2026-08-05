import React, { useEffect, useRef, useState } from "react";
import { MYID } from "./me.js";
import { ensureAuth } from "./firebase.js";
import { useRoom, usePresence, startGame, doMove } from "./net/useRoom.js";
import { Shell } from "./components/common.jsx";
import { Home, Rules, MiniList, Install, Terms, Privacy } from "./components/Home.jsx";
import { CreateForm, JoinForm } from "./components/Forms.jsx";
import { Lobby } from "./components/Lobby.jsx";
import { GameTable } from "./components/GameTable.jsx";
import { Win } from "./components/Win.jsx";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(null);
  const [screen, setScreen] = useState("home");
  const [code, setCode] = useState(() => localStorage.getItem("aperuno_code") || null);
  const [toast, setToast] = useState(null);
  const [announce, setAnnounce] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const { room, error } = useRoom(code);
  const online = usePresence(code, MYID, !!(room && room.players));
  const toastTimer = useRef();
  const annTimer = useRef();
  const busyRef = useRef(false);

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
  const lastTs = useRef(0);
  useEffect(() => {
    const a = room && room.announce;
    if (a && a.ts !== lastTs.current) { lastTs.current = a.ts; showAnnounce(a.text, a.long ? 7000 : 2200); }
  }, [room && room.announce && room.announce.ts]);

  // Rafraîchit l'affichage des chronos chaque seconde.
  useEffect(() => {
    if (!room || !room.timers || room.timers.length === 0) return;
    const i = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [room && room.timers && room.timers.length]);

  // Action de jeu, protégée contre le double-envoi (latence).
  const act = (m) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    doMove(code, m, MYID)
      .catch((e) => flash(e.message))
      .finally(() => { busyRef.current = false; setBusy(false); });
  };
  const leave = () => { setCode(null); setScreen("home"); };

  if (authErr) return <Shell><p className="muted">Connexion impossible : {authErr}. Vérifie la config Firebase.</p></Shell>;
  if (!authed) return <Shell><div className="center-col"><div className="apr-logo"><span className="a">apéruno</span></div><p className="muted">Connexion…</p></div></Shell>;

  if (code) {
    if (room === false) return (
      <Shell><div className="center-col">
        <h2 className="h-title">Salon introuvable</h2>
        <p className="muted">Le code « {code} » n'existe pas (ou la partie est terminée).</p>
        <button className="btn btn-primary" onClick={leave}>Accueil</button>
      </div></Shell>
    );
    if (!room) return <Shell><div className="center-col"><p className="muted">Chargement du salon…</p></div></Shell>;
    return (
      <Shell timers={room.timers}>
        {room.status === "lobby" && <Lobby room={room} onStart={(i) => startGame(code, i)} leave={leave} online={online} />}
        {room.status === "playing" && <GameTable room={room} act={act} flash={flash} leave={leave} busy={busy} online={online} />}
        {room.status === "finished" && <Win room={room} onReplay={(i) => startGame(code, i)} leave={leave} act={act} busy={busy} />}
        {announce && <div className="announce-banner pop" onClick={() => setAnnounce(null)}>{announce}</div>}
        {toast && <div className="toast pop">{toast}</div>}
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
      {screen === "create" && <CreateForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {screen === "join" && <JoinForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {toast && <div className="toast pop">{toast}</div>}
    </Shell>
  );
}
