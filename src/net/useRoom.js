/* =========================================================================
   Accès Firestore : abonnement temps réel au salon + actions (transactions).
   Toute mutation passe par une transaction → l'état reste cohérent même si
   deux téléphones jouent « en même temps ».
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import {
  doc, onSnapshot, runTransaction, setDoc, getDoc,
  collection, setDoc as setDocRaw, Timestamp,
} from "firebase/firestore";
import { db, myUid } from "../firebase.js";
import { newLobby, dealNewGame, applyMove, joinInProgress } from "../game/engine.js";
import { genCode } from "../game/deck.js";

function roomRef(code) { return doc(db, "rooms", code); }

/* Durée de vie d'un salon après la dernière activité. Le champ `expireAt`
   (Timestamp) est rafraîchi à chaque écriture ; une règle TTL Firestore sur
   ce champ supprime automatiquement les salons inactifs (données + coûts). */
const ROOM_TTL_MS = 12 * 60 * 60 * 1000; // 12 h
function ttl() { return Timestamp.fromMillis(Date.now() + ROOM_TTL_MS); }
/* Estampille l'état avant écriture : rafraîchit l'expiration et garantit que
   l'écrivain figure dans `members` (exigé par les règles). */
function stamp(s) {
  const uid = myUid();
  if (uid) s.members = { ...(s.members || {}), [uid]: true };
  s.expireAt = ttl();
  s.rev = (s.rev || 0) + 1; // compteur de version : sert à resynchroniser l'affichage optimiste
  return s;
}

/* Abonnement live à un salon. Renvoie { room, error }.
   On rafraîchit aussi au retour en avant-plan (reconnexion / réveil). */
export function useRoom(code) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!code) { setRoom(null); return; }
    const ref = roomRef(code);
    const unsub = onSnapshot(
      ref,
      (snap) => setRoom(snap.exists() ? snap.data() : false),
      (e) => setError(e.message),
    );
    const onVis = () => {
      if (document.visibilityState === "visible") {
        getDoc(ref).then((snap) => setRoom(snap.exists() ? snap.data() : false)).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onVis);
    };
  }, [code]);
  return { room, error };
}

/* Présence légère : chaque joueur écrit son lastSeen dans une sous-collection
   (pas dans le doc principal → évite les conflits d'écriture à 10 joueurs). */
export function usePresence(code, myId, active) {
  const [online, setOnline] = useState({});
  useEffect(() => {
    if (!code || !active) return;
    const presRef = doc(db, "rooms", code, "presence", myId);
    const beat = () => setDocRaw(presRef, { at: Date.now(), expireAt: ttl() }, { merge: true }).catch(() => {});
    beat();
    const iv = setInterval(beat, 20000);
    const col = collection(db, "rooms", code, "presence");
    const unsub = onSnapshot(col, (snap) => {
      const now = Date.now();
      const map = {};
      snap.forEach((d) => { map[d.id] = now - (d.data().at || 0) < 50000; });
      setOnline(map);
    }, () => {});
    return () => { clearInterval(iv); unsub(); };
  }, [code, myId, active]);
  return online;
}

export async function createRoom(mode, host, premium) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const ref = roomRef(code);
    const exists = (await getDoc(ref)).exists();
    if (!exists) {
      await setDoc(ref, stamp(newLobby(code, mode, { ...host, uid: myUid() }, premium)));
      return code;
    }
  }
  throw new Error("Impossible de générer un code, réessaie.");
}

export async function joinRoom(code, player) {
  await runTransaction(db, async (tx) => {
    const ref = roomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Salon introuvable.");
    const s = snap.data();
    if (s.status === "finished") throw new Error("La partie est terminée.");
    const existing = s.players.find((p) => p.id === player.id);
    if (existing) {
      // déjà dans le salon (reconnexion) : on met juste à jour le profil.
      existing.name = player.name; existing.photo = player.photo || existing.photo;
      tx.set(ref, stamp(s));
      return;
    }
    if (s.players.length >= 15) throw new Error("Salon plein (15 joueurs max).");
    if (s.status === "lobby") {
      s.players.push({ id: player.id, name: player.name, photo: player.photo || null, hand: [] });
      tx.set(ref, stamp(s));
    } else {
      // partie en cours : on distribue 7 cartes au nouveau venu.
      tx.set(ref, stamp(joinInProgress(s, player)));
    }
  });
}

export async function startGame(code, starterIdx) {
  await mutate(code, (s) => dealNewGame(s, starterIdx));
}
export async function doMove(code, move, myId) {
  await mutate(code, (s) => applyMove(s, move, myId));
}

async function mutate(code, fn) {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Salon introuvable.");
    tx.set(ref, stamp(fn(snap.data())));
  });
}
