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
  apiKey: "AIzaSyCWeDSh9jLXqlKUHreX7XFs391JWIjefUc",
  authDomain: "aperuno-spahd.firebaseapp.com",
  projectId: "aperuno-spahd",
  storageBucket: "aperuno-spahd.firebasestorage.app",
  messagingSenderId: "914108671029",
  appId: "1:914108671029:web:2755b1eaf1efcddc5d7d7c",
  measurementId: "G-GRSLMQLZ1P",
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
