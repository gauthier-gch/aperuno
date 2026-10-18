/* =========================================================================
   Comptes joueurs : invité (anonyme) ou compte Google / e-mail.

   Tout visiteur a un uid Firebase : invité = compte anonyme. Créer un compte
   RATTACHE cet uid à Google ou à un e-mail (link) → l'historique joué en
   invité est conservé. Firebase garde la session dans le navigateur : on
   n'a pas à se reconnecter à chaque visite.

   Firestore :
     users/{uid}              profil + compteurs (parties jouées, victoires)
     users/{uid}/games/{gid}  une ligne par partie lancée (même non finie)
   RGPD : jamais de photo pour un invité ; rien sur l'alcool bu (donnée
   assimilable à de la santé) ; `expireAt` (règle TTL Firestore) efface les
   données d'un invité 25 mois après sa dernière visite, d'un compte 3 ans.
   Chaque visite repousse l'échéance du profil ET de tout l'historique.
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider, EmailAuthProvider, linkWithPopup, linkWithCredential,
  signInWithPopup, signInWithCredential, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut,
  signInAnonymously, onAuthStateChanged, deleteUser,
} from "firebase/auth";
import {
  doc, collection, onSnapshot, setDoc, getDocs, query, orderBy, limit,
  runTransaction, writeBatch, serverTimestamp, increment, Timestamp,
} from "firebase/firestore";
import { auth, db, ensureAuth } from "./firebase.js";

const DAY = 24 * 60 * 60 * 1000;
const GUEST_KEEP_MS = 760 * DAY;       // 25 mois sans visite
const ACCOUNT_KEEP_MS = 3 * 365 * DAY; // 3 ans sans visite
const GAMES_REFRESH_MS = 30 * DAY;     // l'historique est repoussé au plus 1×/mois
function expiry(u) { return Timestamp.fromMillis(Date.now() + (u.isAnonymous ? GUEST_KEEP_MS : ACCOUNT_KEEP_MS)); }

function userRef(uid) { return doc(db, "users", uid); }
function gamesCol(uid) { return collection(db, "users", uid, "games"); }
function providerOf(u) {
  if (u.isAnonymous) return "anonymous";
  return (u.providerData[0] && u.providerData[0].providerId) || "password";
}
function firstName(s) { return (s || "").trim().split(/\s+/)[0].slice(0, 14); }

/* ------------------------------ prénom invité ----------------------------- */

/* Dernier prénom saisi, mémorisé dans le navigateur (jamais la photo). */
const NAME_KEY = "aperuno_name";
export function rememberName(name) { try { localStorage.setItem(NAME_KEY, name); } catch (e) {} }
function localName() { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } }

/* --------------------------- état partagé (store) ------------------------- */

let state = { user: null, profile: null, ready: false };
const listeners = new Set();
function setState(patch) { state = { ...state, ...patch }; listeners.forEach((l) => l(state)); }
function snap(u) {
  return u && {
    uid: u.uid, guest: u.isAnonymous, provider: providerOf(u),
    email: u.email, displayName: u.displayName, photoURL: u.photoURL,
  };
}

let started = false, docUid = null, unsubDoc = null;
const touched = new Set();
function start() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, watch);
}
function watch(u) {
  setState({ user: snap(u) });
  const uid = u ? u.uid : null;
  if (uid === docUid) return;
  if (unsubDoc) { unsubDoc(); unsubDoc = null; }
  docUid = uid;
  setState({ profile: null, ready: !uid });
  if (!uid) return;
  ensureAuth().then(() => {
    if (docUid !== uid) return;
    unsubDoc = onSnapshot(userRef(uid), (d) => {
      setState({ profile: d.exists() ? d.data() : null, ready: true });
      if (!touched.has(uid)) { touched.add(uid); touch(d.exists() ? d.data() : null).catch(() => {}); }
    }, () => setState({ ready: true }));
  });
}

/* Une écriture par visite : dernière visite + repousse l'effacement auto
   (et, au plus une fois par mois, celui de tout l'historique de parties). */
async function touch(profile) {
  const u = auth.currentUser;
  if (!u) return;
  const data = { lastSeenAt: serverTimestamp(), provider: providerOf(u), expireAt: expiry(u) };
  if (!profile) {
    Object.assign(data, { createdAt: serverTimestamp(), gamesPlayed: 0, gamesWon: 0 });
    if (!u.isAnonymous) Object.assign(data, { name: firstName(u.displayName), photo: u.photoURL || null });
  }
  await setDoc(userRef(u.uid), data, { merge: true });
  const last = profile && profile.gamesRefreshedAt && profile.gamesRefreshedAt.toMillis
    ? profile.gamesRefreshedAt.toMillis() : 0;
  if (profile && profile.gamesPlayed > 0 && Date.now() - last > GAMES_REFRESH_MS) await refreshGames(u);
}

