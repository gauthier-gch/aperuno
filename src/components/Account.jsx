import React, { useEffect, useState } from "react";
import { compressPhoto } from "../util.js";
import { MODE_INFO } from "../game/constants.js";
import {
  useAccount, signInGoogle, signUpEmail, signInEmail, resetPassword,
  logout, deleteMyData, saveProfile, recentGames,
} from "../account.js";
import { Ava, Overlay } from "./common.jsx";

/* Logo Google officiel (4 couleurs). */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/* ------------------------------ photo de profil -------------------------- */

/* Avatar cliquable → selfie, galerie ou retirer la photo. */
export function PhotoPicker({ photo, name, onChange, size = 52 }) {
  const [open, setOpen] = useState(false);
  const pick = (mirror) => (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (f) compressPhoto(f, (p) => { setOpen(false); onChange(p); }, mirror);
  };
  return (
    <>
      <button type="button" className="photo-btn" style={{ width: size, height: size }} onClick={() => setOpen(true)} aria-label="Changer la photo">
        {photo
          ? <img className="avatar" style={{ width: size, height: size }} src={photo} alt="" referrerPolicy="no-referrer" />
          : <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>📷</div>}
        <span className="photo-edit">✏️</span>
      </button>
      {open && (
        <Overlay>
          <div className="center-col">
            <Ava p={{ name, photo }} size={96} />
            <h3 className="h-title mt">Ta photo</h3>
          </div>
          <div className="col-gap mt">
            <label className="btn btn-primary">
              <input type="file" accept="image/*" capture="user" hidden onChange={pick(true)} />
              📸 Prendre un selfie
            </label>
            <label className="btn btn-ghost">
              <input type="file" accept="image/*" hidden onChange={pick(false)} />
              🖼️ Choisir dans ma galerie
            </label>
            {photo && <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); onChange(null); }}>🗑️ Retirer la photo</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </Overlay>
      )}
    </>
  );
}

/* ------------------------------- connexion ------------------------------- */

const ACCOUNT_NOTICE = "En créant un compte, tu acceptes que ton e-mail, ton prénom, ta photo et la liste de tes parties soient conservés pour t'afficher ton profil et tes stats. Tu peux supprimer ton compte à tout moment depuis ton profil.";

/* Fenêtre « avec mon e-mail » : connexion, création de compte, mot de passe oublié. */
export function EmailAuth({ hint, onClose, flash, onPrivacy }) {
  const [mode, setMode] = useState("signup"); // signup | login | reset
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState((hint && hint.name) || "");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (mode === "signup" && !name.trim()) return flash("Indique ton prénom 🙂");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpEmail(email, pw, { ...hint, name: name.trim() });
        flash(`Compte créé, bienvenue ${name.trim()} 🎉`);
      } else if (mode === "login") {
        await signInEmail(email, pw);
        flash("Te revoilà 👋");
      } else {
        await resetPassword(email);
        flash("E-mail envoyé 📬 Regarde aussi dans tes spams.", 5000);
        setMode("login"); setBusy(false);
        return;
      }
      onClose();
    } catch (err) { if (err.message) flash(err.message); setBusy(false); }
  }
  return (
    <Overlay>
      <h3 className="h-title">{mode === "signup" ? "Créer mon compte" : mode === "login" ? "Me connecter" : "Mot de passe oublié"}</h3>
      {mode !== "reset" && (
        <div className="seg plain mt mb">
          <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>Créer un compte</button>
          <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>J'ai un compte</button>
        </div>
      )}
      <form className="col-gap" onSubmit={submit}>
        {mode === "signup" && (
          <input className="input" placeholder="Ton prénom" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} />
        )}
        <input className="input" type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "reset" && (
          <input className="input" type="password" placeholder={mode === "signup" ? "Mot de passe (6 caractères min.)" : "Mot de passe"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : mode === "login" ? "Me connecter" : "Recevoir un lien"}
        </button>
      </form>
      {mode === "login" && <p className="center mt"><a className="foot-link" onClick={() => setMode("reset")}>Mot de passe oublié ?</a></p>}
      {mode === "reset" && <p className="center mt"><a className="foot-link" onClick={() => setMode("login")}>← Retour à la connexion</a></p>}
      {mode === "signup" && <PrivacyNote onPrivacy={onPrivacy} />}
      <button className="btn btn-ghost btn-sm mt" onClick={onClose}>Annuler</button>
    </Overlay>
  );
}

