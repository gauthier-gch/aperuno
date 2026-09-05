/* =========================================================================
   Suivi d'usage optionnel : ajoute une ligne dans un Google Sheet au
   LANCEMENT d'une partie, via un web app Google Apps Script (aucun backend
   à héberger). RGPD : on n'envoie QUE les pseudos, jamais les photos.
   No-op tant que SHEET_WEBHOOK_URL n'est pas renseignée → aucun envoi.
   Voir le README (« 📊 Suivi des salons ») pour le script + le déploiement.
   ========================================================================= */

// Colle ici l'URL « /exec » du déploiement du web app Apps Script.
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyjGAr1lUkLx6B4o9wWTUplOAkg0rZ-yWs5veyIIrt8jCQO_W2znEhqkQj9eBsrrWN4bQ/exec";

/* Appelé côté HÔTE au lancement de la partie. `room` contient déjà tout le
   monde (les joueurs ont rejoint le lobby avant le lancement). */
export function logGameStart(room) {
  if (!SHEET_WEBHOOK_URL || !room || !room.players) return;
  try {
    const payload = {
      event: "start",
      code: room.code,
      at: new Date().toISOString(),          // date + heure (ISO 8601)
      mode: room.mode,                        // chill / harr / premium
      playerCount: room.players.length,       // nombre de joueurs
      players: room.players.map((p) => p.name), // pseudos uniquement — PAS de photo (RGPD)
    };
    // Envoi « fire and forget » : on ne lit pas la réponse (mode no-cors avec
    // un Content-Type simple, ce qu'Apps Script accepte sans pré-vol CORS).
    fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* le suivi ne doit jamais casser le jeu */ }
}
