import React, { useEffect, useRef, useState } from "react";
import { isInstalledApp } from "../util.js";

/* Tirer vers le bas (en haut de la page) pour recharger, comme dans un
   navigateur. Utile surtout pour l'appli installée sur l'écran d'accueil, qui
   n'a ni bouton ni geste de rechargement. Dans un navigateur, on laisse le
   geste natif faire (sinon il y aurait deux rechargements).
   Le code du salon est mémorisé (localStorage) : on revient directement dans
   la partie après le rechargement. */

const THRESHOLD = 80;   // distance (px, après amortissement) pour déclencher
const MAX_PULL = 120;
// Zones où un glissé vertical sert au jeu (cartes, poire, schémas…) : jamais
// de rechargement depuis là.
const NO_PULL = ".map-viewport, .map-stage, .pin-hit, .pear-zone, .pear-stage, .rd-box, input, textarea, [data-no-pull]";

/* Le geste ne compte que si la zone qui défile sous le doigt est déjà tout
   en haut (fenêtre ouverte → sa feuille ; sinon la page). */
function atTop(target) {
  const sheet = target.closest && target.closest(".sheet");
  if (sheet) return sheet.scrollTop <= 0;
  if (document.querySelector(".overlay")) return false; // fond d'une fenêtre ouverte
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
}

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [reloading, setReloading] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!isInstalledApp()) return;
    const set = (v) => { pullRef.current = v; setPull(v); };
    const onStart = (e) => {
      if (e.touches.length !== 1) { start.current = null; return; }
      const t = e.target;
      if ((t.closest && t.closest(NO_PULL)) || !atTop(t)) { start.current = null; return; }
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: false };
    };
    const onMove = (e) => {
      const s = start.current;
      if (!s) return;
      const dx = e.touches[0].clientX - s.x;
      const dy = e.touches[0].clientY - s.y;
      if (!s.active) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        // geste horizontal (main de cartes…) ou vers le haut : on abandonne.
        if (dy <= 0 || Math.abs(dx) > dy) { start.current = null; return; }
        s.active = true;
      }
      set(Math.min(MAX_PULL, Math.max(0, dy) * 0.5));
    };
    const onEnd = () => {
      const s = start.current;
      start.current = null;
      if (!s || !s.active) return;
      if (pullRef.current >= THRESHOLD) {
        setReloading(true);
        setTimeout(() => window.location.reload(), 150);
      } else set(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (!pull && !reloading) return null;
  const ready = reloading || pull >= THRESHOLD;
  return (
    <div className="ptr" style={{ transform: `translate(-50%, ${reloading ? THRESHOLD * 0.6 : pull * 0.6}px)` }}>
      <span className={"ptr-ic" + (reloading ? " spin" : "")}
        style={reloading ? undefined : { transform: `rotate(${pull * 3}deg)` }}>🔄</span>
      <span className="ptr-lbl">{reloading ? "Rechargement…" : ready ? "Relâche pour recharger" : "Tire pour recharger"}</span>
    </div>
  );
}
