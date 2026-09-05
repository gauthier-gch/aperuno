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
  // Palier AUDIBLE dès la première seconde : la tension vient de la nappe qui
  // monte en fréquence, du filtre qui s'ouvre et des tics qui s'accélèrent —
  // pas d'un fondu depuis le silence (qui rendait le début inaudible).
  master.gain.value = 0.55;
  // Compresseur + gain de sortie : on peut pousser le volume fort sans que ça
  // sature/craque quand tous les éléments (riser + tics + drop) se cumulent.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 4;
  comp.attack.value = 0.003; comp.release.value = 0.25;
  const outGain = ctx.createGain();
  outGain.gain.value = 1.6; // gain de rattrapage après compression
  master.connect(comp); comp.connect(outGain); outGain.connect(ctx.destination);

  // Riser : nappe qui monte en fréquence pendant tout le build-up.
  const riser = ctx.createOscillator();
  riser.type = "sawtooth";
  const riserGain = ctx.createGain();
  riserGain.gain.value = 0.14;
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
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.start(t); o.stop(t + 0.14);
  };

  const start = (durationMs) => {
    const t = ctx.currentTime;
    const d = durationMs / 1000;
    // Volume : audible tout de suite, monte légèrement (ramp LINÉAIRE depuis un
    // palier audible, et non exponentielle depuis ~0 qui restait muette longtemps).
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0.55, t);
    master.gain.linearRampToValueAtTime(0.95, t + d);
    // Tension : la nappe monte en fréquence et le filtre s'ouvre progressivement.
    riser.frequency.setValueAtTime(120, t);
    riser.frequency.exponentialRampToValueAtTime(900, t + d);
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.exponentialRampToValueAtTime(3500, t + d);
  };

  const drop = () => {
    // Coupe le riser, balance un gros boom + nappe de bruit.
    try { riserGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); } catch {}
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(1.0, t);

    const boom = ctx.createOscillator();
    const bg = ctx.createGain();
    boom.type = "sine"; boom.frequency.setValueAtTime(160, t);
    boom.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    bg.gain.setValueAtTime(1.15, t);
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
    const ng = ctx.createGain(); ng.gain.value = 0.75;
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
  const [phase, setPhase] = useState("intro"); // intro (avertissement son) | playing | dropped
  const [value, setValue] = useState(null);
  const [rolling, setRolling] = useState(false);
  const audioRef = useRef(null);
  const tickTimer = useRef(null);
  const rollTimer = useRef(null);
  const durationRef = useRef(0);
  const audioStart = useRef(null);   // ctx.currentTime au démarrage réel du son
  const wallStart = useRef(0);       // repli horloge murale si pas de WebAudio
  const startedRef = useRef(false);
  const gestureCleanup = useRef(null);

  // Le son ne démarre plus automatiquement : le lanceur lit d'abord
  // l'avertissement (volume + mode silencieux) puis appuie sur « Lancer », ce
  // qui déclenche l'audio (un vrai geste utilisateur = autoplay garanti).
  // Ce useEffect ne gère plus que le nettoyage au démontage.
  useEffect(() => {
    return () => {
      startedRef.current = false;
      clearTimeout(rollTimer.current); clearTimeout(tickTimer.current);
      if (gestureCleanup.current) gestureCleanup.current();
      if (audioRef.current) audioRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Temps écoulé depuis le vrai démarrage du son (ms). Caler la montée et le
  // drop sur l'horloge audio garde tout synchronisé même si, sur mobile, le son
  // ne démarre qu'au premier contact (contexte audio suspendu jusque-là).
  function elapsedMs() {
    const audio = audioRef.current;
    if (audio && audio.ctx) {
      if (audio.ctx.state !== "running") return 0; // en attente d'un geste → figé à 0
      if (audioStart.current == null) {
        audioStart.current = audio.ctx.currentTime;
        audio.start(durationRef.current); // planifie la montée maintenant que le son tourne
      }
      return (audio.ctx.currentTime - audioStart.current) * 1000;
    }
    return Date.now() - wallStart.current; // pas de WebAudio → horloge murale
  }

  // Boucle de « tics » qui s'accélèrent à l'approche du drop, pilotée par le temps réel.
  function scheduleTick() {
    const audio = audioRef.current;
    const running = !audio || (audio.ctx && audio.ctx.state === "running");
    const elapsed = elapsedMs();
    const progress = Math.min(1, elapsed / durationRef.current); // 0 → 1
    if (running && audio) audio.blip(300 + progress * 500);
    if (elapsed >= durationRef.current) { triggerDrop(); return; }
    const gap = running ? Math.max(110, 620 - progress * 500) : 250; // 620ms → 120ms
    tickTimer.current = setTimeout(scheduleTick, gap);
  }

  function startGame() {
    startedRef.current = true;
    const audio = makeAudio();
    audioRef.current = audio;
    const duration = 90000 + Math.floor(Math.random() * 90000); // 1min30 – 3min
    durationRef.current = duration;
    audioStart.current = null;
    wallStart.current = Date.now();
    if (audio) {
      const resume = () => { if (audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {}); };
      resume();
      // Repli mobile : si l'autoplay est bloqué, le premier contact relance le son.
      const onGesture = () => resume();
      window.addEventListener("pointerdown", onGesture, { capture: true });
      window.addEventListener("touchstart", onGesture, { capture: true });
      gestureCleanup.current = () => {
        window.removeEventListener("pointerdown", onGesture, { capture: true });
        window.removeEventListener("touchstart", onGesture, { capture: true });
      };
    }
    scheduleTick();
    setPhase("playing");
  }

  function rollDie() {
    if (rolling || phase !== "playing") return;
    // Le lancer du dé est un vrai geste utilisateur : on (re)débloque le son ici
    // pour garantir qu'il s'entend, même si l'autoplay au montage a été bloqué.
    const audio = audioRef.current;
    if (audio && audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
    setValue(null);
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(30);
    clearTimeout(rollTimer.current);
    rollTimer.current = setTimeout(() => {
      setRolling(false);
      setValue(1 + Math.floor(Math.random() * 6));
    }, 650);
  }

  // Avertissement son AVANT de lancer : le son ne part qu'au clic (geste réel).
  if (phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🥔🔥</div>
        <p className="b" style={{ color: "var(--gold)", fontSize: 18 }}>🔊 Volume à fond + désactive le mode silencieux !</p>
        <p className="muted dim" style={{ fontSize: 13, marginTop: -2 }}>Sur iPhone, le petit switch « silencieux » peut parfois bloquer le son</p>
        <button className="btn btn-primary mt" disabled={busy} onClick={startGame}>Lancer la patate chaude 🥔🔥</button>
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

  // phase playing : juste le dé + le bouton (les règles sont affichées au-dessus).
  const isSix = value === 6;
  return (
    <div className="center-col">
      <div className="dice-row"><div className="dice-col"><Die value={value} rolling={rolling} /></div></div>
      {isSix && !rolling
        ? <p className="b" style={{ color: "var(--gold)", fontSize: 18 }}>6 ! 👉 Passe le téléphone (garde le 6 affiché) !</p>
        : <p className="muted">{rolling ? "…" : "Fais 6 pour pouvoir passer le téléphone."}</p>}
      <button className="btn btn-blue mt" disabled={rolling} onClick={rollDie}>Lancer le dé 🎲</button>
    </div>
  );
}