/* Repousse l'échéance de toutes les parties de l'historique. */
async function refreshGames(u) {
  const games = await getDocs(gamesCol(u.uid));
  for (let i = 0; i < games.docs.length; i += 400) {
    const b = writeBatch(db);
    games.docs.slice(i, i + 400).forEach((d) => b.update(d.ref, { expireAt: expiry(u) }));
    await b.commit();
  }
  await setDoc(userRef(u.uid), { gamesRefreshedAt: serverTimestamp() }, { merge: true });
}

/* Hook : { user, profile, ready }. user.guest = true pour un invité. */
export function useAccount() {
  const [s, set] = useState(state);
  useEffect(() => {
    start();
    listeners.add(set);
    set(state);
    return () => { listeners.delete(set); };
  }, []);
  return s;
}

/* Prénom + photo proposés par défaut dans les formulaires de partie. */
export function defaultIdentity(acc) {
  const p = acc.profile || {};
  const u = acc.user;
  if (u && !u.guest) {
    return {
      name: p.name || firstName(u.displayName) || localName(),
      photo: "photo" in p ? p.photo : (u.photoURL || null),
    };
  }
  return { name: p.name || localName(), photo: null };
}

/* ------------------------------ connexion -------------------------------- */

const MESSAGES = {
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/user-cancelled": "",
  "auth/popup-blocked": "Fenêtre de connexion bloquée : autorise les pop-ups et réessaie.",
  "auth/operation-not-supported-in-this-environment": "Connexion Google impossible ici : ouvre apéruno dans Safari ou Chrome.",
  "auth/web-storage-unsupported": "Connexion impossible : ton navigateur bloque le stockage (navigation privée ?).",
  "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail : connecte-toi.",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/missing-password": "Indique ton mot de passe.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/invalid-login-credentials": "E-mail ou mot de passe incorrect.",
  "auth/wrong-password": "E-mail ou mot de passe incorrect.",
  "auth/user-not-found": "E-mail ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives : réessaie dans quelques minutes.",
  "auth/network-request-failed": "Pas de connexion internet.",
  "auth/operation-not-allowed": "Ce mode de connexion n'est pas encore activé.",
  "auth/unauthorized-domain": "Connexion non autorisée depuis ce site (config Firebase).",
  "auth/requires-recent-login": "Par sécurité, déconnecte-toi puis reconnecte-toi avant de supprimer ton compte.",
};
/* Erreur lisible en français ; message vide = annulé par le joueur (rien à afficher). */
function authError(e) {
  const m = e && e.code in MESSAGES ? MESSAGES[e.code] : "Connexion impossible, réessaie.";
  return new Error(m);
}

function googleProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}

/* L'invité vient de devenir un compte (même uid) : profil par défaut et
   historique conservé avec la durée de rétention d'un compte. */
async function upgraded(hint = {}) {
  const u = auth.currentUser;
  await u.getIdToken(true); // jeton à jour (les règles vérifient le type de compte)
  setState({ user: snap(u) });
  const p = state.profile || {};
  const data = { provider: providerOf(u), expireAt: expiry(u), lastSeenAt: serverTimestamp() };
  if (!p.name) data.name = (hint.name || firstName(u.displayName)).slice(0, 14);
  if (!p.photo) data.photo = hint.photo || u.photoURL || null;
  await setDoc(userRef(u.uid), data, { merge: true });
  await refreshGames(u);
}

/* hint = { name, photo } saisis dans le formulaire, repris pour le profil. */
export async function signInGoogle(hint) {
  await ensureAuth();
  const cur = auth.currentUser;
  try {
    if (cur && cur.isAnonymous) {
      await linkWithPopup(cur, googleProvider());
      await upgraded(hint);
    } else {
      await signInWithPopup(auth, googleProvider());
    }
  } catch (e) {
    // Ce compte Google existe déjà (créé sur un autre appareil) : on s'y connecte.
    const cred = e && e.code === "auth/credential-already-in-use" && GoogleAuthProvider.credentialFromError(e);
    if (cred) {
      try { await signInWithCredential(auth, cred); return; } catch (e2) { throw authError(e2); }
    }
    throw authError(e);
  }
}

export async function signUpEmail(email, password, hint) {
  await ensureAuth();
  const cur = auth.currentUser;
  try {
    if (cur && cur.isAnonymous) await linkWithCredential(cur, EmailAuthProvider.credential(email.trim(), password));
    else await createUserWithEmailAndPassword(auth, email.trim(), password);
    await upgraded(hint);
  } catch (e) { throw authError(e); }
}

