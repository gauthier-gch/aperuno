import React, { useState } from "react";
import { GAMES, SUGGEST_EMAIL, APP_NAME, CONTACT_EMAIL, LEGAL_UPDATED } from "../game/constants.js";

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

      <div className="home-foot">
        <p className="muted dim">🔞 Réservé aux 18 ans et plus — l'abus d'alcool est dangereux pour la santé, à consommer avec modération.</p>
        <p className="muted dim">
          <a onClick={() => go("terms")} className="foot-link">CGU</a>
          <span> · </span>
          <a onClick={() => go("privacy")} className="foot-link">Confidentialité</a>
        </p>
      </div>
    </div>
  );
}

/* Porte d'âge affichée à l'arrivée : le joueur déclare sur l'honneur être
   majeur avant d'accéder au jeu (qui met en scène la consommation d'alcool). */
export function AgeGate({ onConfirm }) {
  const [refused, setRefused] = useState(false);

  if (refused) {
    return (
      <div className="overlay">
        <div className="sheet pop" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46 }}>🔞</div>
          <h2 className="h-title" style={{ marginTop: 8 }}>Accès réservé aux majeurs</h2>
          <p className="muted mb">
            {APP_NAME} est un jeu de soirée qui met en scène la consommation d'alcool,
            <b className="w"> strictement réservé aux personnes de 18 ans et plus</b>.
            Reviens quand tu seras majeur(e) 🍸
          </p>
          <button className="btn btn-ghost" onClick={() => setRefused(false)}>← Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="sheet pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🔞</div>
        <h2 className="h-title" style={{ marginTop: 8 }}>Tu es bien majeur(e) ?</h2>
        <p className="muted mb">
          {APP_NAME} est un jeu de soirée qui met en scène la consommation d'alcool.
          Il est <b className="w">strictement réservé aux personnes de 18 ans et plus</b>.
          L'abus d'alcool est dangereux pour la santé, à consommer avec modération.
        </p>
        <p className="muted dim mb">
          En continuant, je déclare sur l'honneur être âgé(e) d'au moins 18 ans et
          accepter les <b>CGU</b> d'{APP_NAME}.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn-primary" onClick={onConfirm}>
            ✅ Je confirme être majeur(e) sur l'honneur
          </button>
          <button className="btn btn-ghost" onClick={() => setRefused(true)}>
            Je n'ai pas 18 ans
          </button>
        </div>
      </div>
    </div>
  );
}

export function Terms({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Conditions d'utilisation</h2>
      <p className="muted dim mb">Dernière mise à jour : {LEGAL_UPDATED}</p>

      <div className="panel mb">
        <p className="b w mb-sm">🔞 Réservé aux majeurs</p>
        <p className="muted">{APP_NAME} est un jeu de soirée qui met en scène la consommation d'alcool. Il est <b>strictement réservé aux personnes de 18 ans et plus</b>. En utilisant l'application, tu déclares être majeur(e).</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">🍹 Consommation responsable</p>
        <p className="muted">L'abus d'alcool est dangereux pour la santé. Bois avec modération, jamais sous la contrainte, et arrête quand tu veux. Ne joue pas si tu es enceinte, si tu dois conduire, si tu prends des médicaments incompatibles ou si tu as un problème avec l'alcool. Chaque joueur reste seul responsable de ce qu'il boit. Les « gorgées », « secs » et « cul secs » proposés par le jeu peuvent toujours être remplacés par une boisson sans alcool.</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">📋 Usage de l'application</p>
        <p className="muted">{APP_NAME} est fourni gratuitement, « en l'état », sans garantie. Tu t'engages à ne pas en détourner l'usage et à ne pas y publier de contenu illicite, haineux ou portant atteinte à autrui (notamment dans les prénoms et photos). L'éditeur peut faire évoluer ou interrompre le service à tout moment.</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">⚖️ Responsabilité</p>
        <p className="muted">L'éditeur décline toute responsabilité quant aux conséquences directes ou indirectes liées à l'utilisation du jeu et à la consommation d'alcool. L'utilisation se fait sous ta seule responsabilité.</p>
      </div>

      <div className="panel">
        <p className="b w mb-sm">✉️ Éditeur & contact</p>
        <p className="muted">Éditeur : {APP_NAME}. Contact : <a href={`mailto:${CONTACT_EMAIL}`} className="foot-link">{CONTACT_EMAIL}</a>. Les présentes conditions sont soumises au droit français.</p>
      </div>
    </div>
  );
}

export function Privacy({ back }) {
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Politique de confidentialité</h2>
      <p className="muted dim mb">Dernière mise à jour : {LEGAL_UPDATED}</p>

      <div className="panel mb">
        <p className="b w mb-sm">👤 Responsable</p>
        <p className="muted">Le responsable du traitement est {APP_NAME}. Pour toute question ou pour exercer tes droits : <a href={`mailto:${CONTACT_EMAIL}`} className="foot-link">{CONTACT_EMAIL}</a>.</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">🗂️ Données collectées</p>
        <p className="muted">
          • le <b>prénom</b> que tu saisis ;<br />
          • une <b>photo de profil</b>, <b>facultative</b> (elle n'est demandée que si tu l'ajoutes) ;<br />
          • un <b>identifiant d'appareil</b> (stocké dans ton navigateur) et un <b>identifiant anonyme</b> Firebase, pour te reconnecter à ta partie ;<br />
          • des <b>données techniques</b> gérées par notre hébergeur (adresse IP, journaux) nécessaires au fonctionnement.
        </p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">🎯 Finalités & base légale</p>
        <p className="muted">Ces données servent uniquement à faire fonctionner le jeu multijoueur en temps réel (exécution du service). L'ajout d'une <b>photo</b> repose sur ton <b>consentement</b> : tu peux jouer sans photo, et ne pas en ajouter n'empêche rien.</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">☁️ Hébergement & partage</p>
        <p className="muted">Les données de partie sont hébergées via <b>Google Firebase</b> (Firestore / Authentification). Le prénom et la photo que tu choisis sont visibles par les autres joueurs du <b>même salon</b>. Nous ne vendons ni ne louons tes données, et ne les utilisons pas à des fins publicitaires.</p>
      </div>

      <div className="panel mb">
        <p className="b w mb-sm">⏳ Conservation</p>
        <p className="muted">Les salons (prénoms, photos, état de partie) sont <b>supprimés automatiquement</b> après environ <b>12 h d'inactivité</b>. Les identifiants stockés dans ton navigateur restent tant que tu ne les effaces pas (vider les données du site les supprime).</p>
      </div>

      <div className="panel">
        <p className="b w mb-sm">🔐 Tes droits</p>
        <p className="muted">Tu disposes d'un droit d'accès, de rectification, d'effacement et d'opposition. Comme les salons s'effacent seuls sous 12 h, la plupart des données disparaissent d'elles-mêmes ; pour toute demande, écris à <a href={`mailto:${CONTACT_EMAIL}`} className="foot-link">{CONTACT_EMAIL}</a>. Nous n'utilisons pas de cookies publicitaires, seulement du stockage local technique.</p>
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
