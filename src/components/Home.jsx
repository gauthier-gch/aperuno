import React from "react";
import { GAMES } from "../game/constants.js";

const LOGO = `${import.meta.env.BASE_URL}logo_aperuno.png`;

export function Home({ go }) {
  return (
    <div className="fade">
      <div style={{ position: "relative", marginTop: 24, marginBottom: 30 }}>
        <span className="apr-deco" style={{ left: 6, top: -6 }}>🍸</span>
        <span className="apr-deco" style={{ right: 8, top: 10 }}>😈</span>
        <span className="apr-deco" style={{ left: 30, top: 86 }}>🍻</span>
        <img className="apr-logo-img" src={LOGO} alt="apéruno" />
        <div className="apr-logo">
          <span className="a">apéruno</span>
          <span className="sub">On se tue chill ou Harr ?</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => go("create")}><span className="ico">🎴</span> Créer une partie</button>
        <button className="btn btn-blue" onClick={() => go("join")}><span className="ico">🔗</span> Rejoindre une partie</button>
        <button className="btn btn-ghost" onClick={() => go("rules")}><span className="ico">📜</span> Règles</button>
        <button className="btn btn-ghost" onClick={() => go("minijeux")}><span className="ico">🎲</span> Mini-jeux</button>
      </div>
    </div>
  );
}

export function Rules({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Règles</h2>
      <div className="panel mb">
        <p className="muted"><b className="w">But.</b> Se débarrasser de toutes ses cartes. Premier à 0 carte = gagnant.</p>
      </div>
      <div className="panel mb">
        <p className="muted">
          <b className="w">Chaque tour :</b><br />
          1️⃣ Tu <b>pioches</b> obligatoirement une carte.<br />
          2️⃣ Puis tu <b>joues</b> obligatoirement une carte.<br /><br />
          Comme tu pioches puis joues, le seul moyen de réduire ta main est de poser
          <b> plusieurs cartes d'un coup</b> :<br />
          • <b style={{ color: "#ff6f86" }}>Cartes identiques</b> → empile-les (2 × « 2 gorgées » = 4 gorgées).<br />
          • <b style={{ color: "#c78bff" }}>Action + Diable</b> → un autre boit (tu poses 2 cartes).<br />
          • <b style={{ color: "#00c6c6" }}>Échange de main</b> → tu échanges toute ta main avec un adversaire.<br />
          • <b style={{ color: "#27d17c" }}>Joker</b> / <b style={{ color: "#ff9b2f" }}>Relance</b> → se jouent en réaction (et quittent ta main).
        </p>
      </div>
      <div className="panel">
        <p className="muted">
          <b style={{ color: "#37a6ff" }}>Cartes Jeu</b> → lancent un mini-jeu. Le <b>perdant boit</b> (plus de pioche !).
          Une carte posée ne peut pas être reprise.
        </p>
      </div>
    </div>
  );
}

export function MiniList({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Mini-jeux</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GAMES.map((g) => (
          <div className="panel" key={g.id} style={{ padding: 14 }}>
            <div className="space">
              <b className="apr-serif" style={{ fontSize: 18 }}>{g.name}</b>
              <span className="chip">
                {g.harrOnly ? "🔥 Harr" : g.kind === "offapp" ? "hors app" : (g.kind === "facilitator" || g.kind === "regard") ? "physique" : "in-app"}
              </span>
            </div>
            <p className="muted mt">{g.rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
