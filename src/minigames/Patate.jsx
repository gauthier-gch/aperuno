import React, { useEffect, useRef, useState } from "react";

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, rolling }) {
  const [shown, setShown] = useState(value || 1);
  useEffect(() => {
    if (rolling) {
      const i = setInterval(() => setShown(1 + Math.floor(Math.random() * 6)), 80);
      return () => clearInterval(i);
    }
    if (value) setShown(value);
  }, [rolling, value]);
  const face = PIPS[shown] || PIPS[1];
  return (
    <div className={"die" + (rolling ? " rolling" : "")}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span className="cell" key={i}>{face.includes(i) ? <span className="pip" /> : null}</span>
      ))}
    </div>
  );
}

/* Moteur audio « build-up + drop » 100 % Web Audio (aucun fichier externe).
   Tension montante (riser + tics qui s'accélèrent) puis gros drop. */
function makeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  // Riser : nappe qui monte en fréquence pendant tout le build-up.
  const riser = ctx.createOscillator();
  riser.type = "sawtooth";
  const riserGain = ctx.createGain();
  riserGain.gain.value = 0.06;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500;
  riser.connect(lp); lp.connect(riserGain); riserGain.connect(master);
  riser.start();

  const blip = (freq) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square"; o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(master);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.start(t); o.stop(t + 0.14);
  };

  const start = (durationMs) => {
    const t = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.5, t + durationMs / 1000);
    riser.frequency.setValueAtTime(120, t);
    riser.frequency.exponentialRampToValueAtTime(900, t + durationMs / 1000);
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.exponentialRampToValueAtTime(3500, t + durationMs / 1000);
  };

  const drop = () => {
    // Coupe le riser, balance un gros boom + nappe de bruit.
    try { riserGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); } catch {}
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0.7, t);

    const boom = ctx.createOscillator();
    const bg = ctx.createGain();
    boom.type = "sine"; boom.frequency.setValueAtTime(160, t);
    boom.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    bg.gain.setValueAtTime(0.9, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    boom.connect(bg); bg.connect(master);
    boom.start(t); boom.stop(t + 1.2);

    // Bruit blanc filtré (impact).
    const len = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const noise = ctx.createBufferSource(); noise.buffer = buf;
    const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 900;
    const ng = ctx.createGain(); ng.gain.value = 0.5;
    noise.connect(nf); nf.connect(ng); ng.connect(master);
    noise.start(t);
  };

  const stop = () => {
    try {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.1);
      setTimeout(() => { try { riser.stop(); ctx.close(); } catch {} }, 400);
    } catch {}
  };

  return { ctx, start, blip, drop, stop };
}

export function PatateGame({ mg, isLauncher, launcher, act, busy }) {
  const [phase, setPhase] = useState("ready"); // ready | playing | dropped
  const [value, setValue] = useState(null);
  const [rolling, setRolling] = useState(false);
  const audioRef = useRef(null);
  const dropTimer = useRef(null);
  const tickTimer = useRef(null);
  const rollTimer = useRef(null);
  const startedAt = useRef(0);
  const durationRef = useRef(0);

  // Nettoyage à la fermeture du composant.
  useEffect(() => () => {
    clearTimeout(dropTimer.current); clearTimeout(rollTimer.current); clearTimeout(tickTimer.current);
    if (audioRef.current) audioRef.current.stop();
  }, []);

  if (!isLauncher) {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🥔🔥</div>
        <p className="muted">Patate chaude sur le téléphone de <b className="w">{launcher.name}</b>.</p>
        <p className="muted">Passez-vous l'appareil dès qu'un 6 tombe. Celui qui l'a au drop finit son verre 🥃 !</p>
      </div>
    );
  }

  function triggerDrop() {
    clearTimeout(tickTimer.current);
    if (audioRef.current) audioRef.current.drop();
    if (navigator.vibrate) navigator.vibrate([300, 120, 500, 120, 500]);
    setRolling(false);
    setPhase("dropped");
  }

  // Boucle de « tics » qui s'accélèrent à l'approche du drop.
  function scheduleTick() {
    const elapsed = Date.now() - startedAt.current;
    const progress = Math.min(1, elapsed / durationRef.current); // 0 → 1
    const gap = 620 - progress * 500; // 620ms → 120ms
    if (audioRef.current) audioRef.current.blip(300 + progress * 500);
    tickTimer.current = setTimeout(scheduleTick, Math.max(110, gap));
  }

  function startGame() {
    const audio = makeAudio();
    audioRef.current = audio;
    const duration = 30000 + Math.floor(Math.random() * 30000); // 30–60 s
    durationRef.current = duration;
    startedAt.current = Date.now();
    if (audio) {
      if (audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
      audio.start(duration);
    }
    scheduleTick();
    dropTimer.current = setTimeout(triggerDrop, duration);
    setPhase("playing");
  }

  function rollDie() {
    if (rolling || phase !== "playing") return;
    setValue(null);
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(30);
    clearTimeout(rollTimer.current);
    rollTimer.current = setTimeout(() => {
      setRolling(false);
      setValue(1 + Math.floor(Math.random() * 6));
    }, 650);
  }

  if (phase === "ready") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🥔🔥</div>
        <p className="muted mb">Un seul téléphone : on se le passe ! Monte le son 🔊, la tension va monter…</p>
        <button className="btn btn-primary" onClick={startGame}>Lancer la patate 🔥🎵</button>
      </div>
    );
  }

  if (phase === "dropped") {
    return (
      <div className="center-col pop">
        <div style={{ fontSize: 64 }}>💥🥔</div>
        <p className="b" style={{ fontSize: 22 }}>DROP ! Tu tiens le téléphone → cul sec 🥃</p>
        <p className="muted mb">Celui qui a l'appareil finit son verre !</p>
        <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: "Patate chaude : celui qui tenait le téléphone finit son verre cul sec 🥃" })}>Terminer le tour</button>
      </div>
    );
  }

  // phase playing
  const isSix = value === 6;
  return (
    <div className="center-col">
      <p className="muted">🎵 La tension monte… lance le dé !</p>
      <div className="dice-row"><div className="dice-col"><Die value={value} rolling={rolling} /></div></div>
      {isSix && !rolling
        ? <p className="b" style={{ color: "var(--gold)", fontSize: 18 }}>6 ! 👉 Passe le téléphone (garde le 6 affiché) !</p>
        : <p className="muted">{rolling ? "…" : "Fais 6 pour pouvoir passer le téléphone."}</p>}
      <button className="btn btn-blue mt" disabled={rolling} onClick={rollDie}>Lancer le dé 🎲</button>
    </div>
  );
}
