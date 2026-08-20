import React, { useRef, useState } from "react";
import { MYID } from "../me.js";
import { compressPhoto } from "../util.js";
import { createRoom, joinRoom } from "../net/useRoom.js";
import { Overlay } from "./common.jsx";
import {
  GAMES, defaultPremium, PREMIUM_CARD_SCALES, PREMIUM_GAME_MAX,
  PREMIUM_MAX_MULT, PREMIUM_SIPS_MAX, MODE_INFO, premiumRecos,
} from "../game/constants.js";
import { buildDeck } from "../game/deck.js";

/* Une réglette (slider) du mode premium. */
function Scale({ label, ic, value, min = 0, max, onChange, hint }) {
  return (
    <div className="pscale">
      <div className="pscale-head">
        <span className="pscale-lbl">{ic ? ic + " " : ""}{label}</span>
        <span className="pscale-val">{value}{hint || ""}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/* Reco personnalisée sur la composition premium (dans la modale de confirmation). */
function PremiumReco({ cfg }) {
  const recos = premiumRecos(cfg);
  const total = buildDeck("premium", cfg).length;
  return (
    <div className="reco-box">
      <p className="reco-title">💡 Notre reco sur ta composition <span className="dim">({total} cartes)</span></p>
      {recos.length ? (
        <ul className="reco-list">
          {recos.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      ) : (
        <p className="muted">👌 Composition bien équilibrée — bonne partie !</p>
      )}
    </div>
  );
}

/* Panneau de composition du paquet (mode premium). */
function PremiumConfig({ cfg, setCfg }) {
  const setGame = (id, v) => setCfg({ ...cfg, games: { ...cfg.games, [id]: v } });
  const total = buildDeck("premium", cfg).length;
  return (
    <div className="panel premium-panel">
      <p className="muted mb-sm">Compose ton paquet 💎 <span className="dim">(défaut = mode Harr)</span></p>
      {PREMIUM_CARD_SCALES.map((c) => (
        <Scale key={c.key} ic={c.ic} label={c.label} value={cfg[c.key]}
          max={c.classic * PREMIUM_MAX_MULT}
          onChange={(v) => setCfg({ ...cfg, [c.key]: v })} />
      ))}
      <Scale ic="🥃" label="Gorgées perdant mini-jeu" min={1} max={PREMIUM_SIPS_MAX}
        value={cfg.mgSips} onChange={(v) => setCfg({ ...cfg, mgSips: v })} />
      <p className="muted mt mb-sm">Mini-jeux <span className="dim">(0 à {PREMIUM_GAME_MAX} · 🔥 = jeux Harr)</span></p>
      {GAMES.map((g) => (
        <Scale key={g.id} label={g.name + (g.harrOnly ? " 🔥" : "")} value={cfg.games[g.id]}
          max={PREMIUM_GAME_MAX} onChange={(v) => setGame(g.id, v)} />
      ))}
      <p className="muted center mt">Paquet : <b>{total}</b> cartes</p>
    </div>
  );
}

function PhotoName({ name, setName, photo, setPhoto }) {
  const fileRef = useRef();
  return (
    <>
      <div className="row" style={{ alignItems: "center" }}>
        <label style={{ flex: "0 0 auto" }}>
          <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && compressPhoto(e.target.files[0], setPhoto)} />
          {photo
            ? <img className="avatar" style={{ width: 52, height: 52 }} src={photo} alt="" />
            : <div className="avatar" style={{ width: 52, height: 52, fontSize: 22 }}>📷</div>}
        </label>
        <input className="input" placeholder="Ton prénom" value={name} maxLength={14}
          onChange={(e) => setName(e.target.value)} />
      </div>
      <p className="muted dim" style={{ marginTop: 6 }}>📷 Photo facultative — ton prénom suffit. En l'ajoutant, tu acceptes qu'elle soit visible par les joueurs de ton salon et stockée temporairement (supprimée sous ~12 h).</p>
    </>
  );
}

export function CreateForm({ back, onDone, flash }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [mode, setMode] = useState("chill");
  const [premium, setPremium] = useState(defaultPremium);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  function review() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    setConfirm(true);
  }
  async function go() {
    setBusy(true);
    try {
      const code = await createRoom(mode, { id: MYID, name: name.trim(), photo },
        mode === "premium" ? premium : undefined);
      onDone(code);
    } catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Créer une partie</h2>
      <p className="muted mt mb">Mode</p>
      <div className="seg">
        <button className={"chill " + (mode === "chill" ? "on" : "")} onClick={() => setMode("chill")}>😎 Chill</button>
        <button className={"harr " + (mode === "harr" ? "on" : "")} onClick={() => setMode("harr")}>🔥 Harr</button>
        <button className={"premium " + (mode === "premium" ? "on" : "")} onClick={() => setMode("premium")}>💎 Premium</button>
      </div>
      {mode === "premium" && <PremiumConfig cfg={premium} setCfg={setPremium} />}
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-primary" style={{ marginTop: 22 }} disabled={busy} onClick={review}>
        {busy ? "Création…" : "Créer le salon 🎴"}
      </button>
      <p className="muted dim center" style={{ marginTop: 10 }}>🔞 En continuant, tu confirmes avoir 18 ans et acceptes les CGU et la politique de confidentialité (accessibles sur l'accueil).</p>
      {confirm && (
        <Overlay>
          <h3 className="apr-serif" style={{ marginTop: 0, fontSize: 24 }}>{MODE_INFO[mode].emoji} Mode {MODE_INFO[mode].name}</h3>
          <p className="muted">{MODE_INFO[mode].blurb}</p>
          {mode === "premium" && <PremiumReco cfg={premium} />}
          <div className="row" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setConfirm(false)}>← Retour</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={go}>{busy ? "Création…" : "Continuer"}</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

export function JoinForm({ back, onDone, flash }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    if (code.trim().length !== 4) return flash("Le code fait 4 lettres");
    setBusy(true);
    const C = code.trim().toUpperCase();
    try {
      await joinRoom(C, { id: MYID, name: name.trim(), photo });
      onDone(C);
    } catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Rejoindre une partie</h2>
      <p className="muted mt mb">Code du salon</p>
      <input className="input code-input" placeholder="ABCD" value={code} maxLength={4}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-blue" style={{ marginTop: 22 }} disabled={busy} onClick={go}>
        {busy ? "Connexion…" : "Rejoindre 🔗"}
      </button>
      <p className="muted dim center" style={{ marginTop: 10 }}>🔞 En continuant, tu confirmes avoir 18 ans et acceptes les CGU et la politique de confidentialité (accessibles sur l'accueil).</p>
    </div>
  );
}
