import React, { useState } from "react";
import { GAMES, SUGGEST_EMAIL } from "../game/constants.js";

const LOGO = `${import.meta.env.BASE_URL}logo_aperuno.png`;

const SUGGEST_HREF = `mailto:${SUGGEST_EMAIL}` +
  `?subject=${encodeURIComponent("apéruno — suggestion d'amélioration")}` +
  `&body=${encodeURIComponent("Salut !\n\nVoici mon idée pour améliorer apéruno :\n\n")}`;

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
        <button className="btn btn-ghost" onClick={() => go("install")}><span className="ico">📱</span> Installe l'app sur ton tél</button>
        <a className="btn btn-ghost" href={SUGGEST_HREF} style={{ textDecoration: "none" }}><span className="ico">💡</span> Suggérer une amélioration</a>
      </div>
    </div>
  );
}

function CopyLink() {
  const [done, setDone] = useState(false);
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(window.location.href); } catch (e) {}
    setDone(true); setTimeout(() => setDone(false), 1800);
  };
  return (
    <a onClick={copy} style={{ color: "var(--gold)", textDecoration: "underline", cursor: "pointer" }}>
      {done ? "lien copié ✅" : "en cliquant ici"}
    </a>
  );
}

export function Install({ back }) {
  const Step = ({ n, children }) => (
    <div className="step"><span className="step-n">{n}</span><span>{children}</span></div>
  );
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Installe apéruno 📱</h2>
      <p className="muted mb">💡 Ajoute Apéruno à ton écran d'accueil pour l'ouvrir comme une vraie app !</p>

      <div className="panel mb">
        <p className="b w mb-sm"> Sur iPhone (Safari)</p>
        <Step n="1">Ouvre le lien du jeu dans <b>Safari</b> (copie-colle l'adresse <CopyLink /> si besoin).</Step>
        <Step n="2">Appuie sur le bouton <b>Partager</b> <span className="dim">(le carré avec une flèche ↑, en bas de l'écran)</span>.</Step>
        <Step n="3">Fais défiler et choisis <b>« Sur l'écran d'accueil »</b>.</Step>
        <Step n="4">Appuie sur <b>Ajouter</b> — l'icône apéruno apparaît sur ton écran d'accueil ! 🍸</Step>
      </div>

      <div className="panel">
        <p className="b w mb-sm">🤖 Sur Android (Chrome)</p>
        <Step n="1">Ouvre le lien du jeu dans <b>Chrome</b> (copie-colle l'adresse <CopyLink /> si besoin).</Step>
        <Step n="2">Appuie sur les <b>⋮ trois petits points</b> (en haut à droite).</Step>
        <Step n="3">Choisis <b>« Ajouter à l'écran d'accueil »</b> (ou « Installer l'application »).</Step>
        <Step n="4">Confirme avec <b>Ajouter</b>. 🍸</Step>
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
        <p className="muted"><b className="w">🎯 Objectif :</b> Se débarrasser de toutes ses cartes. Le premier à vider son jeu gagne et distribue un cul sec 🥃.</p>
      </div>
      <div className="panel mb">
        <p className="muted">
          <b className="w">Chaque tour :</b><br />
          1️⃣ Tu <b>pioches</b> obligatoirement une carte.<br />
          2️⃣ Puis tu <b>joues</b> une carte — ou tu <b>passes</b>.<br /><br />
          Comme tu pioches puis joues, le seul moyen de réduire ta main est de poser
          <b> plusieurs cartes d'un coup</b> :<br />
          • <b style={{ color: "#ff6f86" }}>Cartes identiques</b> → empile-les (2 × « 2 gorgées » = 4 gorgées).<br />
          • <b style={{ color: "#c78bff" }}>Action + Diable</b> → un autre boit (tu poses 2 cartes).<br />
          • <b style={{ color: "#00c6c6" }}>Échange de main</b> → tu échanges toute ta main avec un adversaire.<br />
          • <b style={{ color: "#12b3a6" }}>Échange de carte</b> → tu défausses une carte et en pioches une nouvelle.<br />
          • <b style={{ color: "#27d17c" }}>Joker</b> / <b style={{ color: "#ff9b2f" }}>Relance</b> → se jouent en réaction (et quittent ta main).
        </p>
      </div>
      <div className="panel">
        <p className="muted">
          <b style={{ color: "#37a6ff" }}>Les cartes Jeu</b> lancent un mini-jeu. En général, le <b>perdant du mini-jeu boit</b>.
        </p>
      </div>
    </div>
  );
}

/* Un jeu est « hors-app » quand l'appli ne fait que le lancer/annoncer (le jeu
   se joue à l'oral ou physiquement) ; sinon il est piloté « in-app ». */
const HORS_APP_KINDS = ["offapp", "facilitator", "regard", "inapp_connexion"];

export function MiniList({ back }) {
  const games = [...GAMES].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Mini-jeux</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {games.map((g) => {
          const horsApp = HORS_APP_KINDS.includes(g.kind);
          return (
            <div className={"panel" + (g.harrOnly ? " harr-mini" : "")} key={g.id} style={{ padding: 14 }}>
              <div className="space">
                <b className="apr-serif" style={{ fontSize: 18 }}>{g.name}</b>
                <div className="row" style={{ gap: 6, flex: "0 0 auto" }}>
                  <span className="chip">{horsApp ? "hors-app" : "in-app"}</span>
                  {g.harrOnly && <span className="chip harr-chip">🔥 Harr</span>}
                </div>
              </div>
              <p className="muted mt">{g.rule}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
