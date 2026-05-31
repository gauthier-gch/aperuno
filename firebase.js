/* =========================================================================
   Configuration Firebase.
   👉 Remplace l'objet firebaseConfig ci-dessous par celui de TON projet
      (Console Firebase → Paramètres du projet → Tes applications → Config).
   Ces clés sont publiques côté front : c'est normal. La sécurité est
   assurée par les règles Firestore (voir README).
   ========================================================================= */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const auth = getAuth(app);

let authReady = null;
export function ensureAuth() {
  if (authReady) return authReady;
  authReady = new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => { if (user) resolve(user); });
    signInAnonymously(auth).catch(reject);
  });
  return authReady;
}

/* Identifiant stable de l'appareil/joueur (persiste entre rechargements). */
export function clientId() {
  let id = localStorage.getItem("aperuno_client_id");
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("aperuno_client_id", id);
  }
  return id;
}
