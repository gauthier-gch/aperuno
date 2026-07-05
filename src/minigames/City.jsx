import React, { useRef, useState } from "react";
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
  const panning = useRef(null);
  const city = CITIES[mg.cityIdx];
  const submitted = mg.marks && mg.marks[MYID] != null;

  function pick(e) {
    if (submitted || mg.phase === "result") return;
    const r = stageRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    setMark({ x: Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (t.clientY - r.top) / r.height)) });
  }

  /* --------- résultats : zoom + liste triée --------- */
  if (mg.phase === "result") {
    const real = project(city);
    const ranked = [...room.players]
      .filter((p) => mg.marks[p.id])
      .sort((a, b) => (mg.marks[a.id].km ?? 1e9) - (mg.marks[b.id].km ?? 1e9));

    const panStart = (e) => { const t = e.touches ? e.touches[0] : e; panning.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y }; };
    const panMove = (e) => {
      if (!panning.current || zoom <= 1) return;
      e.preventDefault?.();
      const t = e.touches ? e.touches[0] : e;
      setPan({ x: panning.current.px + (t.clientX - panning.current.x), y: panning.current.py + (t.clientY - panning.current.y) });
    };
    const panEnd = () => { panning.current = null; };
    // quand on zoome, on réduit l'écriture des noms pour éviter qu'ils prennent tout l'écran
    const labelStyle = { transform: `translateX(-50%) scale(${1 / zoom})`, transformOrigin: "top center" };

    return (
      <div className="center-col">
        <p className="muted mb">📍 {city.name} était ici :</p>
        <div className="map-viewport"
          onPointerDown={panStart} onPointerMove={panMove} onPointerUp={panEnd} onPointerLeave={panEnd}
          onTouchStart={panStart} onTouchMove={panMove} onTouchEnd={panEnd}>
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
            <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}>＋</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>⟲</button>
            <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}>－</button>
          </div>
        </div>
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
      <div className="map-stage" ref={stageRef} onClick={pick} onTouchStart={pick} onTouchMove={pick}>
        <FranceMap />
        {(submitted ? mg.marks[MYID] : mark) && (
          <div className="marker" style={{ left: `${(submitted ? mg.marks[MYID].x : mark.x) * 100}%`, top: `${(submitted ? mg.marks[MYID].y : mark.y) * 100}%` }}>📍</div>
        )}
      </div>
      {submitted
        ? <p className="muted">✅ Marqueur posé. En attente des autres… ({Object.keys(mg.marks).length}/{room.players.length})</p>
        : <button className="btn btn-blue" disabled={busy || !mark} onClick={() => act({ type: "mgCityMark", x: mark.x, y: mark.y })}>Valider ma position</button>}
    </div>
  );
}
