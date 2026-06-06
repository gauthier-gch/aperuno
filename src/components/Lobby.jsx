import React, { useState } from "react";
import { MYID } from "../me.js";
import { Ava } from "./common.jsx";

export function Lobby({ room, onStart, leave, online = {} }) {
  const isHost = room.hostId === MYID;
  const [picking, setPicking] = useState(false);
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={leave}>← Quitter</button>
      <div className="center-col" style={{ marginBottom: 18 }}>
        <p className="muted">Code du salon — partage-le !</p>
        <div className="code-big">{room.code}</div>
        <span className="chip">{room.mode === "chill" ? "😎 Chill" : "🔥 Harr"}</span>
      </div>
      <p className="muted mb">Joueurs connectés ({room.players.length}/10)</p>
      <div className="players-grid">
        {room.players.map((p) => (
          <div className="pcard" key={p.id}>
            <Ava p={p} size={46} online={online[p.id] !== false} />
            <span className="nm">{p.name}{p.id === room.hostId ? " 👑" : ""}</span>
          </div>
        ))}
      </div>
      {isHost ? (
        !picking ? (
          <button className="btn btn-primary mt-lg" disabled={room.players.length < 2} onClick={() => setPicking(true)}>
            {room.players.length < 2 ? "En attente d'autres joueurs…" : "Lancer → qui commence ?"}
          </button>
        ) : (
          <div className="panel mt-lg">
            <p className="muted">Qui achète l'engagement et commence ? 🥃 <span className="dim">(l'engagement se boit hors appli)</span></p>
            <div className="wrap mt">
              {room.players.map((p, i) => (
                <button key={p.id} className="btn btn-gold btn-sm auto" onClick={() => onStart(i)}>
                  <Ava p={p} size={22} /> {p.name}
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <p className="muted center mt-lg">En attente que l'hôte lance la partie…</p>
      )}
    </div>
  );
}
