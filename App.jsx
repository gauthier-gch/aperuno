import React, { useState, useEffect, useRef } from "react";
import { ensureAuth, clientId } from "./firebase";
import { useRoom, createRoom, joinRoom, startGame, doMove } from "./useRoom";
import { GAMES, TYPE_META, DICE, PETITBAC_CATS, CARD_INFO } from "./game";

const MYID = clientId();

/* --------------------------------- utils --------------------------------- */
function compressPhoto(file, cb) {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const s = 140; c.width = s; c.height = s;
      const ctx = c.getContext("2d");
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, s, s);
      cb(c.toDataURL("image/jpeg", 0.55));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* ================================== APP ================================== */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(null);
  const [screen, setScreen] = useState("home");
  const [code, setCode] = useState(() => localStorage.getItem("aperuno_code") || null);
  const [toast, setToast] = useState(null);
  const [, force] = useState(0);

  const { room, error } = useRoom(code);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  useEffect(() => { ensureAuth().then(() => setAuthed(true)).catch((e) => setAuthErr(e.message)); }, []);

  // mémorise / oublie le code pour reprise après rechargement
  useEffect(() => { if (code) localStorage.setItem("aperuno_code", code); else localStorage.removeItem("aperuno_code"); }, [code]);

  // annonces -> toast
  const lastTs = useRef(0);
  useEffect(() => {
    const a = room && room.announce;
    if (a && a.ts !== lastTs.current) { lastTs.current = a.ts; flash(a.text); }
  }, [room && room.announce && room.announce.ts]);

  // tic horloge pour chronos
  useEffect(() => {
    if (!room || !room.timers || room.timers.length === 0) return;
    const i = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [room && room.timers && room.timers.length]);

  const act = (m) => doMove(code, m, MYID).catch((e) => flash(e.message));
  const leave = () => { setCode(null); setScreen("home"); };

  if (authErr) return <Shell><p className="muted">Connexion impossible : {authErr}. Vérifie la config Firebase dans <code>src/firebase.js</code>.</p></Shell>;
  if (!authed) return <Shell><div className="center-col"><div className="apr-logo"><span className="a">apéruno</span></div><p className="muted">Connexion…</p></div></Shell>;

  // dans un salon
  if (code) {
    if (room === false) return <Shell><div className="center-col"><h2 className="h-title">Salon introuvable</h2><p className="muted">Le code « {code} » n'existe pas (ou la partie est terminée).</p><button className="btn btn-primary" onClick={leave}>Accueil</button></div></Shell>;
    if (!room) return <Shell><div className="center-col"><p className="muted">Chargement du salon…</p></div></Shell>;
    return (
      <Shell timers={room.timers}>
        {room.status === "lobby" && <Lobby room={room} onStart={(i) => startGame(code, i)} leave={leave} />}
        {room.status === "playing" && <GameTable room={room} act={act} flash={flash} leave={leave} />}
        {room.status === "finished" && <Win room={room} onReplay={(i) => startGame(code, i)} leave={leave} />}
        {toast && <div className="toast pop">{toast}</div>}
      </Shell>
    );
  }

  // hors salon
  return (
    <Shell>
      {screen === "home" && <Home go={setScreen} />}
      {screen === "rules" && <Rules back={() => setScreen("home")} />}
      {screen === "minijeux" && <MiniList back={() => setScreen("home")} />}
      {screen === "create" && <CreateForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {screen === "join" && <JoinForm back={() => setScreen("home")} onDone={(c) => setCode(c)} flash={flash} />}
      {toast && <div className="toast pop">{toast}</div>}
    </Shell>
  );
}

/* -------------------------------- shell ---------------------------------- */
function Shell({ children, timers }) {
  return (
    <div className="apr-root">
      <div className="apr-app">
        {timers && timers.length > 0 && (
          <div className="chrono">
            {timers.filter((t) => t.endsAt > Date.now()).map((t) => {
              const left = Math.max(0, t.endsAt - Date.now());
              const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
              return <div className="one" key={t.id}><span>⏳ {t.label}</span><span className="t">{m}:{String(s).padStart(2, "0")}</span></div>;
            })}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Ava({ p, size = 40 }) {
  const st = { width: size, height: size, fontSize: size * 0.42 };
  return p && p.photo
    ? <img className="avatar" style={st} src={p.photo} alt="" />
    : <div className="avatar" style={st}>{(p && p.name && p.name[0] && p.name[0].toUpperCase()) || "?"}</div>;
}
function Overlay({ children }) { return <div className="overlay"><div className="sheet pop">{children}</div></div>; }

/* -------------------------------- accueil -------------------------------- */
function Home({ go }) {
  return (
    <div className="fade">
      <div style={{ position: "relative", marginTop: 30, marginBottom: 34 }}>
        <span className="apr-deco" style={{ left: 6, top: -6 }}>🍸</span>
        <span className="apr-deco" style={{ right: 8, top: 10 }}>😈</span>
        <span className="apr-deco" style={{ left: 30, top: 70 }}>🍻</span>
        <div className="apr-logo"><span className="a">apéruno</span><span className="sub">uno · diable · apéro</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => go("create")}><span className="ico">🎴</span> Créer une partie</button>
        <button className="btn btn-blue" onClick={() => go("join")}><span className="ico">🔗</span> Rejoindre une partie</button>
        <button className="btn btn-ghost" onClick={() => go("rules")}><span className="ico">📜</span> Règles</button>
        <button className="btn btn-ghost" onClick={() => go("minijeux")}><span className="ico">🎲</span> Mini-jeux</button>
      </div>
    </div>
  );
}

function Rules({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Règles</h2>
      <div className="panel mb"><p className="muted"><b className="w">But.</b> Se débarrasser de ses 7 cartes. Premier à 0 carte = gagnant.</p></div>
      <div className="panel mb"><p className="muted"><b className="w">À ton tour :</b><br />
        • <b style={{ color: "#ff6f86" }}>Action (rouge)</b> → tu bois, pose 1 / repioche 1.<br />
        • <b style={{ color: "#37a6ff" }}>Jeu (bleu)</b> → mini-jeu, le perdant pioche : pose 1, ne repioche pas.<br />
        • <b style={{ color: "#c78bff" }}>Action + Diable (violet)</b> → un autre boit : pose 2 / repioche 1.<br />
        • <b>Passer</b> → tu pioches 1 carte.</p></div>
      <div className="panel"><p className="muted"><b style={{ color: "#27d17c" }}>Joker (vert)</b> → en réaction, pour refuser un diable. Pose 1, ne repioche pas.</p></div>
    </div>
  );
}

function MiniList({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Mini-jeux</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GAMES.map((g) => (
          <div className="panel" key={g.id} style={{ padding: 14 }}>
            <div className="space"><b className="apr-serif" style={{ fontSize: 18 }}>{g.name}</b>
              <span className="chip">{g.kind === "offapp" ? "hors app" : g.kind === "facilitator" || g.kind === "regard" ? "physique" : "in-app"}</span></div>
            <p className="muted mt"> {g.rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------ formulaires create / join ---------------------- */
function PhotoName({ name, setName, photo, setPhoto }) {
  const fileRef = useRef();
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <label style={{ flex: "0 0 auto" }}>
        <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && compressPhoto(e.target.files[0], setPhoto)} />
        {photo ? <img className="avatar" style={{ width: 52, height: 52 }} src={photo} alt="" />
          : <div className="avatar" style={{ width: 52, height: 52, fontSize: 22 }}>📷</div>}
      </label>
      <input className="input" placeholder="Ton prénom" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}

function CreateForm({ back, onDone, flash }) {
  const [name, setName] = useState(""); const [photo, setPhoto] = useState(null); const [mode, setMode] = useState("chill");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    setBusy(true);
    try { const code = await createRoom(mode, { id: MYID, name: name.trim(), photo }); onDone(code); }
    catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Créer une partie</h2>
      <p className="muted mt mb">Mode</p>
      <div className="seg">
        <button className={"chill " + (mode === "chill" ? "on" : "")} onClick={() => setMode("chill")}>😎 Chill</button>
        <button className={"hard " + (mode === "hard" ? "on" : "")} onClick={() => setMode("hard")}>🔥 Hard</button>
      </div>
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-primary" style={{ marginTop: 22 }} disabled={busy} onClick={go}>{busy ? "Création…" : "Créer le salon 🎴"}</button>
    </div>
  );
}

function JoinForm({ back, onDone, flash }) {
  const [name, setName] = useState(""); const [photo, setPhoto] = useState(null); const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    if (code.trim().length !== 4) return flash("Le code fait 4 lettres");
    setBusy(true);
    const C = code.trim().toUpperCase();
    try { await joinRoom(C, { id: MYID, name: name.trim(), photo }); onDone(C); }
    catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Rejoindre une partie</h2>
      <p className="muted mt mb">Code du salon</p>
      <input className="input code-input" placeholder="ABCD" value={code} maxLength={4}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-blue" style={{ marginTop: 22 }} disabled={busy} onClick={go}>{busy ? "Connexion…" : "Rejoindre 🔗"}</button>
    </div>
  );
}

/* --------------------------------- lobby --------------------------------- */
function Lobby({ room, onStart, leave }) {
  const isHost = room.hostId === MYID;
  const [picking, setPicking] = useState(false);
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={leave}>← Quitter</button>
      <div className="center-col" style={{ marginBottom: 18 }}>
        <p className="muted">Code du salon — partage-le !</p>
        <div className="code-big">{room.code}</div>
        <span className="chip">{room.mode === "chill" ? "😎 Chill" : "🔥 Hard"}</span>
      </div>
      <p className="muted mb">Joueurs connectés ({room.players.length}/10)</p>
      <div className="players-grid">
        {room.players.map((p) => (
          <div className="pcard" key={p.id}>
            <Ava p={p} size={46} />
            <span className="nm">{p.name}{p.id === room.hostId ? " 👑" : ""}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        !picking ? (
          <button className="btn btn-primary mt-lg" disabled={room.players.length < 2} onClick={() => setPicking(true)}>
            {room.players.length < 2 ? "En attente d'autres joueurs…" : "Lancer → qui commence ?"}
          </button>
        ) : (
          <div className="panel mt-lg">
            <p className="muted">Qui achète l'engagement et commence ? 🥃 <span className="dim">(l'engagement se boit hors appli)</span></p>
            <div className="wrap mt">
              {room.players.map((p, i) => (
                <button key={p.id} className="btn btn-gold btn-sm auto" onClick={() => onStart(i)}><Ava p={p} size={22} /> {p.name}</button>
              ))}
            </div>
          </div>
        )
      ) : (
        <p className="muted center mt-lg">En attente que l'hôte lance la partie…</p>
      )}
    </div>
  );
}

/* ---------------------------------- carte -------------------------------- */
function CardFace({ c, onClick }) {
  const m = TYPE_META[c.type];
  return (
    <div className="card" onClick={onClick} style={{ background: `linear-gradient(160deg, ${m.color}, ${m.color}cc)`, boxShadow: `0 10px 26px ${m.glow}` }}>
      <div className="tag">{m.tag} <span style={{ float: "right", opacity: .8 }}>ⓘ</span></div>
      <div className="big">{c.label}</div>
      <div className="ic">{m.ic}</div>
    </div>
  );
}

function CardSheet({ card, canPlay, hasDiable, close, onSolo, onDiable, onJeu }) {
  const m = TYPE_META[card.type];
  const g = card.type === "jeu" ? GAMES.find((x) => x.id === card.gameId) : null;
  const rule = g ? g.rule : CARD_INFO[card.type];
  return (
    <Overlay>
      <div className="cardhead">
        <div className="mini-card" style={{ background: `linear-gradient(160deg,${m.color},${m.color}cc)`, boxShadow: `0 8px 20px ${m.glow}` }}>{m.ic}</div>
        <div><span className="chip" style={{ borderColor: m.color }}>{m.tag}</span><h3 className="h-title" style={{ margin: "6px 0 0" }}>{card.label}</h3></div>
      </div>
      <p className="muted mb">{rule}</p>
      {!canPlay && <p className="muted dim mb">Ce n'est pas ton tour — tu peux seulement consulter la règle.</p>}
      {canPlay && card.type === "action" && (
        <div className="col-gap">
          <button className="btn btn-primary" onClick={onSolo}>Jouer — {card.drink} 🍻</button>
          {hasDiable && <button className="btn" style={{ background: "linear-gradient(135deg,#b15bff,#7d3bff)" }} onClick={onDiable}>Jouer avec un Diable 😈</button>}
        </div>
      )}
      {canPlay && card.type === "jeu" && <button className="btn btn-blue" onClick={onJeu}>Lancer ce jeu 🎲</button>}
      {canPlay && card.type === "diable" && <p className="muted" style={{ color: "#c78bff" }}>Ouvre plutôt une carte <b>action</b> puis « Jouer avec un Diable ».</p>}
      {canPlay && card.type === "joker" && <p className="muted" style={{ color: "#27d17c" }}>Garde-la : elle se déclenchera quand un diable te visera.</p>}
      <button className="btn btn-ghost btn-sm mt" onClick={close}>Fermer</button>
    </Overlay>
  );
}

/* --------------------------------- table --------------------------------- */
function GameTable({ room, act, flash, leave }) {
  const me = room.players.find((p) => p.id === MYID) || { hand: [] };
  const meIdx = room.players.findIndex((p) => p.id === MYID);
  const turnId = room.players[room.current] && room.players[room.current].id;
  const myTurn = turnId === MYID && !room.minigame && !room.reaction;
  const top = room.discard[0];
  const [sheet, setSheet] = useState(null);     // carte ouverte
  const [target, setTarget] = useState(null);   // {cardId, diableId}
  const hasDiable = me.hand.some((c) => c.type === "diable");

  const turnName = room.players[room.current] ? room.players[room.current].name : "";

  function playSolo(c) { setSheet(null); act({ type: "action", cardId: c.id }); }
  function playJeu(c) { setSheet(null); act({ type: "playJeu", cardId: c.id }); }
  function openDiable(c) { setSheet(null); setTarget({ cardId: c.id, diableId: me.hand.find((x) => x.type === "diable").id }); }
  function sendDiable(targetId) { const t = target; setTarget(null); act({ type: "actionDiable", cardId: t.cardId, diableId: t.diableId, targetId }); }

  return (
    <div className="fade">
      <div className="space" style={{ marginBottom: 6 }}>
        <span className="apr-logo" style={{ textAlign: "left" }}><span className="a" style={{ fontSize: 24 }}>apéruno</span></span>
        <button className="btn btn-ghost btn-sm auto" onClick={leave}>Quitter</button>
      </div>

      <div className={"turnbar " + (myTurn ? "mine" : "")}>{myTurn ? "🎯 À toi de jouer !" : `Au tour de ${turnName}`}</div>

      {/* adversaires */}
      <div className="opps">
        {room.players.map((p, i) => p.id !== MYID && (
          <div className={"opp" + (i === room.current ? " turn" : "")} key={p.id}>
            <div className="av-wrap"><Ava p={p} size={40} /></div>
            <div className="stack">{Array.from({ length: Math.min(p.hand.length, 4) }).map((_, k) => <div className="mini" key={k} style={{ left: k * 3, top: k * 2 }} />)}</div>
            <div className="nm">{p.name}</div><div className="cnt">{p.hand.length} cartes</div>
          </div>
        ))}
      </div>

      {/* pioche / défausse */}
      <div className="center-zone">
        <div className="pile"><div className="pile-card pile-back">{room.deck.length}</div><div className="pile-lbl">Pioche</div></div>
        <div className="pile">
          {top ? <div className="pile-card" style={{ background: `linear-gradient(160deg,${TYPE_META[top.type].color},${TYPE_META[top.type].color}cc)`, fontSize: 12, padding: 6, textAlign: "center" }}>{top.label}</div>
            : <div className="pile-card pile-empty">vide</div>}
          <div className="pile-lbl">Défausse</div>
        </div>
      </div>

      {/* main */}
      <div className="space" style={{ alignItems: "baseline" }}>
        <b className="apr-serif" style={{ fontSize: 18 }}>Ta main</b>
        <span className="muted dim">appuie pour les règles · {me.hand.length} cartes</span>
      </div>
      <div className="hand">{me.hand.map((c) => <CardFace key={c.id} c={c} onClick={() => setSheet(c)} />)}</div>

      <button className="btn btn-ghost mt" disabled={!myTurn} onClick={() => act({ type: "pass" })}>Je ne joue rien — piocher 🃏</button>

      {/* fiche carte */}
      {sheet && <CardSheet card={sheet} canPlay={myTurn} hasDiable={hasDiable} close={() => setSheet(null)}
        onSolo={() => playSolo(sheet)} onJeu={() => playJeu(sheet)} onDiable={() => openDiable(sheet)} />}

      {/* choix de cible diable */}
      {target && (
        <Overlay>
          <h3 className="h-title">À qui le diable ? 😈</h3>
          <p className="muted mb">La peine part chez…</p>
          <div className="wrap">
            {room.players.map((p, i) => i !== meIdx && (
              <button key={p.id} className="btn btn-ghost btn-sm auto" onClick={() => sendDiable(p.id)}><Ava p={p} size={24} /> {p.name}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt" onClick={() => setTarget(null)}>Annuler</button>
        </Overlay>
      )}

      {/* réaction au diable */}
      {room.reaction && room.reaction.targetId === MYID && (
        <Overlay>
          <h3 className="h-title">🃏 Un joker !</h3>
          <p className="muted">Tu es visé(e) : « {room.reaction.label} ». Refuse avec ton joker (il quitte ta main) ou subis.</p>
          <div className="row mt"><button className="btn btn-primary btn-sm" onClick={() => act({ type: "reactDiable", choice: "refuse" })}>Refuser 🃏</button>
            <button className="btn btn-ghost btn-sm" onClick={() => act({ type: "reactDiable", choice: "subir" })}>Subir 🍻</button></div>
        </Overlay>
      )}
      {room.reaction && room.reaction.targetId !== MYID && (
        <Overlay><div className="center-col"><p className="muted">😈 {room.players[room.players.findIndex((p) => p.id === room.reaction.targetId)].name} décide de refuser ou subir…</p></div></Overlay>
      )}

      {/* mini-jeu */}
      {room.minigame && <Minigame room={room} act={act} flash={flash} />}
    </div>
  );
}

/* -------------------------------- dé animé ------------------------------- */
function DiceFace({ value, spinning }) {
  const [f, setF] = useState(value);
  useEffect(() => {
    if (!spinning) { setF(value); return; }
    const i = setInterval(() => setF(1 + Math.floor(Math.random() * 6)), 90);
    return () => clearInterval(i);
  }, [spinning, value]);
  return <div className={"dice" + (spinning ? " rolling" : "")}>{DICE[f]}</div>;
}

/* -------------------------------- mini-jeux ------------------------------ */
function Minigame({ room, act }) {
  const mg = room.minigame;
  const g = GAMES.find((x) => x.id === mg.gameId);
  const launcher = room.players[mg.launcherIdx];
  const isLauncher = launcher && launcher.id === MYID;
  const others = room.players.map((p, i) => ({ p, i })).filter((x) => x.p.id !== launcher.id);

  // états locaux
  const [reveal, setReveal] = useState(false);
  const [word, setWord] = useState("");
  const [answers, setAnswers] = useState({});
  const [, force] = useState(0);

  // suspense des dés : on “spin” ~0,9s à l'apparition du résultat
  useEffect(() => {
    if (mg.kind === "inapp_dice" && mg.phase === "result") {
      setReveal(false); const t = setTimeout(() => setReveal(true), 900); return () => clearTimeout(t);
    }
  }, [mg.kind, mg.phase, mg.d1, mg.d2]);

  // tic pour les comptes à rebours (petit bac / regard)
  useEffect(() => {
    if (mg.endsAt) { const i = setInterval(() => force((x) => x + 1), 250); return () => clearInterval(i); }
  }, [mg.endsAt]);

  const waiting = <div className="center-col"><p className="muted">En attente de {launcher.name}…</p></div>;

  return (
    <Overlay>
      <span className="chip mb">🎲 Carte jeu</span>
      <h3 className="h-title">{g.name}</h3>
      <p className="muted mb">{g.rule}</p>

      {/* DÉ */}
      {mg.kind === "inapp_dice" && (
        mg.phase === "intro" ? (
          isLauncher ? (<>
            <p className="muted mb">{launcher.name} défie :</p>
            <div className="wrap">{others.map(({ p }) => <button key={p.id} className="btn btn-blue btn-sm auto" onClick={() => act({ type: "mgDice", oppId: p.id })}>{p.name}</button>)}</div>
          </>) : waiting
        ) : (
          <div className="pop center">
            <div className="dice-row">
              <div><DiceFace value={mg.d1} spinning={!reveal} /><p className="muted mt">{launcher.name}</p></div>
              <div><DiceFace value={mg.d2} spinning={!reveal} /><p className="muted mt">{room.players[mg.oppIdx].name}</p></div>
            </div>
            {!reveal ? <p className="b">Les dés roulent… 🎲</p> : (
              mg.d1 === mg.d2 ? (<>
                <p className="b mb">Égalité, on relance !</p>
                {isLauncher ? <button className="btn btn-primary" onClick={() => act({ type: "mgDice", oppId: room.players[mg.oppIdx].id })}>Relancer</button> : waiting}
              </>) : (<>
                <p className="b mb">{(mg.d1 > mg.d2 ? launcher : room.players[mg.oppIdx]).name} gagne → {(mg.d1 > mg.d2 ? room.players[mg.oppIdx] : launcher).name} boit {Math.abs(mg.d1 - mg.d2)} gorgée(s) 🍻</p>
                {isLauncher ? <button className="btn btn-primary" onClick={() => act({ type: "mgFinishLoser", loserId: (mg.d1 > mg.d2 ? room.players[mg.oppIdx] : launcher).id })}>Terminer le tour</button> : waiting}
              </>)
            )}
          </div>
        )
      )}

      {/* VOTE SECRET */}
      {mg.kind === "inapp_vote" && (
        mg.phase !== "result" ? (
          mg.votes && mg.votes[MYID] ? <div className="center-col"><p className="muted">✅ Vote enregistré. En attente des autres… ({Object.keys(mg.votes).length}/{room.players.length})</p></div> : (
            <div><p className="muted mb">Vote en secret pour celui qui perd :</p>
              <div className="wrap">{room.players.map((p) => p.id !== MYID && <button key={p.id} className="btn btn-ghost btn-sm auto" onClick={() => act({ type: "mgVote", targetId: p.id })}><Ava p={p} size={20} /> {p.name}</button>)}</div></div>
          )
        ) : (
          <div className="pop center">
            <p className="b mb">🏆 Le plus voté : {room.players.find((p) => p.id === mg.loserId).name} — il/elle pioche !</p>
            {isLauncher ? <button className="btn btn-primary" onClick={() => act({ type: "mgFinishLoser", loserId: mg.loserId })}>Terminer le tour</button> : waiting}
          </div>
        )
      )}

      {/* PETIT BAC */}
      {mg.kind === "inapp_letter" && (() => {
        const timeUp = Date.now() > mg.endsAt;
        const left = Math.max(0, Math.ceil((mg.endsAt - Date.now()) / 1000));
        if (mg.phase === "reveal" || timeUp) {
          if (mg.phase !== "reveal") {
            return <div className="center-col"><div className="apr-logo"><span className="a" style={{ fontSize: 54 }}>{mg.letter}</span></div>
              <p className="muted mt">Temps écoulé !</p>{isLauncher ? <button className="btn btn-primary mt" onClick={() => act({ type: "mgReveal" })}>Voir les réponses</button> : waiting}</div>;
          }
          return (
            <div className="pop">
              <p className="muted mb">Lettre : <b className="w">{mg.letter}</b>. Réponses :</p>
              <div className="pb-table">
                {room.players.map((p) => (
                  <div className="pb-row" key={p.id}><b>{p.name}</b>
                    <span className="muted">{PETITBAC_CATS.map((c) => (mg.answers[p.id] && mg.answers[p.id][c]) ? mg.answers[p.id][c] : "—").join(" · ")}</span></div>
                ))}
              </div>
              {isLauncher ? <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinishLoser", loserId: id })} label="Qui a perdu ? (il/elle pioche)" /> : <p className="muted center mt">En attente de {launcher.name}…</p>}
            </div>
          );
        }
        // saisie
        const submitted = !!mg.answers[MYID];
        return (
          <div>
            <div className="center"><div className="apr-logo"><span className="a" style={{ fontSize: 48 }}>{mg.letter}</span></div><p className="b">⏱️ {left}s</p></div>
            {submitted ? <p className="muted center mt">✅ Réponses envoyées. En attente du chrono…</p> : (<>
              {PETITBAC_CATS.map((c) => (
                <input key={c} className="input mb-sm" placeholder={c} value={answers[c] || ""} onChange={(e) => setAnswers({ ...answers, [c]: e.target.value })} />
              ))}
              <button className="btn btn-blue" onClick={() => act({ type: "mgAnswer", answers })}>Valider mes réponses</button>
            </>)}
          </div>
        );
      })()}

      {/* CHRONOS 10 MIN */}
      {mg.kind === "inapp_timer" && (
        isLauncher ? (
          g.id === "motinterdit" ? (
            <div><input className="input mb" placeholder="Mot interdit" value={word} onChange={(e) => setWord(e.target.value)} />
              <button className="btn btn-blue" disabled={!word.trim()} onClick={() => act({ type: "mgStartTimer", label: `Mot interdit : ${word.trim()}` })}>Lancer le chrono 10 min ⏳</button></div>
          ) : (
            <button className="btn btn-blue" onClick={() => act({ type: "mgStartTimer", label: "Ni oui ni non" })}>Lancer le chrono 10 min ⏳</button>
          )
        ) : waiting
      )}

      {/* LE REGARD */}
      {mg.kind === "regard" && (
        mg.phase === "intro" ? (
          isLauncher ? <div className="center-col"><p className="muted mb">Tout le monde fixe la table. Au top, levez les yeux.</p><button className="btn btn-blue" onClick={() => act({ type: "mgRegardCount" })}>Lancer le décompte ⏱️</button></div> : waiting
        ) : (() => {
          const left = Math.ceil((mg.endsAt - Date.now()) / 1000);
          if (left > 0) return <div className="center-col"><div className="apr-logo"><span className="a" style={{ fontSize: 80 }}>{left}</span></div></div>;
          return <div className="pop center"><div className="apr-logo"><span className="a" style={{ fontSize: 60 }}>👀</span></div>
            <p className="b mb">Les joueurs qui se sont regardés boivent une gorgée ! (pas de pioche)</p>
            {isLauncher ? <button className="btn btn-primary" onClick={() => act({ type: "mgFinishNoDraw", text: "👀 Les regards croisés boivent 🍻" })}>Terminer le tour</button> : waiting}</div>;
        })()
      )}

      {/* PHYSIQUE + HORS APP */}
      {(g.kind === "facilitator" || g.kind === "offapp") && (
        isLauncher ? <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinishLoser", loserId: id })} label="Le perdant pioche une carte :" /> : waiting
      )}

      {isLauncher && <button className="btn btn-ghost btn-sm mt" onClick={() => act({ type: "mgCancel" })}>Annuler (récupérer la carte)</button>}
    </Overlay>
  );
}

function DesignateLoser({ players, onPick, label }) {
  return (
    <div><p className="muted mb">{label}</p>
      <div className="wrap">{players.map((p) => <button key={p.id} className="btn btn-gold btn-sm auto" onClick={() => onPick(p.id)}><Ava p={p} size={20} /> {p.name}</button>)}</div>
    </div>
  );
}

/* -------------------------------- victoire ------------------------------- */
function Win({ room, onReplay, leave }) {
  const w = room.players.find((p) => p.id === room.winnerId) || room.players[0];
  const isHost = room.hostId === MYID;
  const winnerIdx = room.players.findIndex((p) => p.id === room.winnerId);
  return (
    <div className="fade center-col" style={{ minHeight: "80dvh" }}>
      <div style={{ fontSize: 60 }}>🏆</div>
      <Ava p={w} size={92} />
      <h2 className="h-title mt">{w.name} gagne !</h2>
      <p className="muted mb">Plus aucune carte en main. Santé 🥂</p>
      {isHost ? <button className="btn btn-primary" style={{ maxWidth: 260 }} onClick={() => onReplay(Math.max(0, winnerIdx))}>Nouvelle manche</button>
        : <p className="muted">En attente de l'hôte pour rejouer…</p>}
      <button className="btn btn-ghost mt" style={{ maxWidth: 260 }} onClick={leave}>Quitter</button>
    </div>
  );
}
