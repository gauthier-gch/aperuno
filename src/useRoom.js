/* =========================================================================
   Accès Firestore : abonnement temps réel au salon + actions (transactions).
   ========================================================================= */

import { useEffect, useState } from "react";
import { doc, onSnapshot, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { newLobby, dealNewGame, applyMove, genCode } from "./game";

/* Abonnement live à un salon. Renvoie { room, error }. */
export function useRoom(code) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!code) { setRoom(null); return; }
    const ref = doc(db, "rooms", code);
    const unsub = onSnapshot(
      ref,
      (snap) => setRoom(snap.exists() ? snap.data() : false),
      (e) => setError(e.message)
    );
    return unsub;
  }, [code]);
  return { room, error };
}

/* Crée un salon avec un code unique (quelques essais). */
export async function createRoom(mode, host) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const ref = doc(db, "rooms", code);
    const exists = (await getDoc(ref)).exists();
    if (!exists) {
      await setDoc(ref, newLobby(code, mode, host));
      return code;
    }
  }
  throw new Error("Impossible de générer un code, réessaie.");
}

/* Rejoindre un salon existant (en lobby uniquement). */
export async function joinRoom(code, player) {
  const ref = doc(db, "rooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Salon introuvable.");
    const s = snap.data();
    if (s.status !== "lobby") throw new Error("La partie a déjà commencé.");
    const existing = s.players.find((p) => p.id === player.id);
    if (existing) { existing.name = player.name; existing.photo = player.photo || existing.photo; }
    else {
      if (s.players.length >= 10) throw new Error("Salon plein (10 joueurs max).");
      s.players.push({ id: player.id, name: player.name, photo: player.photo || null, hand: [] });
    }
    tx.set(ref, s);
  });
}

/* Démarrer la partie (hôte). */
export async function startGame(code, starterIdx) {
  await mutate(code, (s) => dealNewGame(s, starterIdx));
}

/* Jouer un coup : applique applyMove dans une transaction. */
export async function doMove(code, move, myId) {
  await mutate(code, (s) => applyMove(s, move, myId));
}

/* Transaction générique. */
async function mutate(code, fn) {
  const ref = doc(db, "rooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Salon introuvable.");
    tx.set(ref, fn(snap.data()));
  });
}
