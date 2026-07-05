import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import "./styles.css";

/* À chaque mise à jour majeure (changement de règles / format d'état), on
   purge le code de salon mémorisé : les anciennes parties en cours ne sont plus
   compatibles, ça évite de recharger un état périmé. L'identité du joueur
   (aperuno_client_id) est conservée. Les assets sont versionnés par Vite. */
const APP_VERSION = "8";
try {
  if (localStorage.getItem("aperuno_version") !== APP_VERSION) {
    localStorage.removeItem("aperuno_code");
    localStorage.setItem("aperuno_version", APP_VERSION);
  }
} catch (e) { /* localStorage indisponible : on ignore */ }

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><App /></ErrorBoundary>
);
