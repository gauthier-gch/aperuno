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
