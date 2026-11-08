import { useEffect, useRef, useState } from "react";

/* Horloge locale qui force un rendu toutes les `ms` (tant que `on`). */
export function useClock(ms = 100, on = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(i);
  }, [ms, on]);
  return on ? now : Date.now();
}

/* Envoi « garanti » : tant que `needed` reste vrai (le coup n'apparaît pas
   encore dans l'état du salon), on (ré)envoie `send` après `delay` ms puis
   toutes les ~2,5 s. Utile quand tous les téléphones écrivent en même temps
   (fin de chrono, appui au zéro…) : une transaction refusée est rejouée. */
export function useRetrySend(needed, send, delay = 0) {
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (!needed) return;
    let last = 0;
    const tick = () => {
      if (Date.now() - last < 2500) return;
      last = Date.now();
      sendRef.current();
    };
    const t0 = setTimeout(() => { tick(); }, delay);
    const iv = setInterval(tick, 600);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, [needed, delay]);
}

/* Zoom (pincer à deux doigts / boutons) + déplacement d'un décor dans un
   cadre. Écouteurs tactiles NATIFS non passifs (preventDefault effectif).
   - zoomé : un doigt déplace le décor ;
   - non zoomé : un doigt laisse la page défiler. */
export function usePinchZoom(enabled = true, max = 3) {
  const viewRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  function setView(z, p) {
    const el = viewRef.current;
    const mx = el ? ((z - 1) * el.clientWidth) / 2 : 0;
    const my = el ? ((z - 1) * el.clientHeight) / 2 : 0;
    const c = { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
    zoomRef.current = z; panRef.current = c;
    setZoom(z); setPan(c);
  }

  useEffect(() => {
    const el = viewRef.current;
    if (!el || !enabled) return;
    let g = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e) => {
      const t = e.touches;
      if (t.length >= 2) {
        g = { pinch: dist(t) || 1, z: zoomRef.current, p: panRef.current };
        e.preventDefault();
      } else if (zoomRef.current > 1) {
        g = { x: t[0].clientX, y: t[0].clientY, p: panRef.current };
      } else g = null;
    };
    const move = (e) => {
      if (!g) return;
      e.preventDefault();
      const t = e.touches;
      if (g.pinch) {
        if (t.length < 2) return;
        setView(Math.max(1, Math.min(max, (g.z * dist(t)) / g.pinch)), g.p);
      } else {
        setView(zoomRef.current, { x: g.p.x + t[0].clientX - g.x, y: g.p.y + t[0].clientY - g.y });
      }
    };
    const end = (e) => {
      if (!g) return;
      if (e.touches.length === 0) g = null;
      else if (g.pinch && e.touches.length === 1 && zoomRef.current > 1) {
        const t = e.touches[0];
        g = { x: t.clientX, y: t.clientY, p: panRef.current };
      } else if (g.pinch) g = null;
    };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [enabled, max]);

  const zoomIn = () => setView(Math.min(max, +(zoom + 0.5).toFixed(1)), pan);
  const zoomOut = () => setView(Math.max(1, +(zoom - 0.5).toFixed(1)), pan);
  const reset = () => setView(1, { x: 0, y: 0 });
  return { viewRef, zoom, pan, zoomIn, zoomOut, reset };
}

/* Petits sons 100 % Web Audio (aucun fichier). Contexte créé au premier
   geste de l'utilisateur (sinon le navigateur le bloque). */
export function makeSfx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp); comp.connect(ctx.destination);
  const blip = (f1, f2, dur = 0.15, type = "sine", vol = 0.6) => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.08);
  };
  const boom = () => {
    const t = ctx.currentTime;
    blip(170, 30, 0.9, "sine", 1);
    const len = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const n = ctx.createBufferSource(); n.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = 0.8;
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t);
  };
  const close = () => { try { setTimeout(() => ctx.close(), 1500); } catch (e) {} };
  return { blip, boom, close };
}
