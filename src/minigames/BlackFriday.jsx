import React from "react";
import { Ava } from "../components/common.jsx";

/* Black Friday : le lanceur choisit un joueur. Pendant 10 minutes, dès que le
   lanceur boit, ce joueur boit aussi (chrono « BF : lanceur → joueur »). */
export function BlackFridayGame({ isLauncher, launcher, others, act, busy, waiting }) {
  if (!isLauncher) return waiting;
  return (
    <div className="center-col">
      <div className="bf-tag"><span>-50%</span><b>1 acheté = 1 offert</b></div>
      <p className="muted mb">{launcher.name}, à qui offres-tu tes gorgées pendant 10 min ?</p>
      <div className="wrap">
        {others.map(({ p }) => (
          <button key={p.id} className="btn btn-gold btn-sm auto" disabled={busy}
            onClick={() => act({ type: "mgBfPick", targetId: p.id })}>
            <Ava p={p} size={20} /> {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
