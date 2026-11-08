import React, { useMemo, useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import {
  EGG_SCENES, EGG_COUNT, EGG_SHAKE_AT, EGG_GIVE, eggLayout,
} from "../game/seasonal.js";
import { useClock, useRetrySend, usePinchZoom } from "./hooks.js";

/* Le décor d'un lieu : fond (ciel / sol), éléments décoratifs, 20 cachettes.
   Chaque œuf dépasse un peu de derrière sa cachette ; on le touche pour le
   ramasser. */
function Scene({ mg, found, onFind, shake, hideEggs }) {
  const sc = EGG_SCENES[mg.scene] || EGG_SCENES[0];
  const layout = useMemo(() => eggLayout(mg.scene), [mg.scene]);
  const eggAt = useMemo(() => {
    const m = {};
    (mg.eggs || []).forEach((spot, k) => { m[spot] = k; });
    return m;
  }, [mg.eggs]);
  return (
    <div className="egg-scene" style={{ background: `linear-gradient(180deg, ${sc.sky} 0%, ${sc.sky} ${sc.horizon}%, ${sc.ground} ${sc.horizon}%, ${sc.ground} 100%)` }}>
      {sc.deco.map((d, i) => (
        <span key={i} className="egg-deco" style={{ left: `${42 + i * 22}%`, top: `${Math.max(4, sc.horizon / 2 - 8 + (i % 2) * 6)}%` }}>{d}</span>
      ))}
      {layout.map((sp, i) => {
        const k = eggAt[i];
        const hasEgg = k != null && !hideEggs;
        const got = hasEgg && found.has(k);
        const eggW = sp.size * 0.48, eggH = sp.size * 0.62;
        return (
          <div key={i} className="egg-spot" style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: sp.size, height: sp.size, zIndex: 10 + Math.round(sp.y) }}>
            {hasEgg && (
              <span className={"egg" + (shake && !got ? " shake" : "") + (got ? " got" : "")}
                style={{ width: eggW, height: eggH, left: `calc(50% + ${sp.ex * sp.size}px)`, background: eggBg(mg.colors[k]) }} />
            )}
            <span className="egg-obj" style={{ fontSize: sp.size, transform: sp.flip ? "scaleX(-1)" : undefined }}>{sp.emoji}</span>
            {hasEgg && !got && (
              <button className="egg-hit" aria-label="Œuf"
                style={{ width: eggW + 14, height: eggH + 14, left: `calc(50% + ${sp.ex * sp.size}px)` }}
                onClick={() => onFind(k)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
function eggBg(c) {
  return `radial-gradient(circle at 35% 28%, rgba(255,255,255,.75), rgba(255,255,255,0) 38%),
    linear-gradient(170deg, transparent 38%, rgba(255,255,255,.75) 38% 46%, transparent 46% 58%, rgba(0,0,0,.12) 58% 64%, transparent 64%), ${c}`;
}

/* Chasse aux œufs (Pâques) : même lieu et mêmes cachettes pour tous, chacun
   cherche les 10 œufs sur son téléphone pendant 20 s. */
export function EggsGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const playing = mg.phase === "play";
  const now = useClock(100, playing);
  const [found, setFound] = useState(() => new Set());
  const { viewRef, zoom, pan, zoomIn, zoomOut, reset } = usePinchZoom(playing);
  const sc = EGG_SCENES[mg.scene] || EGG_SCENES[0];

  const started = playing && now >= mg.startsAt;
  const timeUp = playing && now >= mg.endsAt;
  const submitted = mg.found && typeof mg.found[MYID] === "number";
  const finished = found.size >= EGG_COUNT || timeUp;
  // J'envoie mon score quand j'ai tout trouvé ou à la fin du chrono.
  useRetrySend(playing && finished && !submitted, () => act({ type: "mgEggDone", found: found.size }));
  // Fin de la chasse (absents ignorés) : le lanceur d'abord, les autres en secours.
  useRetrySend(playing && now >= mg.endsAt + 1200, () => act({ type: "mgEggEnd" }), isLauncher ? 300 : 2500);

  const onFind = (k) => {
    if (!started || timeUp || submitted) return;
    setFound((s) => { const n = new Set(s); n.add(k); return n; });
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {}
  };

  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>{sc.emoji}🥚</div>
        <p className="muted">Lieu de la chasse : <b className="w">{sc.name}</b></p>
        <p className="muted">10 œufs cachés, 20 secondes. Pince l'écran pour zoomer 🔍</p>
        {isLauncher
          ? <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgEggStart" })}>Lancer la chasse 🐣</button>
          : <p className="muted mt">En attente que {launcher.name} lance la chasse…</p>}
      </div>
    );
  }

  if (playing) {
    const left = Math.max(0, mg.endsAt - now);
    const pct = Math.max(0, Math.min(1, left / (mg.endsAt - mg.startsAt)));
    const shake = now >= mg.startsAt + EGG_SHAKE_AT;
    const n = Object.keys(mg.found || {}).length;
    return (
      <div className="center-col">
        <div className="space" style={{ width: "100%" }}>
          <b>{sc.emoji} {sc.name}</b>
          <b className="egg-count">🥚 {found.size}/{EGG_COUNT}</b>
        </div>
        <div className="egg-timer"><span style={{ width: `${pct * 100}%` }} /></div>
        <div className="egg-view" ref={viewRef} style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}>
          <div className="egg-zoom" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            <Scene mg={mg} found={found} onFind={onFind} shake={shake} hideEggs={!started} />
          </div>
          {!started && <div className="egg-ready">Prêts ? 🐣</div>}
          {(finished || submitted) && (
            <div className="egg-ready small">
              {found.size >= EGG_COUNT ? "🎉 Tous trouvés !" : "⏰ Temps écoulé !"}
              <span className="muted">En attente des autres… ({n}/{room.players.length})</span>
            </div>
          )}
          <div className="map-zoom-ctrl">
            <button onClick={zoomIn}>＋</button>
            <button onClick={reset}>⟲</button>
            <button onClick={zoomOut}>－</button>
          </div>
        </div>
        <p className="dim">{shake ? "Les œufs tremblent… vite ! 😱" : "Pince pour zoomer, touche un œuf pour le ramasser."}</p>
      </div>
    );
  }

  /* ---- résultats ---- */
  const rows = room.players
    .filter((p) => typeof mg.found[p.id] === "number")
    .sort((a, b) => mg.found[b.id] - mg.found[a.id]);
  const winners = rows.filter((p) => mg.found[p.id] >= EGG_COUNT);
  return (
    <div className="center-col pop">
      <div style={{ fontSize: 48 }}>🐣🥚🐰</div>
      <div className="pb-table" style={{ width: "100%" }}>
        {rows.map((p) => {
          const f = mg.found[p.id];
          return (
            <div className="pb-row space" key={p.id}>
              <span className="row" style={{ alignItems: "center", gap: 8 }}>
                <Ava p={p} size={24} /> <b style={{ margin: 0 }}>{p.name}</b>
              </span>
              <span className="muted" style={{ textAlign: "right" }}>
                🥚 {f}/{EGG_COUNT}<br />
                <b className="w">{f >= EGG_COUNT ? `distribue ${EGG_GIVE} 🎁` : `boit ${EGG_COUNT - f} 🍻`}</b>
              </span>
            </div>
          );
        })}
      </div>
      {rows.length < room.players.length && <p className="dim mb">Les joueurs absents ne sont pas comptés.</p>}
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: winners.length
              ? `Chasse aux œufs 🐣 : ${winners.map((p) => p.name).join(", ")} ${winners.length > 1 ? "distribuent" : "distribue"} ${EGG_GIVE} gorgées, les autres boivent les œufs manquants 🍻`
              : "Chasse aux œufs 🐣 : chacun boit le nombre d'œufs manquants 🍻",
          })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
