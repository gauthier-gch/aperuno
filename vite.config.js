import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages sert le site sous https://<user>.github.io/aperuno/.
// base ABSOLUE "/aperuno/" -> les assets sont référencés en /aperuno/assets/...
// ce qui fonctionne quelle que soit l'URL (avec ou sans "/" final, raccourci
// écran d'accueil, favori…). Une base relative "./" cassait le chargement selon
// le contexte (404 sur le JS -> écran de secours figé).
//
// Noms de fichiers STABLES (sans hash) : un index.html encore en cache pointe
// toujours vers un fichier existant -> pas de page blanche après un déploiement.
export default defineConfig({
  base: "/aperuno/",
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
