/* =========================================================================
   Configuration Firebase (clés publiques côté front : normal, la sécurité
   vient des règles Firestore — voir firestore.rules).
   ========================================================================= */

import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
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

/* -------------------------------------------------------------------------
   App Check : atteste que les requêtes viennent bien de NOTRE site (via
   reCAPTCHA v3) et bloque les scripts/robots qui abuseraient de l'API.

   👉 Colle ici la « clé de site » reCAPTCHA v3 générée dans la console Firebase
   (Build → App Check). C'est une clé PUBLIQUE (elle part dans le navigateur),
   pas un secret. Tant que la valeur reste vide, App Check ne s'initialise pas
   → aucun risque de casser l'appli avant que tout soit prêt côté console.
   ------------------------------------------------------------------------- */
const APPCHECK_SITE_KEY = "6Lf2jowtAAAAAOmpTshgP3u6EyP-BVPrIMxOpH5o";

if (APPCHECK_SITE_KEY) {
  // En développement local, on autorise un « jeton de debug » (à enregistrer
  // dans la console App Check) pour que localhost passe sans vrai reCAPTCHA.
  // Ne s'active jamais dans le build de production.
  if (import.meta.env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

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

/* uid d'authentification (anonyme) Firebase — sert à sécuriser les règles
   Firestore : c'est la seule identité que les règles peuvent vérifier
   (distincte de MYID, l'identifiant d'appareil côté jeu). */
export function myUid() { return auth.currentUser ? auth.currentUser.uid : null; }

/* Identifiant stable de l'appareil/joueur (persiste entre rechargements). */
export function clientId() {
  let id = localStorage.getItem("aperuno_client_id");
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("aperuno_client_id", id);
  }
  return id;
}
