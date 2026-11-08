import React, { useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import { SUN_BURN_SIPS, SUN_BRONZE_GIVE } from "../game/seasonal.js";
import { useClock, useRetrySend } from "./hooks.js";

const BRONZE = "Bronzé Mamacita Caramielo";

/* Jauge de chaleur NON graduée : de jaune pâle à rouge brûlant. */
function Gauge({ pct, burnt, burnPct }) {
  return (
    <div className={"sun-gauge" + (burnt ? " burnt" : "")}>
      <span className="sun-fill" style={{ height: `${Math.min(100, pct * 100)}%` }} />
      {burnPct != null && <span className="sun-burnline" style={{ bottom: `${burnPct * 100}%` }}>🔥</span>}
    </div>
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
    return (
      <div className="center-col">
        <div className="sun-row">
          <Gauge pct={pct} burnt={burntNow} />
          <div className="sun-scene">
            <span className="sun-sun" style={{ transform: `scale(${1 + pct * 0.9})`, filter: `hue-rotate(${-pct * 40}deg) saturate(${1 + pct})` }}>☀️</span>
            <span className="sun-me">{burntNow && !inShade ? "🥵" : inShade ? "😎" : pct > 0.6 ? "😰" : pct > 0.3 ? "😅" : "😀"}</span>
            <span className="sun-spot">{inShade ? "⛱️ à l'ombre" : "🏖️ au soleil"}</span>
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
