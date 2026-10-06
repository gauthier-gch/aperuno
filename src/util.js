/* Compresse une photo de profil en data-URL ~140px (légère pour Firestore). */
export function compressPhoto(file, cb) {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const s = 140;
      c.width = s; c.height = s;
      const ctx = c.getContext("2d");
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, s, s);
      cb(c.toDataURL("image/jpeg", 0.55));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* Retourne horizontalement (effet miroir) une photo data-URL déjà compressée.
   Utile car selon le téléphone, le selfie est enregistré en miroir ou non. */
export function flipPhoto(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.translate(img.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    cb(c.toDataURL("image/jpeg", 0.8));
  };
  img.src = dataUrl;
}

/* true si l'appli est lancée depuis le raccourci écran d'accueil (PWA
   installée), false si elle tourne dans un onglet de navigateur. */
export function isInstalledApp() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.matchMedia("(display-mode: fullscreen)").matches
      || window.navigator.standalone === true; // iOS Safari
  } catch (e) { return false; }
}