export async function signInEmail(email, password) {
  await ensureAuth();
  try { await signInWithEmailAndPassword(auth, email.trim(), password); }
  catch (e) { throw authError(e); }
}

export async function resetPassword(email) {
  try { await sendPasswordResetEmail(auth, email.trim()); }
  catch (e) { throw authError(e); }
}

/* Déconnexion → on repart en invité (nouvel uid anonyme). */
export async function logout() {
  try { localStorage.removeItem(NAME_KEY); } catch (e) {}
  await signOut(auth);
  await signInAnonymously(auth);
}

/* Droit à l'effacement : profil + historique, puis le compte lui-même. */
export async function deleteMyData() {
  const u = auth.currentUser;
  if (!u) return;
  const games = await getDocs(gamesCol(u.uid));
  const refs = [...games.docs.map((d) => d.ref), userRef(u.uid)];
  for (let i = 0; i < refs.length; i += 400) {
    const b = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => b.delete(r));
    await b.commit();
  }
  touched.add(u.uid); // ne pas recréer la fiche juste après l'avoir effacée
  try { localStorage.removeItem(NAME_KEY); } catch (e) {}
  try { await deleteUser(u); }
  catch (e) { throw authError(e); }
  await signInAnonymously(auth);
}

/* ------------------------------- profil ---------------------------------- */

/* patch = { name } et/ou { photo } (photo ignorée pour un invité). */
export async function saveProfile(patch) {
  await ensureAuth();
  const u = auth.currentUser;
  const data = {};
  if ("name" in patch) { data.name = patch.name.trim().slice(0, 14); rememberName(data.name); }
  if ("photo" in patch && !u.isAnonymous) data.photo = patch.photo || null;
  await setDoc(userRef(u.uid), data, { merge: true });
}

export async function recentGames(n = 5) {
  await ensureAuth();
  const q = query(gamesCol(auth.currentUser.uid), orderBy("startedAt", "desc"), limit(n));
  return (await getDocs(q)).docs.map((d) => d.data());
}

/* --------------------------- historique de parties ----------------------- */

/* Identifiant d'une manche : salon + date de distribution (une revanche dans
   le même salon = nouvelle partie). */
export function gameIdOf(room) {
  const t = room.dealtAt || (room.stats && room.stats.startedAt);
  return t ? `${room.code}-${room.createdAt}-${t}` : null;
}

/* Chaque joueur enregistre SA participation (les règles n'autorisent que
   l'écriture dans son propre users/{uid}). La transaction évite de compter
   deux fois la même partie (rechargement de page…). */
async function recordGame(room, me) {
  const u = auth.currentUser;
  const gid = gameIdOf(room);
  if (!u || !gid) return;
  const gref = doc(gamesCol(u.uid), gid);
  await runTransaction(db, async (tx) => {
    if ((await tx.get(gref)).exists()) return;
    tx.set(gref, {
      code: room.code, mode: room.mode, name: me.name,
      players: room.players.length, host: room.hostId === me.id,
      startedAt: serverTimestamp(), finished: false, won: false, expireAt: expiry(u),
    });
    const ud = { gamesPlayed: increment(1), lastGameAt: serverTimestamp(), lastSeenAt: serverTimestamp() };
    if (u.isAnonymous) ud.name = me.name; // pseudo de l'invité, pour le suivi
    tx.set(userRef(u.uid), ud, { merge: true });
  });
}

async function finishGame(room, me) {
  const u = auth.currentUser;
  const gid = gameIdOf(room);
  if (!u || !gid) return;
  const gref = doc(gamesCol(u.uid), gid);
  const won = room.winnerId === me.id;
  await runTransaction(db, async (tx) => {
    const g = await tx.get(gref);
    if (!g.exists() || g.data().finished) return;
    tx.update(gref, { finished: true, won, players: room.players.length, endedAt: serverTimestamp() });
    if (won) tx.set(userRef(u.uid), { gamesWon: increment(1) }, { merge: true });
  });
}

/* Suit le salon (état serveur) et logge la partie du joueur dès qu'elle est
   lancée — la plupart des parties ne vont pas jusqu'au bout. */
export function useGameLog(room, myId) {
  const done = useRef({});
  useEffect(() => {
    if (!room || !room.players || room.status === "lobby") return;
    const me = room.players.find((p) => p.id === myId);
    const gid = gameIdOf(room);
    if (!me || !gid) return;
    const g = done.current[gid] || (done.current[gid] = {});
    if (!g.start) g.start = recordGame(room, me).catch(() => { g.start = null; });
    if (room.status === "finished" && !g.end) {
      g.end = true;
      g.start.then(() => finishGame(room, me)).catch(() => { g.end = false; });
    }
  }, [room, myId]);
}