function PrivacyNote({ onPrivacy }) {
  return (
    <p className="muted dim mt">
      🔐 {ACCOUNT_NOTICE}{" "}
      {onPrivacy ? <a className="foot-link" onClick={onPrivacy}>Politique de confidentialité</a> : "Détails dans la politique de confidentialité (accueil)."}
    </p>
  );
}

/* Boutons Google + e-mail. hint = prénom/photo déjà saisis (repris dans le profil). */
function SignInButtons({ hint, flash, onPrivacy, onDone }) {
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  async function google() {
    setBusy(true);
    try { await signInGoogle(hint); flash("Connecté·e ✅"); onDone && onDone(); }
    catch (e) { if (e.message) flash(e.message); }
    setBusy(false);
  }
  return (
    <>
      <div className="row">
        <button className="btn btn-google btn-sm" disabled={busy} onClick={google}><GoogleG /> Google</button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setEmail(true)}>✉️ E-mail</button>
      </div>
      {email && <EmailAuth hint={hint} flash={flash} onPrivacy={onPrivacy}
        onClose={() => { setEmail(false); onDone && onDone(); }} />}
    </>
  );
}

/* Encart des formulaires Créer / Rejoindre : connexion facultative, ou rappel
   du compte connecté. */
export function AccountBox({ hint, flash, onProfile, onPrivacy }) {
  const acc = useAccount();
  if (acc.user && !acc.user.guest) {
    return (
      <p className="muted acct-line">
        ✅ Connecté·e{acc.user.email ? <> : <b className="w">{acc.user.email}</b></> : ""} · <a className="foot-link" onClick={onProfile}>Mon profil</a>
      </p>
    );
  }
  return (
    <div className="panel acct-box">
      <p className="muted mb-sm">⭐ <b className="w">Connecte-toi</b> pour retrouver ton profil et tes stats à chaque partie <span className="dim">(facultatif)</span></p>
      <SignInButtons hint={hint} flash={flash} onPrivacy={onPrivacy} />
      <div className="or-sep"><span>ou joue en invité</span></div>
    </div>
  );
}

/* ------------------------------- profil ---------------------------------- */

/* Petit avatar en haut à droite : ouvre le profil depuis n'importe quel écran. */
export function ProfileChip({ onClick, inline }) {
  const acc = useAccount();
  const u = acc.user;
  const p = acc.profile || {};
  const me = { name: p.name || "", photo: u && !u.guest ? p.photo || null : null };
  return (
    <button className={"profile-chip" + (inline ? " inline" : "")} onClick={onClick} aria-label="Mon profil">
      {me.photo || me.name ? <Ava p={me} size={inline ? 26 : 34} /> : <span className="profile-ic">👤</span>}
    </button>
  );
}

