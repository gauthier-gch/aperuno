import React, { useEffect, useRef, useState } from "react";
import { makeSfx } from "./hooks.js";

/* Seuil d'explosion (nombre de coups d'arrosoir), tiré au lancement. */
const MIN_WATER = 8, MAX_WATER = 34;
const PETALS = ["🌸", "🌷", "🌼", "💮", "🌸", "🌺", "🌷", "🌼"];

/* Arrose la fleur (printemps) : sur le modèle de la Piraterie, un seul
   téléphone qu'on se passe. La fleur grossit à chaque arrosage… jusqu'à
   exploser. Tout est local au téléphone du lanceur. */
export function FleurGame({ room, isLauncher, launcher, act, busy }) {
  const harr = room.mode !== "chill";
  const penalty = harr ? "finit son verre cul sec 🥃" : "boit 5 gorgées 🍻";
  const [phase, setPhase] = useState("intro"); // intro | playing | boom
  const [water, setWater] = useState(0);
  const [turnWater, setTurnWater] = useState(0);
  const [handoff, setHandoff] = useState(false);
  const [drops, setDrops] = useState([]);
  const limitRef = useRef(0);
  const sfx = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => { clearTimeout(timer.current); if (sfx.current) sfx.current.close(); }, []);

  if (!isLauncher) {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🌷💧</div>
        <p className="muted">La fleur pousse sur le téléphone de <b className="w">{launcher.name}</b>.</p>
        <p className="muted">Passez-vous l'appareil : celui qui la fait exploser {penalty} !</p>
      </div>
    );
  }

  function start() {
    sfx.current = makeSfx();
    limitRef.current = MIN_WATER + Math.floor(Math.random() * (MAX_WATER - MIN_WATER + 1));
    setWater(0); setTurnWater(0); setHandoff(false);
    setPhase("playing");
  }
  function pour() {
    if (phase !== "playing") return;
    setHandoff(false);
    const next = water + 1;
    const id = Math.random();
    setDrops((d) => [...d.slice(-4), id]);
    if (next >= limitRef.current) {
      if (sfx.current) sfx.current.boom();
      if (navigator.vibrate) navigator.vibrate([400, 120, 600]);
      setWater(next);
      setPhase("boom");
      return;
    }
    if (sfx.current) sfx.current.blip(900 + next * 25, 500, 0.12, "sine", 0.5);
    if (navigator.vibrate) navigator.vibrate(20);
    setWater(next);
    setTurnWater((n) => n + 1);
  }
  function pass() {
    setTurnWater(0);
    setHandoff(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHandoff(false), 1600);
  }

  if (phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🌱💧</div>
        <p className="b" style={{ color: "var(--gold)", fontSize: 16 }}>🔊 Monte le son !</p>
        <p className="muted mt">Chacun son tour, arrose la fleur autant que tu oses puis passe le téléphone. Celui qui la fait exploser {penalty}</p>
        <button className="btn btn-primary mt" disabled={busy} onClick={start}>Planter la fleur 🌷</button>
      </div>
    );
  }

  // La fleur grossit à chaque arrosage (et tremble de plus en plus).
  const scale = 1 + water * 0.055;
  const wobble = Math.min(10, water * 0.35);

  if (phase === "boom") {
    return (
      <div className="center-col pop">
        <div className="flower-stage">
          <div className="flower-boom">💥</div>
          {PETALS.map((p, i) => (
            <span key={i} className="petal" style={{ "--a": `${i * 45}deg` }}>{p}</span>
          ))}
          <div className="flower-pot" />
        </div>
        <p className="b" style={{ fontSize: 22 }}>BOUM ! La fleur a explosé 💥</p>
        <p className="muted mb">Celui qui tient le téléphone {penalty}</p>
        <button className="btn btn-primary" disabled={busy} onClick={() => act({
          type: "mgFinish",
          text: `Arrose la fleur 🌷 : celui qui l'a fait exploser ${penalty}`,
        })}>Terminer le tour</button>
      </div>
    );
  }

  return (
    <div className="center-col">
      <p className="muted">
        {handoff ? <b className="w">👉 Passe le téléphone au joueur suivant !</b> : "Arrose… puis passe le téléphone quand tu veux."}
      </p>
      <div className="flower-stage" onClick={pour}>
        {drops.map((id) => <span key={id} className="drop">💧</span>)}
        <div className="flower" style={{ transform: `scale(${scale})`, "--wob": `${wobble}deg` }}>
          <span className="flower-head">🌷</span>
        </div>
        <div className="flower-pot" />
      </div>
      <button className="btn btn-blue" disabled={busy} onClick={pour}>Arroser 💧</button>
      <button className="btn btn-ghost btn-sm mt" disabled={busy || turnWater === 0} onClick={pass}>Passer le téléphone 👉</button>
    </div>
  );
}
