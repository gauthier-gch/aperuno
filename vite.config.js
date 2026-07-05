import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" -> chemins d'assets relatifs (marche sur Vercel comme sur GitHub
// Pages en sous-dossier /nom-du-repo/).
//
// Noms de fichiers STABLES (sans hash) : après un redéploiement, un ancien
// index.html encore en cache continue de pointer vers des fichiers qui EXISTENT
// (assets/index.js), au lieu d'un fichier hashé supprimé -> plus de page blanche.
// Le cache navigateur se rafraîchit ensuite normalement (ETag + max-age court).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
