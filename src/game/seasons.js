/* =========================================================================
   Mini-jeux éphémères : périodes de l'année.
   Chaque mini-jeu « saisonnier » (champ `seasonal` dans GAMES) n'est présent
   dans le paquet — et visible dans les règles — que pendant sa période.
   Les dates sont inclusives, au format [mois, jour] (mois 1 = janvier).
   ========================================================================= */

/* Mode test : `true` = TOUS les mini-jeux éphémères actifs en même temps
   (quelle que soit la date). `false` (production) = seulement celui de la
   période en cours — et rien hors période. */
export const SEASONAL_TEST_ALL = false;

export const SEASONS = {
  newyear: { id: "newyear", name: "New Year", emoji: "🎆", from: [1, 1], to: [1, 15] },
  love: { id: "love", name: "Love Season", emoji: "💘", from: [2, 5], to: [2, 20] },
  spring: { id: "spring", name: "Enfin le printemps", emoji: "🌸", from: [3, 8], to: [3, 25] },
  easter: { id: "easter", name: "Pâques", emoji: "🐣", from: [3, 26], to: [4, 26] },
  summer: { id: "summer", name: "Été", emoji: "🏖️", from: [6, 15], to: [8, 30] },
  school: { id: "school", name: "Back to school", emoji: "🎒", from: [9, 1], to: [9, 20] },
  spooky: { id: "spooky", name: "Spooky", emoji: "🎃", from: [10, 10], to: [11, 15] },
  xmas: { id: "xmas", name: "Noël", emoji: "🎅", from: [12, 1], to: [12, 31] },
};

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
  "septembre", "octobre", "novembre", "décembre"];
const fmt = ([m, d]) => `${d === 1 ? "1er" : d} ${MONTHS[m - 1]}`;
export function seasonDates(id) {
  const s = SEASONS[id];
  return s ? `du ${fmt(s.from)} au ${fmt(s.to)}` : "";
}

/* La période est-elle en cours à la date donnée (date locale) ? */
export function isSeasonOn(id, date = new Date()) {
  const s = SEASONS[id];
  if (!s) return false;
  const k = (date.getMonth() + 1) * 100 + date.getDate();
  const a = s.from[0] * 100 + s.from[1];
  const b = s.to[0] * 100 + s.to[1];
  return a <= b ? k >= a && k <= b : k >= a || k <= b;
}

/* Un mini-jeu saisonnier est-il actif (dans le paquet / les règles) ? */
export function isSeasonActive(id, date = new Date()) {
  return SEASONAL_TEST_ALL ? !!SEASONS[id] : isSeasonOn(id, date);
}
