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
  const city = CITIES[mg.cityIdx];
  const submitted = mg.marks && mg.marks[MYID] != null;

  function pick(e) {
    if (submitted || mg.phase === "result") return;
    const r = stageRef.current.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    setMark({ x: Math.max(0, Math.min(1, cx / r.width)), y: Math.max(0, Math.min(1, cy / r.height)) });
  }

  if (mg.phase === "result") {
    const real = project(city);
    const loser = room.players.find((p) => p.id === mg.loserId);
    return (
      <div className="center-col">
        <p className="muted mb">📍 {city.name} était ici :</p>
        <div className="map-stage">
          <FranceMap />
          <div className="marker" style={{ left: `${real.x * 100}%`, top: `${real.y * 100}%` }}>📍<small>{city.name}</small></div>
          {room.players.map((p) => {
            const m = mg.marks[p.id];
            if (!m) return null;
            return <div key={p.id} className="marker" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, opacity: p.id === mg.loserId ? 1 : 0.75 }}>
              {p.id === mg.loserId ? "❌" : "•"}<small>{p.name} · {m.km} km</small></div>;
          })}
        </div>
        <p className="b mb">{loser.name} est le plus loin → il/elle boit !</p>
        {isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserId: mg.loserId })}>Terminer le tour</button>
          : waiting}
      </div>
    );
  }

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
