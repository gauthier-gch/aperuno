/* =========================================================================
   Construction et mélange du paquet + génération du code de salon.
   ========================================================================= */

import { ACTION_CARDS, GAMES, actionLabel, actionDrink, sanitizePremium } from "./constants.js";

export function makeUid(prefix, i) {
  return `${prefix}${i}_${Math.random().toString(36).slice(2, 7)}`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Construit le paquet.
   - mode "chill" | "harr" : composition figée par les constantes.
   - mode "premium" : `premium` fournit le nombre de chaque carte spéciale et
     de chaque mini-jeu. Les gorgées/shots et les Échanges gardent les valeurs
     Harr (non réglables). */
export function buildDeck(mode, premium) {
  const deck = [];
  let n = 0;
  const isPremium = mode === "premium";
  const cfg = isPremium ? sanitizePremium(premium) : null;
  // Gorgées/shots : figées sur Harr en premium (non réglables).
  const actionMode = isPremium ? "harr" : mode;
  ACTION_CARDS.forEach((a) => {
    for (let i = 0; i < a[actionMode]; i++)
      deck.push({
        id: makeUid("a", n++), type: "action",
        sips: a.sips, unit: a.unit,
        label: actionLabel(a.sips, a.unit), drink: actionDrink(a.sips, a.unit),
      });
  });
  GAMES.forEach((g) => {
    // En premium, tous les mini-jeux (Harr-only inclus) sont réglables.
    if (g.harrOnly && !isPremium && mode !== "harr") return;
    const count = isPremium ? cfg.games[g.id] : g[mode];
    for (let i = 0; i < count; i++)
      deck.push({ id: makeUid("j", n++), type: "jeu", gameId: g.id, label: g.name });
  });
  const diable = isPremium ? cfg.diable : 24;
  const joker = isPremium ? cfg.joker : 8;
  const plus2 = isPremium ? cfg.plus2 : 8;
  const plus4 = isPremium ? cfg.plus4 : 4;
  for (let i = 0; i < diable; i++) deck.push({ id: makeUid("d", n++), type: "diable", label: "Diable" });
  for (let i = 0; i < joker; i++) deck.push({ id: makeUid("k", n++), type: "joker", label: "Joker" });
  for (let i = 0; i < plus2; i++) deck.push({ id: makeUid("p", n++), type: "plus", value: 2, label: "+2" });
  for (let i = 0; i < plus4; i++) deck.push({ id: makeUid("p", n++), type: "plus", value: 4, label: "+4" });
  for (let i = 0; i < 3; i++) deck.push({ id: makeUid("e", n++), type: "echange", label: "Échange de main" });
  for (let i = 0; i < 3; i++) deck.push({ id: makeUid("ec", n++), type: "echangecarte", label: "Échange de carte" });
  return deck;
}

/* Code de salon à 4 lettres (sans I/O pour éviter les confusions). */
export function genCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let c = "";
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}
