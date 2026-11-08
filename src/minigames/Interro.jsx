import React, { useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";

function Question({ text }) {
  return (
    <div className="panel mb interro-q" style={{ width: "100%", textAlign: "center" }}>
      <span className="dim">📝 Interro surprise</span>
      <b className="apr-serif" style={{ fontSize: 20, display: "block", marginTop: 4 }}>{text}</b>
    </div>
  );
}

/* Interro surprise (rentrée) : le lanceur choisit une question sur lui parmi
   3, les autres répondent, les réponses arrivent sur son téléphone ; il
   désigne ensuite le gagnant (distribue 3) et le perdant (boit 3). */
export function InterroGame({ room, mg, isLauncher, launcher, act, busy }) {
  const [text, setText] = useState("");
  const [winner, setWinner] = useState(null);
  const others = room.players.filter((p) => p.id !== launcher.id);
  const answers = mg.answers || {};
  const nAns = Object.keys(answers).length;

  /* ---- choix de la question (lanceur) ---- */
  if (mg.phase === "choose") {
    if (!isLauncher) return <div className="center-col"><div style={{ fontSize: 50 }}>📝</div><p className="muted">{launcher.name} choisit une question sur sa personne… Révisez bien !</p></div>;
    return (
      <div className="col-gap">
        <p className="muted">Choisis la question de l'interro <span className="dim">(sur toi !)</span> :</p>
        {(mg.options || []).map((q, i) => (
          <button key={i} className="btn btn-ghost interro-opt" disabled={busy} onClick={() => act({ type: "mgInterroPick", idx: i })}>
            {q.replace(/\{n\}/g, launcher.name)}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ type: "mgInterroReroll" })}>🔁 Autres questions</button>
      </div>
    );
  }

  /* ---- réponses ---- */
  if (mg.phase === "answer") {
    if (isLauncher) {
      return (
        <div className="center-col">
          <Question text={mg.question} />
          <p className="muted mb">Les copies arrivent ({nAns}/{others.length}) :</p>
          <AnswerList room={room} answers={answers} />
          <button className="btn btn-primary mt" disabled={busy || !nAns} onClick={() => act({ type: "mgInterroClose" })}>Ramasser les copies ✋</button>
        </div>
      );
    }
    if (answers[MYID]) {
      return (
        <div className="center-col">
          <Question text={mg.question} />
          <p className="muted">✅ Copie rendue : « {answers[MYID]} »</p>
          <p className="muted">En attente des autres… ({nAns}/{others.length})</p>
        </div>
      );
    }
    return (
      <div className="center-col">
        <Question text={mg.question} />
        <input className="input mb" maxLength={120} value={text} placeholder="Ta réponse…" autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) act({ type: "mgInterroAnswer", text }); }} />
        <button className="btn btn-blue" disabled={busy || !text.trim()} onClick={() => act({ type: "mgInterroAnswer", text })}>Rendre ma copie ✍️</button>
      </div>
    );
  }

  /* ---- correction (lanceur) ---- */
  if (!isLauncher) {
    return (
      <div className="center-col">
        <Question text={mg.question} />
        <p className="muted">🧐 {launcher.name} corrige les copies…</p>
      </div>
    );
  }
  const answered = others.filter((p) => answers[p.id]);
  const pool = answered.length ? answered : others;
  const losers = pool.filter((p) => p.id !== winner);
  const send = (loserId) => act({ type: "mgInterroVerdict", winnerId: winner || null, loserId: loserId || null });
  return (
    <div className="center-col">
      <Question text={mg.question} />
      <AnswerList room={room} answers={answers} />
      {winner == null ? (
        <>
          <p className="muted mt mb">🏆 Qui a la meilleure réponse ? <span className="dim">(distribue 3 gorgées)</span></p>
          <div className="wrap" style={{ justifyContent: "center" }}>
            {pool.map((p) => (
              <button key={p.id} className="btn btn-gold btn-sm auto" disabled={busy} onClick={() => setWinner(p.id)}>
                <Ava p={p} size={20} /> {p.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="muted mt mb">📝 Et la pire réponse ? <span className="dim">(boit 3 gorgées)</span></p>
          <div className="wrap" style={{ justifyContent: "center" }}>
            {losers.map((p) => (
              <button key={p.id} className="btn btn-gold btn-sm auto" disabled={busy} onClick={() => send(p.id)}>
                <Ava p={p} size={20} /> {p.name}
              </button>
            ))}
          </div>
          {!losers.length && <button className="btn btn-primary mt" disabled={busy} onClick={() => send(null)}>Valider 🏆</button>}
          <button className="btn btn-ghost btn-sm mt" onClick={() => setWinner(null)}>← Changer le gagnant</button>
        </>
      )}
    </div>
  );
}

function AnswerList({ room, answers }) {
  const rows = room.players.filter((p) => answers[p.id]);
  if (!rows.length) return <p className="dim">Aucune copie pour l'instant…</p>;
  return (
    <div className="pb-table" style={{ width: "100%", marginBottom: 4 }}>
      {rows.map((p) => (
        <div className="pb-row" key={p.id} style={{ textAlign: "left" }}>
          <span className="row" style={{ alignItems: "center", gap: 8 }}><Ava p={p} size={20} /> <b style={{ margin: 0 }}>{p.name}</b></span>
          <span className="w" style={{ display: "block", marginTop: 4 }}>{answers[p.id]}</span>
        </div>
      ))}
    </div>
  );
}
