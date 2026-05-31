import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" -> les chemins d'assets sont relatifs, ce qui marche aussi bien
// sur Vercel (racine) que sur GitHub Pages (sous-dossier /nom-du-repo/).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
