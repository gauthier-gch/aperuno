import React, { useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import { NY_COUNT, NY_HIDE_BELOW, NY_GRACE } from "../game/seasonal.js";
import { useClock, useRetrySend } from "./hooks.js";

/* Écart affiché : « 0,05 s trop tôt » / « 0,12 s trop tard ». */
function fmtDelta(d) {
  if (d == null) return "pas appuyé";
  const v = (Math.abs(d) / 1000).toFixed(2).replace(".", ",");
  return d === 0 ? "pile ! 0,00 s" : `${v} s ${d < 0 ? "trop tôt" : "trop tard"}`;
}

/* Le compte à rebours (New Year) : décompte synchronisé, chiffres cachés
   sous 5, chacun appuie sur « Bonne année ! » au moment du zéro. L'écart est
   mesuré sur l'horloge du téléphone de chacun (même horloge que l'affichage). */
export function NewYearGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  const counting = mg.phase === "count";
  const now = useClock(50, counting);
  const [local, setLocal] = useState(null); // écart mesuré localement (ms)
  const stored = mg.clicks && typeof mg.clicks[MYID] === "number";

  // Mon appui doit arriver dans l'état (gros embouteillage au zéro → on réessaie).
  useRetrySend(counting && local != null && !stored, () => act({ type: "mgNyClick", delta: local }));
  // 5 s après le zéro : fin (le lanceur d'abord, les autres en secours).
  const over = counting && now >= mg.zeroAt + NY_GRACE;
  useRetrySend(over, () => act({ type: "mgNyEnd" }), isLauncher ? 300 : 2500);

  if (mg.phase === "intro") {
    return (
      <div className="center-col">
        <div style={{ fontSize: 56 }}>🎆🥂</div>
        <p className="muted">Un décompte de <b className="w">10 secondes</b> va s'afficher chez tout le monde. À partir de 5, les chiffres disparaissent !</p>
        <p className="muted">Appuie sur <b className="w">« Bonne année ! 🎉 »</b> pile au zéro.</p>
        {isLauncher
          ? <button className="btn btn-blue mt" disabled={busy} onClick={() => act({ type: "mgNyStart" })}>Lancer le décompte 🎆</button>
          : <p className="muted mt">En attente que {launcher.name} lance le décompte…</p>}
      </div>
    );
  }

  if (mg.phase === "count") {
    const started = now >= mg.startsAt;
    const sec = Math.max(0, NY_COUNT - Math.floor((now - mg.startsAt) / 1000));
    const show = started && sec >= NY_HIDE_BELOW && now < mg.zeroAt;
    const clicked = stored || local != null;
    const n = Object.keys(mg.clicks || {}).length;
    return (
      <div className="center-col">
        <div className={"ny-count" + (show ? "" : " hidden")} key={show ? sec : "hidden"}>
          {!started ? "Prêts ?" : show ? sec : "?"}
        </div>
        <p className="muted mb">{!started ? "Ça commence…" : show ? "Concentre-toi sur le rythme…" : "Les chiffres ont disparu… compte dans ta tête !"}</p>
        {clicked
          ? <p className="muted">🎉 C'est noté ! En attente des autres… ({n}/{room.players.length})</p>
          : (
            <button className="btn ny-btn" disabled={!started}
              onClick={() => { const d = Date.now() - mg.zeroAt; setLocal(d); act({ type: "mgNyClick", delta: d }); }}>
              Bonne année ! 🎉
            </button>
          )}
      </div>
    );
  }

  /* ---- résultats ---- */
  const byId = Object.fromEntries(room.players.map((p) => [p.id, p]));
  const rows = (mg.ranking || []).filter((r) => byId[r.id]);
  const best = rows[0] && rows[0].delta != null ? byId[rows[0].id] : null;
  return (
    <div className="center-col pop">
      <div style={{ fontSize: 52 }}>🎆🎉🥂</div>
      <p className="b mb" style={{ fontSize: 20 }}>Bonne année !</p>
      <div className="pb-table" style={{ width: "100%" }}>
        {rows.map((r, i) => {
          const p = byId[r.id];
          return (
            <div className="pb-row space" key={r.id}>
              <span className="row" style={{ alignItems: "center", gap: 8 }}>
                <b style={{ margin: 0 }}>{r.delta == null ? "❌" : i === 0 ? "🏆" : `${i + 1}.`}</b>
                <Ava p={p} size={24} /> <b style={{ margin: 0 }}>{p.name}</b>
              </span>
              <span className="muted" style={{ textAlign: "right" }}>
                {fmtDelta(r.delta)}{r.sips ? <><br /><b className="w">boit {r.sips} 🍻</b></> : null}
              </span>
            </div>
          );
        })}
      </div>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({
            type: "mgFinish",
            text: best ? `Compte à rebours 🎆 : ${best.name} est le plus précis ! Les retardataires boivent 🍻` : "Compte à rebours 🎆 : personne n'a appuyé, tout le monde boit 🍻",
          })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
