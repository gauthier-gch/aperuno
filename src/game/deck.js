/* =========================================================================
   Construction et mélange du paquet + génération du code de salon.
   ========================================================================= */

import { ACTION_CARDS, GAMES, actionLabel, actionDrink } from "./constants.js";

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

export function buildDeck(mode) {
  const deck = [];
  let n = 0;
  ACTION_CARDS.forEach((a) => {
    for (let i = 0; i < a[mode]; i++)
      deck.push({
        id: makeUid("a", n++), type: "action",
        sips: a.sips, unit: a.unit,
        label: actionLabel(a.sips, a.unit), drink: actionDrink(a.sips, a.unit),
      });
  });
  GAMES.forEach((g) => {
    if (g.harrOnly && mode !== "harr") return;
    for (let i = 0; i < g[mode]; i++)
      deck.push({ id: makeUid("j", n++), type: "jeu", gameId: g.id, label: g.name });
  });
  for (let i = 0; i < 24; i++) deck.push({ id: makeUid("d", n++), type: "diable", label: "Diable" });
  for (let i = 0; i < 8; i++) deck.push({ id: makeUid("k", n++), type: "joker", label: "Joker" });
  for (let i = 0; i < 8; i++) deck.push({ id: makeUid("p", n++), type: "plus", value: 2, label: "+2" });
  for (let i = 0; i < 4; i++) deck.push({ id: makeUid("p", n++), type: "plus", value: 4, label: "+4" });
  for (let i = 0; i < 3; i++) deck.push({ id: makeUid("e", n++), type: "echange", label: "Échange de main" });
  return deck;
}

/* Code de salon à 4 lettres (sans I/O pour éviter les confusions). */
export function genCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let c = "";
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}
