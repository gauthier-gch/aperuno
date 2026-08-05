import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le site est servi à la RACINE d'un domaine perso (https://aperuno.fr/) via
// GitHub Pages + fichier CNAME. base "/" -> les assets sont référencés en
// /assets/... ce qui est correct à la racine du domaine.
// (Avant le domaine perso, le site était sous https://<user>.github.io/aperuno/
// et base valait "/aperuno/".)
//
// Noms de fichiers STABLES (sans hash) : un index.html encore en cache pointe
// toujours vers un fichier existant -> pas de page blanche après un déploiement.
export default defineConfig({
  base: "/",
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
