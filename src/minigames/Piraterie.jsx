import React, { useEffect, useRef, useState } from "react";

const CHEST_COUNT = 20;

/* Audio 100 % Web Audio (aucun fichier externe) : un petit « clac » à l'ouverture
   d'un coffre vide, et un gros « boom » d'explosion quand on déterre la bombe.
   Le contexte est créé au clic « Lancer » (geste utilisateur) → son garanti. */
function makeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 1.2;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -28; comp.knee.value = 18; comp.ratio.value = 10;
  comp.attack.value = 0.003; comp.release.value = 0.25;
  const outGain = ctx.createGain();
  outGain.gain.value = 3.2;
  // Compression plus forte + gros gain de rattrapage = volume perçu nettement
  // plus élevé ; le limiteur final empêche toute saturation (craquements).
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1.5; limiter.knee.value = 0; limiter.ratio.value = 20;
  limiter.attack.value = 0.001; limiter.release.value = 0.1;
  master.connect(comp); comp.connect(outGain); outGain.connect(limiter); limiter.connect(ctx.destination);

  // Petit « clac » de couvercle qui s'ouvre (coffre vide).
  const click = () => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.16);
  };

  // Explosion : boom grave qui descend + salve de bruit blanc filtré (impact).
  const boom = () => {
    const t = ctx.currentTime;
    const bo = ctx.createOscillator();
    const bg = ctx.createGain();
    bo.type = "sine";
    bo.frequency.setValueAtTime(180, t);
    bo.frequency.exponentialRampToValueAtTime(32, t + 0.9);
    bg.gain.setValueAtTime(1.2, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    bo.connect(bg); bg.connect(master);
    bo.start(t); bo.stop(t + 1.2);

    const len = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const noise = ctx.createBufferSource(); noise.buffer = buf;
    const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 800;
    const ng = ctx.createGain(); ng.gain.value = 0.85;
    noise.connect(nf); nf.connect(ng); ng.connect(master);
    noise.start(t);
  };

  const stop = () => {
    try {
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      setTimeout(() => { try { ctx.close(); } catch {} }, 400);
    } catch {}
  };

  return { ctx, click, boom, stop };
}

export function PiraterieGame({ isLauncher, launcher, act, busy }) {
  const [phase, setPhase] = useState("intro");   // intro | playing | boom
  const [opened, setOpened] = useState([]);        // index des coffres ouverts (vides)
  const [turnOpened, setTurnOpened] = useState(0); // coffres ouverts par le joueur en cours
  const [handoff, setHandoff] = useState(false);   // message « passe le téléphone »
  const bombRef = useRef(null);
  const audioRef = useRef(null);
  const handoffTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(handoffTimer.current);
      if (audioRef.current) audioRef.current.stop();
    };
  }, []);

  if (!isLauncher) {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🏴‍☠️💣</div>
        <p className="muted">La Piraterie sur le téléphone de <b className="w">{launcher.name}</b>.</p>
        <p className="muted">Passez-vous l'appareil à tour de rôle. Celui qui déterre la bombe finit son verre 🥃 !</p>
      </div>
    );
  }

  function startGame() {
    audioRef.current = makeAudio();
    bombRef.current = Math.floor(Math.random() * CHEST_COUNT);
    setOpened([]);
    setTurnOpened(0);
    setHandoff(false);
    setPhase("playing");
  }

  function openChest(i) {
    if (phase !== "playing" || opened.includes(i)) return;
    setHandoff(false);
    if (i === bombRef.current) {
      if (audioRef.current) audioRef.current.boom();
      if (navigator.vibrate) navigator.vibrate([400, 120, 600]);
      setPhase("boom");
      return;
    }
    if (audioRef.current) audioRef.current.click();
    if (navigator.vibrate) navigator.vibrate(25);
    setOpened((o) => [...o, i]);
    setTurnOpened((n) => n + 1);
  }

  function passPhone() {
    setTurnOpened(0);
    setHandoff(true);
    clearTimeout(handoffTimer.current);
    handoffTimer.current = setTimeout(() => setHandoff(false), 1600);
  }

  if (phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🏴‍☠️💰</div>
        <p className="b" style={{ color: "var(--gold)", fontSize: 18 }}>🔊 Monte le son + désactive le mode silencieux !</p>
        <p className="muted dim" style={{ fontSize: 13, marginTop: -2 }}>L'explosion doit s'entendre. Sur iPhone, le switch « silencieux » peut bloquer le son.</p>
        <p className="muted mt">20 coffres, une seule bombe 💣. Chacun son tour, ouvre autant de coffres que tu oses puis passe le téléphone.</p>
        <button className="btn btn-primary mt" disabled={busy} onClick={startGame}>Lancer La Piraterie 🏴‍☠️</button>
      </div>
    );
  }

  if (phase === "boom") {
    return (
      <div className="center-col pop">
        <div style={{ fontSize: 64 }}>💥💣</div>
        <p className="b" style={{ fontSize: 22 }}>BOUM ! Tu tiens le téléphone → cul sec 🥃</p>
        <p className="muted mb">Celui qui a déterré la bombe finit son verre !</p>
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={() => act({ type: "mgFinish", text: "La Piraterie : celui qui a déterré la bombe finit son verre cul sec 🥃" })}>
          Terminer le tour
        </button>
      </div>
    );
  }

  // phase playing : la grille de coffres.
  return (
    <div className="center-col">
      <p className="muted">
        {handoff
          ? <b className="w">👉 Passe le téléphone au joueur suivant !</b>
          : "Touche un coffre pour l'ouvrir… puis passe le téléphone quand tu veux."}
      </p>
      <div className="pirate-grid">
        {Array.from({ length: CHEST_COUNT }).map((_, i) => {
          const isOpen = opened.includes(i);
          return (
            <button
              key={i}
              className={"chest" + (isOpen ? " open empty" : "")}
              disabled={isOpen}
              onClick={() => openChest(i)}
              aria-label={isOpen ? "Coffre ouvert (vide)" : "Coffre fermé"}>
              <span className="chest-face">{isOpen ? "💨" : "🧰"}</span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-blue mt" disabled={busy || turnOpened === 0} onClick={passPhone}>
        Passer le téléphone 👉
      </button>
    </div>
  );
}
