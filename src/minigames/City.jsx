import React, { useEffect, useRef, useState } from "react";
import { MYID } from "../me.js";
import { CITIES, project, FRANCE_PATH, CORSICA_PATH } from "../game/cities.js";

function FranceMap() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <path d={FRANCE_PATH} fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.45)" strokeWidth="0.6" strokeLinejoin="round" />
      <path d={CORSICA_PATH} fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.45)" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}

export function CityGame({ room, mg, isLauncher, act, busy, waiting }) {
  const stageRef = useRef(null);
  const [mark, setMark] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewRef = useRef(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const panning = useRef(null);
  const placing = useRef(false);
  const downPt = useRef(null);
  const tapCandidate = useRef(false);
  const city = CITIES[mg.cityIdx];
  const submitted = mg.marks && mg.marks[MYID] != null;

  /* Zoom + déplacement de la carte des résultats. Le déplacement est borné
     pour que la carte ne sorte jamais complètement du cadre. */
  function setView(z, p) {
    const el = viewRef.current;
    const mx = el ? ((z - 1) * el.clientWidth) / 2 : 0;
    const my = el ? ((z - 1) * el.clientHeight) / 2 : 0;
    const c = { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
    zoomRef.current = z; panRef.current = c;
    setZoom(z); setPan(c);
  }

  /* Gestes tactiles en écouteurs NATIFS non passifs : les handlers React
     (onTouchMove) sont passifs, leur preventDefault est ignoré → le geste
     faisait défiler l'arrière-plan au lieu de la carte.
     - carte zoomée : un doigt déplace la carte (rien d'autre ne bouge) ;
     - deux doigts : pincer pour zoomer ;
     - carte non zoomée : un doigt fait défiler la fenêtre (touch-action:pan-y). */
  useEffect(() => {
    const el = viewRef.current;
    if (!el || mg.phase !== "result") return;
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
        const z = Math.max(1, Math.min(4, (g.z * dist(t)) / g.pinch));
        setView(z, g.p);
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
  }, [mg.phase]);

  /* Placement en Pointer Events (unifie souris/tactile). On évite ainsi le
     `click` fantôme émis après un appui long, qui repositionnait le marqueur
     à l'endroit du relâchement (le pin « se décalait tout seul »). */
  function place(e) {
    const r = stageRef.current.getBoundingClientRect();
    setMark({
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    });
  }
  /* Une fois le pin posé :
     - glisser en partant du pin (zone .pin-hit, touch-action:none) le déplace ;
     - glisser ailleurs fait défiler la page (touch-action:pan-y → le navigateur
       scrolle et envoie pointercancel) : on peut descendre valider ;
     - un simple tap ailleurs (sans glisser) replace le pin. */
  function pickDown(e) {
    if (submitted || mg.phase === "result") return;
    downPt.current = { x: e.clientX, y: e.clientY };
    const onPin = e.target.closest && e.target.closest(".pin-hit");
    if (mark && !onPin) { tapCandidate.current = true; return; }
    placing.current = true;
    stageRef.current.setPointerCapture?.(e.pointerId);
    if (!mark) place(e);
  }
  function pickMove(e) {
    if (!downPt.current) return;
    // Seuil anti-tremblement : un appui long immobile ne déplace plus le pin,
    // seul un vrai glissement volontaire le repositionne.
    const d = Math.hypot(e.clientX - downPt.current.x, e.clientY - downPt.current.y);
    if (tapCandidate.current) { if (d >= 8) tapCandidate.current = false; return; }
    if (!placing.current || d < 6) return;
    place(e);
  }
  function pickUp(e) {
    if (tapCandidate.current) place(e);
    tapCandidate.current = false; placing.current = false; downPt.current = null;
  }
  function pickCancel() { tapCandidate.current = false; placing.current = false; downPt.current = null; }

  /* --------- résultats : zoom + liste triée --------- */
  if (mg.phase === "result") {
    const real = project(city);
    const ranked = [...room.players]
      .filter((p) => mg.marks[p.id])
      .sort((a, b) => (mg.marks[a.id].km ?? 1e9) - (mg.marks[b.id].km ?? 1e9));

    // Souris (ordinateur) : glisser pour déplacer la carte zoomée. Le tactile
    // passe par les écouteurs natifs ci-dessus.
    const panStart = (e) => {
      if (e.pointerType !== "mouse") return;
      panning.current = { x: e.clientX, y: e.clientY, p: panRef.current };
    };
    const panMove = (e) => {
      if (!panning.current || zoomRef.current <= 1) return;
      const g = panning.current;
      setView(zoomRef.current, { x: g.p.x + e.clientX - g.x, y: g.p.y + e.clientY - g.y });
    };
    const panEnd = () => { panning.current = null; };
    // quand on zoome, on réduit l'écriture des noms pour éviter qu'ils prennent tout l'écran
    const labelStyle = { transform: `translateX(-50%) scale(${1 / zoom})`, transformOrigin: "top center" };

    return (
      <div className="center-col">
        <p className="muted mb">📍 {city.name} était ici :</p>
        {mg.partial && <p className="dim mb">Arrêt anticipé : seuls {ranked.length}/{room.players.length} joueurs ont placé leur marqueur.</p>}
        <div className="map-viewport" ref={viewRef} style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
          onPointerDown={panStart} onPointerMove={panMove} onPointerUp={panEnd} onPointerLeave={panEnd}>
          <div className="map-zoom" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            <div className="map-stage">
              <FranceMap />
              <div className="marker" style={{ left: `${real.x * 100}%`, top: `${real.y * 100}%` }}>📍<small style={labelStyle}>{city.name}</small></div>
              {ranked.map((p) => {
                const m = mg.marks[p.id];
                return <div key={p.id} className="marker" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, opacity: p.id === mg.loserId ? 1 : 0.8 }}>
                  {p.id === mg.loserId ? "❌" : "•"}<small style={labelStyle}>{p.name}</small></div>;
              })}
            </div>
          </div>
          <div className="map-zoom-ctrl">
            <button onClick={() => setView(Math.min(4, +(zoom + 0.5).toFixed(1)), pan)}>＋</button>
            <button onClick={() => setView(1, { x: 0, y: 0 })}>⟲</button>
            <button onClick={() => setView(Math.max(1, +(zoom - 0.5).toFixed(1)), pan)}>－</button>
          </div>
        </div>
        <p className="dim mb">Pince la carte ou utilise ＋ pour zoomer, puis glisse pour la déplacer.</p>
        <div className="pb-table" style={{ width: "100%" }}>
          {ranked.map((p, i) => (
            <div className="pb-row space" key={p.id}>
              <b>{i === 0 ? "🏆 " : p.id === mg.loserId ? "❌ " : `${i + 1}. `}{p.name}</b>
              <span className="muted">{mg.marks[p.id].km} km</span>
            </div>
          ))}
        </div>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: mg.loserId })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

  /* --------- placement --------- */
  return (
    <div className="center-col">
      <p className="muted mb">Place <b className="w">{city.name}</b> sur la carte :</p>
      <div className="map-stage" ref={stageRef} style={{ touchAction: mark || submitted ? "pan-y" : "none" }}
        onPointerDown={pickDown} onPointerMove={pickMove} onPointerUp={pickUp} onPointerCancel={pickCancel}>
        <FranceMap />
        {(submitted ? mg.marks[MYID] : mark) && (
          <div className="marker" style={{ left: `${(submitted ? mg.marks[MYID].x : mark.x) * 100}%`, top: `${(submitted ? mg.marks[MYID].y : mark.y) * 100}%` }}>📍</div>
        )}
        {mark && !submitted && <div className="pin-hit" style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%` }} />}
      </div>
      {mark && !submitted && <p className="dim mb">Glisse le 📍 pour l'ajuster, ou touche ailleurs pour le replacer.</p>}
      {submitted
        ? <p className="muted">✅ Marqueur posé. En attente des autres… ({Object.keys(mg.marks).length}/{room.players.length})</p>
        : <button className="btn btn-blue" disabled={busy || !mark} onClick={() => act({ type: "mgCityMark", x: mark.x, y: mark.y })}>Valider ma position</button>}
    </div>
  );
}