function fmtDate(t) {
  const d = t && t.toDate ? t.toDate() : null;
  return d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export function Profile({ onClose, flash, onPrivacy }) {
  const acc = useAccount();
  const u = acc.user;
  const p = acc.profile || {};
  const guest = !u || u.guest;
  const [name, setName] = useState(p.name || "");
  const [games, setGames] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setName(p.name || ""); }, [p.name]);
  useEffect(() => {
    if (!u) return;
    recentGames(5).then(setGames).catch(() => setGames([]));
  }, [u && u.uid, p.gamesPlayed]);

  const played = p.gamesPlayed || 0;
  const won = p.gamesWon || 0;

  async function saveName() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    try { await saveProfile({ name }); flash("Prénom enregistré ✅"); } catch (e) { flash("Enregistrement impossible, réessaie."); }
  }
  async function savePhoto(photo) {
    try { await saveProfile({ photo }); flash(photo ? "Photo mise à jour ✅" : "Photo retirée"); } catch (e) { flash("Enregistrement impossible, réessaie."); }
  }
  async function doLogout() {
    setBusy(true);
    try { await logout(); flash("Déconnecté·e 👋"); onClose(); } catch (e) { flash("Déconnexion impossible, réessaie."); setBusy(false); }
  }
  async function doDelete() {
    setBusy(true);
    try { await deleteMyData(); flash(guest ? "Tes données ont été effacées." : "Compte supprimé. À bientôt 👋"); onClose(); }
    catch (e) { flash(e.message || "Suppression impossible, réessaie."); setBusy(false); setConfirmDel(false); }
  }

  if (confirmDel) {
    return (
      <Overlay>
        <div className="center-col">
          <div style={{ fontSize: 44 }}>🗑️</div>
          <h3 className="h-title">{guest ? "Effacer mes données ?" : "Supprimer mon compte ?"}</h3>
          <p className="muted mb">Ton profil et l'historique de tes {played} partie{played > 1 ? "s" : ""} seront définitivement effacés.</p>
          <button className="btn btn-primary" disabled={busy} onClick={doDelete}>{busy ? "Suppression…" : "Oui, tout effacer"}</button>
          <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={() => setConfirmDel(false)}>Annuler</button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <div className="center-col">
        {guest
          ? <Ava p={{ name: p.name || "?" }} size={88} />
          : <PhotoPicker photo={p.photo || null} name={p.name} onChange={savePhoto} size={88} />}
        {!guest && <p className="muted dim">Touche ta photo pour la changer</p>}
        <p className="muted dim">{guest ? "Invité·e" : u.email || "Compte Google"}</p>
      </div>

      <div className="row mt" style={{ alignItems: "center" }}>
        <input className="input" placeholder="Ton prénom" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} />
        {name.trim() !== (p.name || "") && <button className="btn btn-gold btn-sm auto" onClick={saveName}>OK</button>}
      </div>

      <div className="stat-tiles mt">
        <div className="stat-tile"><span className="v">{played}</span><span className="l">🎴 partie{played > 1 ? "s" : ""} jouée{played > 1 ? "s" : ""}</span></div>
        <div className="stat-tile"><span className="v">{won}</span><span className="l">🏆 victoire{won > 1 ? "s" : ""}</span></div>
      </div>
      {p.createdAt && <p className="muted dim center mt">{guest ? "Sur apéruno" : "Membre"} depuis le {fmtDate(p.createdAt)}</p>}

      {games && games.length > 0 && (
        <div className="panel mt">
          <p className="b w mb-sm">Dernières parties</p>
          <div className="pb-table">
          {games.map((g, i) => (
            <div className="pb-row space" key={i}>
              <span className="muted">{(MODE_INFO[g.mode] || {}).emoji} {fmtDate(g.startedAt)}</span>
              <span className="muted">{g.players} joueurs{g.won ? " · 🏆" : g.finished ? "" : " · en cours / non finie"}</span>
            </div>
          ))}
          </div>
        </div>
      )}

      {guest ? (
        <div className="panel mt">
          <p className="muted mb-sm">⭐ <b className="w">Crée ton compte</b> pour garder ta photo, tes stats et tes {played > 0 ? `${played} partie${played > 1 ? "s" : ""}` : "parties"} sur tous tes appareils.</p>
          <SignInButtons hint={{ name: p.name }} flash={flash} onPrivacy={onPrivacy} />
          <p className="muted dim mt">📷 En invité, ta photo n'est jamais conservée : elle ne sert que le temps du salon.</p>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm mt" disabled={busy} onClick={doLogout}>Se déconnecter</button>
      )}

      <button className="btn btn-ghost btn-sm mt" onClick={onClose}>Fermer</button>
      <p className="center mt">
        <a className="foot-link dim" onClick={() => setConfirmDel(true)}>{guest ? "Effacer mes données" : "Supprimer mon compte"}</a>
        {onPrivacy && <><span className="dim"> · </span><a className="foot-link dim" onClick={onPrivacy}>Confidentialité</a></>}
      </p>
    </Overlay>
  );
}
