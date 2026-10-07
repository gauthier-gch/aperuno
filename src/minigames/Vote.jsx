import React from "react";
import { MYID } from "../me.js";
import { Ava } from "../components/common.jsx";
import { PromptChooser } from "./PromptChooser.jsx";

function Question({ text }) {
  return (
    <div className="panel mb" style={{ width: "100%", textAlign: "center" }}>
      <b className="apr-serif" style={{ fontSize: 20 }}>{text}</b>
    </div>
  );
}

export function VoteGame({ room, mg, isLauncher, launcher, act, busy, waiting }) {
  /* ---- intro : le lanceur choisit la question (suggestion ou la sienne) ---- */
  if (mg.phase === "intro") {
    return <PromptChooser mg={mg} isLauncher={isLauncher} launcher={launcher} act={act} busy={busy}
      what="la question" placeholder="Écris ta propre question…" startLabel="Lancer le vote 🗳️" />;
  }

  if (mg.phase !== "result") {
    if (mg.votes && mg.votes[MYID]) {
      return (
        <div className="center-col">
          <Question text={mg.word} />
          <p className="muted">✅ Vote enregistré. En attente des autres… ({Object.keys(mg.votes).length}/{room.players.length})</p>
        </div>
      );
    }
    return (
      <div>
        <Question text={mg.word} />
        <p className="muted mb">Vote en secret (tu peux voter pour toi) — le plus voté boit :</p>
        <div className="wrap">
          {room.players.map((p) => (
            <button key={p.id} className="btn btn-ghost btn-sm auto" disabled={busy} onClick={() => act({ type: "mgVote", targetId: p.id })}>
              <Ava p={p} size={20} /> {p.name}{p.id === MYID ? " (moi)" : ""}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const losers = (mg.loserIds || []).map((id) => room.players.find((p) => p.id === id)).filter(Boolean);
  const names = losers.map((p) => p.name).join(", ");
  const many = losers.length > 1;
  return (
    <div className="pop center">
      {mg.word && <Question text={mg.word} />}
      <p className="b mb">🏆 {many ? "Égalité ! " : ""}{names} {many ? "boivent" : "boit"} !</p>
      {isLauncher
        ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", loserIds: mg.loserIds })}>Terminer le tour</button>
        : waiting}
    </div>
  );
}
