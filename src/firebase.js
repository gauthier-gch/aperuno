/* =========================================================================
   Configuration Firebase (clés publiques côté front : normal, la sécurité
   vient des règles Firestore — voir firestore.rules).
   ========================================================================= */

import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "firebase/app-check";
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

let appCheck = null;
if (APPCHECK_SITE_KEY) {
  // En développement local, on autorise un « jeton de debug » (à enregistrer
  // dans la console App Check) pour que localhost passe sans vrai reCAPTCHA.
  // Ne s'active jamais dans le build de production.
  if (import.meta.env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  appCheck = initializeAppCheck(app, {
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
  }).then(async (user) => {
    // Lors d'une toute première visite, le jeton App Check (reCAPTCHA) peut ne
    // pas encore être prêt : la 1re requête Firestore part alors sans jeton
    // valide et se fait refuser (« Missing or insufficient permissions »).
    // On le préchauffe pendant l'écran « Connexion… ».
    if (appCheck) await getAppCheckToken(appCheck).catch(() => {});
    return user;
  });
  return authReady;
}

/* Filet de sécurité pour une requête refusée faute de jetons encore valides
   (1re visite, jeton expiré au réveil du téléphone…) : on force le
   rafraîchissement des jetons Auth + App Check puis on réessaie. */
export async function refreshTokens() {
  await ensureAuth();
  if (auth.currentUser) await auth.currentUser.getIdToken(true).catch(() => {});
  if (appCheck) await getAppCheckToken(appCheck, true).catch(() => {});
}
export async function withTokenRetry(fn, tries = 3) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (e?.code !== "permission-denied" || i >= tries - 1) throw e;
      await refreshTokens();
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
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
