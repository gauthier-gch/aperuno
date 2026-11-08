import React, { useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import { SUN_BURN_SIPS, SUN_BRONZE_GIVE } from "../game/seasonal.js";
import { useClock, useRetrySend } from "./hooks.js";

const BRONZE = "Bronzé Mamacita Caramielo";

/* Thermomètre NON gradué : le mercure monte avec la chaleur. */
function Thermometer({ pct, burnt }) {
  const h = 172 * Math.min(1, Math.max(0, pct));
  return (
    <svg className={"sun-thermo" + (burnt ? " burnt" : "")} viewBox="0 0 44 240" aria-label="Thermomètre">
      <defs>
        <linearGradient id="merc" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff9b2f" /><stop offset="1" stopColor="#ff2d55" />
        </linearGradient>
      </defs>
      <rect x="13" y="6" width="18" height="196" rx="9" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      <circle cx="22" cy="212" r="20" fill="#ff3b5c" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      <rect x="17.5" y={196 - h} width="9" height={h + 8} rx="4.5" fill="url(#merc)" />
      <circle cx="16" cy="206" r="5" fill="rgba(255,255,255,.45)" />
    </svg>
  );
}

/* Teinte de peau : de pâle à bien bronzé (rouge en cas de coup de soleil). */
const PALE = [247, 220, 200], TAN = [122, 69, 36];
function skinColor(tan, burnt) {
  if (burnt) return "#e5533f";
  const k = Math.min(1, Math.max(0, tan));
  const c = PALE.map((v, i) => Math.round(v + (TAN[i] - v) * k));
  return `rgb(${c.join(",")})`;
}

/* Le bonhomme en maillot de bain, qui bronze petit à petit. */
function Bather({ tan, burnt, shaded }) {
  const skin = skinColor(tan, burnt);
  return (
    <svg className="sun-bather" viewBox="0 0 60 112" aria-label="Bonhomme">
      <line x1="22" y1="40" x2="10" y2="62" stroke={skin} strokeWidth="6" strokeLinecap="round" />
      <line x1="38" y1="40" x2="50" y2="62" stroke={skin} strokeWidth="6" strokeLinecap="round" />
      <line x1="25" y1="70" x2="22" y2="104" stroke={skin} strokeWidth="7" strokeLinecap="round" />
      <line x1="35" y1="70" x2="38" y2="104" stroke={skin} strokeWidth="7" strokeLinecap="round" />
      <rect x="19" y="32" width="22" height="36" rx="9" fill={skin} />
      <rect x="19" y="58" width="22" height="14" rx="4" fill="#37a6ff" />
      <circle cx="30" cy="17" r="13" fill={skin} />
      <path d="M17 14 Q30 0 43 14 Q36 8 30 9 Q24 8 17 14 Z" fill="#5a3a1a" />
      {shaded ? (
        <g><rect x="20" y="13" width="9" height="6" rx="2" fill="#111" /><rect x="31" y="13" width="9" height="6" rx="2" fill="#111" /><line x1="29" y1="15" x2="31" y2="15" stroke="#111" strokeWidth="1.5" /></g>
      ) : (
        <g><circle cx="25" cy="16" r="1.6" fill="#222" /><circle cx="35" cy="16" r="1.6" fill="#222" /></g>
      )}
      <path d={burnt ? "M25 24 Q30 20 35 24" : "M25 22 Q30 26 35 22"} stroke="#222" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {!shaded && !burnt && tan > 0.45 && <path d="M44 8 Q46 13 44 15 Q42 13 44 8 Z" fill="#7ec8ff" className="sun-sweat" />}
    </svg>
  );
}

/* Coup de soleil (été) : la chaleur monte ; chacun part à l'ombre quand il
   veut. À un moment caché (dans la partie haute), ceux encore au soleil
   brûlent. Le dernier parti sans brûler devient le bronzé 😎. */
export function SunGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const playing = mg.phase === "play";
  const now = useClock(80, playing);
  const [local, setLocal] = useState(null);
  const shade = mg.shade || {};
  const stored = typeof shade[MYID] === "number";
  const t = playing ? now - mg.startsAt : 0;
  const burntNow = playing && t >= mg.burn;

  useRetrySend(playing && local != null && !stored && local < mg.burn, () => act({ type: "mgSunShade", t: local }));
  useRetrySend(playing && burntNow, () => act({ type: "mgSunEnd" }), isLauncher ? 300 : 2500);

  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>☀️🏖️</div>
        <p className="muted">La chaleur va monter petit à petit. Va à l'ombre quand tu veux… mais pas trop tôt : le dernier à partir sans brûler devient le <b className="w">{BRONZE}</b> 😎</p>
        {isLauncher
          ? <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgSunStart" })}>Tout le monde au soleil ☀️</button>
          : <p className="muted mt">En attente que {launcher.name} lance la séance bronzage…</p>}
      </div>
    );
  }

  if (playing) {
    const started = t >= 0;
    const pct = Math.max(0, t) / mg.duration;
    const inShade = stored || (local != null && local < mg.burn);
    // Bronzage figé au moment où l'on part à l'ombre.
    const shadeAt = stored ? shade[MYID] : local;
    // (rapporté à la durée totale, pas au coup de soleil : rien ne trahit son moment)
    const tan = (inShade ? shadeAt : Math.max(0, t)) / (mg.duration * 0.9);
    return (
      <div className="center-col">
        <div className="sun-row">
          <Thermometer pct={pct} burnt={burntNow} />
          <div className="sun-scene">
            <span className="sun-sun" style={{ transform: `scale(${1 + pct * 0.9})` }}>☀️</span>
            <div className="sun-shade-zone"><span className="sun-parasol">⛱️</span></div>
            <div className={"sun-me" + (inShade ? " shaded" : "")}>
              <Bather tan={tan} burnt={burntNow && !inShade} shaded={inShade} />
            </div>
          </div>
        </div>
        {!started ? <p className="b">Prêts ? Crème solaire… 🧴</p>
          : burntNow ? <p className="b sun-burn">🔥 COUP DE SOLEIL ! 🔥</p>
          : <p className="muted">La chaleur monte… 🌡️</p>}
        <div className="wrap" style={{ justifyContent: "center", margin: "6px 0 10px" }}>
          {room.players.map((p) => (
            <span key={p.id} className={"sun-chip" + (typeof shade[p.id] === "number" ? " shade" : "")}>
              <Ava p={p} size={20} /> {p.name} {typeof shade[p.id] === "number" ? "⛱️" : "☀️"}
            </span>
          ))}
        </div>
        {inShade
          ? <p className="muted">⛱️ Tu es à l'ombre. Les autres osent rester…</p>
          : (
            <button className="btn btn-blue" disabled={!started || burntNow}
              onClick={() => { const v = Date.now() - mg.startsAt; setLocal(v); act({ type: "mgSunShade", t: v }); }}>
              Aller à l'ombre ⛱️
            </button>
          )}
      </div>
    );
  }

  /* ---- résultats ---- */
  const burnt = room.players.filter((p) => typeof shade[p.id] !== "number");
  const bronze = room.players.find((p) => p.id === mg.bronzeId);
  const order = room.players.filter((p) => typeof shade[p.id] === "number").sort((a, b) => shade[b.id] - shade[a.id]);
  return (
    <div className="center-col pop">
      {bronze ? (
        <>
          <div className="sun-winner"><Ava p={bronze} size={84} /></div>
          <p className="b" style={{ fontSize: 18 }}>{bronze.name} est le {BRONZE} 😎</p>
          <p className="muted mb">Il/elle distribue <b className="w">{SUN_BRONZE_GIVE} gorgées</b> et garde ses lunettes jusqu'au prochain coup de soleil.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 52 }}>🥵</div>
          <p className="b mb">Personne n'est allé à l'ombre à temps !</p>
        </>
      )}
      <div className="pb-table" style={{ width: "100%" }}>
        {order.map((p, i) => (
          <div className="pb-row space" key={p.id}>
            <span className="row" style={{ alignItems: "center", gap: 8 }}><b style={{ margin: 0 }}>{i === 0 ? "😎" : "⛱️"}</b> {p.name}</span>
            <span className="muted">à l'ombre après {(shade[p.id] / 1000).toFixed(1).replace(".", ",")} s</span>
          </div>
        ))}
        {burnt.map((p) => (
          <div className="pb-row space" key={p.id}>
            <span className="row" style={{ alignItems: "center", gap: 8 }}><b style={{ margin: 0 }}>🥵</b> {p.name}</span>
            <b className="w">coup de soleil : boit {SUN_BURN_SIPS} 🍻</b>
          </div>
        ))}
      </div>
      <p className="dim mb">Le coup de soleil est tombé à {(mg.burn / 1000).toFixed(1).replace(".", ",")} s.</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: [
              bronze ? `😎 ${bronze.name} est le ${BRONZE} et distribue ${SUN_BRONZE_GIVE} gorgées` : null,
              burnt.length ? `🥵 ${burnt.map((p) => p.name).join(", ")} ${burnt.length > 1 ? "boivent" : "boit"} ${SUN_BURN_SIPS} gorgées` : null,
            ].filter(Boolean).join(" · ") || "Coup de soleil terminé ☀️",
          })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
