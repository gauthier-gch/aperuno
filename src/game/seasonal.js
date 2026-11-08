/* =========================================================================
   Mini-jeux éphémères : données et règles pures partagées entre le moteur
   (transaction Firestore) et l'affichage. Aucune dépendance React.
   ========================================================================= */

/* --------------------------- Le compte à rebours ------------------------- */
export const NY_PREP = 1500;        // « prêt ? » avant le 10
export const NY_COUNT = 10;         // 10, 9, … 1, 0
export const NY_HIDE_BELOW = 5;     // en dessous de 5, les chiffres disparaissent
export const NY_GRACE = 5000;       // 5 s après le zéro → fin
export const NY_PENALTY_MISS = 5;   // pas appuyé
export const NY_PENALTY_LAST = [3, 2, 1]; // dernier, avant-dernier, avant-avant-dernier

/* Classement : du plus précis au moins précis ; ceux qui n'ont pas appuyé
   sont en fin de liste (éliminés). Renvoie [{ id, delta|null, sips }]. */
export function newYearRanking(players, clicks) {
  const c = clicks || {};
  const played = players.filter((p) => typeof c[p.id] === "number")
    .sort((a, b) => Math.abs(c[a.id]) - Math.abs(c[b.id]));
  const missed = players.filter((p) => typeof c[p.id] !== "number");
  const rows = played.map((p) => ({ id: p.id, delta: c[p.id], sips: 0 }));
  // Les 3 derniers (le 1er ne boit jamais) : 3, 2, 1 gorgées.
  const n = Math.min(NY_PENALTY_LAST.length, Math.max(0, rows.length - 1));
  for (let k = 0; k < n; k++) rows[rows.length - 1 - k].sips = NY_PENALTY_LAST[k];
  return [...rows, ...missed.map((p) => ({ id: p.id, delta: null, sips: NY_PENALTY_MISS }))];
}

/* ------------------------------- Cupidon --------------------------------- */
/* Couples = choix réciproques. Renvoie [{ a, b }, …] (objets : Firestore
   refuse les tableaux imbriqués). */
export function cupidCouples(players, votes) {
  const v = votes || {};
  const out = [];
  const seen = new Set();
  players.forEach((p) => {
    const q = v[p.id];
    if (!q || seen.has(p.id) || seen.has(q)) return;
    if (v[q] === p.id) { out.push({ a: p.id, b: q }); seen.add(p.id); seen.add(q); }
  });
  return out;
}

/* ---------------------------- Chasse aux œufs ---------------------------- */
export const EGG_COUNT = 10;
export const EGG_SPOTS = 20;
export const EGG_DURATION = 20000;
export const EGG_SHAKE_AT = 15000;
export const EGG_PREP = 2000;
export const EGG_GIVE = 3;
export const EGG_COLORS = ["#ff6f91", "#ffc75f", "#8be0a4", "#7ec8ff", "#c99bff", "#ff9671", "#f9f871", "#4ffbdf"];

/* 10 lieux, 20 cachettes chacun. `sky` / `ground` : dégradés du décor ;
   `horizon` : hauteur (%) de la ligne d'horizon ; `deco` : éléments de fond
   (non cliquables) ; `floor` : type de sol (fouillis dessiné : herbe,
   cailloux, miettes…) ; `spots` : emojis des 20 cachettes. Les positions sont
   calculées de façon déterministe (identiques sur tous les téléphones). */
export const EGG_SCENES = [
  { name: "Le jardin", floor: "grass", emoji: "🏡", sky: "#8fd3ff", ground: "#5cbf5c", horizon: 20, deco: ["☀️", "☁️", "🏡"],
    spots: ["🌳", "🌷", "🌻", "🪴", "🌼", "🍄", "🪨", "🌿", "🚲", "🌹", "🌺", "🥕", "🌾", "🪵", "🦔", "🐌", "🌲", "🧺", "🪣", "🐿️"] },
  { name: "Le salon", floor: "wood", emoji: "🛋️", sky: "#e9c9a8", ground: "#a86d43", horizon: 32, deco: ["🖼️", "🕰️", "🪟"],
    spots: ["🛋️", "🪑", "📺", "🪴", "📚", "🧸", "🎮", "🧺", "🎸", "🛏️", "🗄️", "🪞", "📦", "🧦", "🥾", "🎁", "🪔", "🐈", "🧶", "💡"] },
  { name: "La cuisine", floor: "tiles", emoji: "🍳", sky: "#fff1c9", ground: "#d9b38c", horizon: 30, deco: ["🪟", "🕰️", "🧲"],
    spots: ["🍳", "🥘", "🫖", "🍞", "🧀", "🥖", "🍎", "🧁", "🍉", "🥫", "🧂", "🥨", "🍯", "🥛", "🍌", "🍍", "🥥", "🧃", "🍕", "🍷"] },
  { name: "La plage", floor: "sand", emoji: "🏖️", sky: "#7fd6ff", ground: "#f2d39a", horizon: 24, deco: ["☀️", "⛵", "🌊"],
    spots: ["🏖️", "⛱️", "🐚", "🦀", "🪣", "🏄", "🌴", "🦞", "🐙", "🩴", "🧴", "🍉", "🚤", "🐢", "🏐", "🥥", "🍦", "🦩", "🪨", "🐠"] },
  { name: "La forêt", floor: "forest", emoji: "🌲", sky: "#a8d8c0", ground: "#3f7d3f", horizon: 20, deco: ["☁️", "🦉", "🌙"],
    spots: ["🌲", "🌳", "🍄", "🪵", "🦊", "🦌", "🐻", "🪨", "🌿", "🍂", "🐗", "🦔", "🐿️", "🌱", "🌰", "🍁", "🐸", "🦡", "🌾", "🍃"] },
  { name: "La ferme", floor: "grass", emoji: "🐄", sky: "#9fd8ff", ground: "#9bc95b", horizon: 22, deco: ["☀️", "🌾", "🚜"],
    spots: ["🐄", "🐖", "🐑", "🐓", "🐐", "🐎", "🦆", "🐇", "🚜", "🌾", "🪣", "🧺", "🛖", "🐕", "🐈", "🌽", "🌻", "🐥", "🪵", "🐀"] },
  { name: "La chambre", floor: "rug", emoji: "🛏️", sky: "#d9c8ff", ground: "#8e7bc4", horizon: 34, deco: ["🪟", "🌙", "🖼️"],
    spots: ["🛏️", "🧸", "👟", "🎒", "👕", "🎧", "📚", "🪀", "🧦", "💻", "🪆", "🎲", "👗", "🕹️", "🧳", "🪞", "🦖", "🎈", "📦", "🪅"] },
  { name: "Le grenier", floor: "wood", emoji: "📦", sky: "#b8957a", ground: "#7a5a43", horizon: 28, deco: ["🕸️", "🪟", "🕯️"],
    spots: ["📦", "🧳", "🪑", "🕰️", "🗿", "🎻", "🪆", "🧸", "📻", "🪞", "🛢️", "🧺", "🪜", "🎩", "🗝️", "📜", "🖼️", "🕯️", "🐭", "🦇"] },
  { name: "Le parc", floor: "grass", emoji: "🎡", sky: "#8fd3ff", ground: "#6cc46c", horizon: 24, deco: ["🎡", "☁️", "🎈"],
    spots: ["🌳", "⛲", "⚽", "🎠", "🌷", "🪁", "🦆", "🐕", "🚲", "🛴", "🌸", "🍦", "🎈", "🪨", "🌲", "🧺", "🐦", "🌼", "🗑️", "🪑"] },
  { name: "Le potager", floor: "soil", emoji: "🥕", sky: "#bfe6ff", ground: "#8a5c3c", horizon: 20, deco: ["☀️", "🐦", "🧑‍🌾"],
    spots: ["🥕", "🥬", "🍅", "🥒", "🎃", "🌽", "🍆", "🥔", "🧅", "🧄", "🫑", "🥦", "🍓", "🪴", "🪣", "🐌", "🐛", "🌻", "🪵", "🐇"] },
];

/* Petit PRNG déterministe (mulberry32) : même décor sur tous les téléphones. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Position (en % du décor) et taille de chaque cachette d'un lieu : grille
   5 × 4 sous l'horizon, avec un décalage aléatoire stable. */
export function eggLayout(sceneIdx) {
  const sc = EGG_SCENES[sceneIdx] || EGG_SCENES[0];
  const r = rng(1000 + sceneIdx * 7919);
  const top = sc.horizon + 3, bottom = 95;
  const rows = 5, cols = 4;
  return sc.spots.map((emoji, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const cw = 100 / cols, ch = (bottom - top) / rows;
    const x = 4 + (cw * col + cw * (0.25 + r() * 0.5)) * 0.92;
    const y = top + ch * row + ch * (0.3 + r() * 0.45);
    const size = 32 + Math.round(r() * 10) + row * 2; // plus gros au premier plan
    const ex = (r() < 0.5 ? -1 : 1) * (0.32 + r() * 0.12); // œuf qui dépasse à gauche / à droite
    const ey = 0.5 + r() * 0.25;                            // hauteur de l'œuf derrière l'objet
    return { emoji, x, y, size, ex, ey, flip: r() < 0.3 };
  });
}

/* Fouillis du décor (dessiné en SVG, pas d'emoji) pour rendre la chasse plus
   difficile : `back` sous les objets, `front` par-dessus (touffes hautes,
   moutons de poussière…) qui masquent en partie les œufs. Coordonnées dans
   un repère 360 × 420. `fillers` : petits objets en plus (sans œuf). */
const FLOOR_KINDS = {
  grass: { back: ["tuft", "tuft", "flower", "flower", "pebble", "leaf"], front: "tuft", tint: ["#3e9c3e", "#2f7d2f", "#6fd06f", "#4aa84a"] },
  forest: { back: ["tuft", "leaf", "leaf", "pebble", "flower", "twig"], front: "tuft", tint: ["#2b5f2b", "#3c7a32", "#7a5a2a", "#a0522d"] },
  soil: { back: ["clod", "clod", "leaf", "pebble", "tuft", "twig"], front: "tuft", tint: ["#5e3b24", "#704a2e", "#3f8a3f", "#8a6a4a"] },
  sand: { back: ["pebble", "shell", "shell", "confetti", "pebble", "twig"], front: "dune", tint: ["#d9b77a", "#c9a46a", "#e8c48a", "#b89058"] },
  wood: { back: ["crumb", "confetti", "button", "dust", "crumb", "twig"], front: "dust", tint: ["#5c3d28", "#8a6247", "#c9a27e", "#9a9a9a"] },
  tiles: { back: ["crumb", "crumb", "confetti", "button", "dust", "leaf"], front: "dust", tint: ["#c9a27e", "#e0c9a6", "#9a7b5a", "#ffffff"] },
  rug: { back: ["confetti", "button", "confetti", "crumb", "dust", "flower"], front: "dust", tint: ["#6b5aa8", "#b7a6ec", "#ffffff", "#ff9ec7"] },
};
export const NOISE_COLORS = ["#ff6f91", "#ffc75f", "#8be0a4", "#7ec8ff", "#c99bff", "#ff9671", "#ffffff", "#f9f871"];
export function floorKind(sc) { return FLOOR_KINDS[sc.floor] || FLOOR_KINDS.grass; }

export function eggClutter(sceneIdx) {
  const sc = EGG_SCENES[sceneIdx] || EGG_SCENES[0];
  const fk = floorKind(sc);
  const r = rng(5000 + sceneIdx * 104729);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const top = (sc.horizon / 100) * 420;
  const item = (type, minS, maxS) => ({
    type, x: 6 + r() * 348, y: top + 6 + r() * (414 - top),
    s: minS + r() * (maxS - minS), rot: Math.round(r() * 360),
    c: type === "flower" || type === "confetti" || type === "button" ? pick(NOISE_COLORS) : pick(fk.tint),
  });
  const back = Array.from({ length: 160 }, () => item(pick(fk.back), 6, 16));
  const front = Array.from({ length: 40 }, () => item(fk.front, 10, 20));
  const fillers = Array.from({ length: 30 }, () => ({
    emoji: pick(sc.spots), x: 4 + r() * 92, y: sc.horizon + 3 + r() * (94 - sc.horizon), size: 16 + Math.round(r() * 10),
  }));
  return { back, front, fillers };
}

/* --------------------------- Coup de soleil ------------------------------ */
export const SUN_PREP = 2000;
export const SUN_DURATION = 20000;    // jauge pleine
export const SUN_BURN_MIN = 0.55;     // le coup de soleil tombe dans la partie haute
export const SUN_BURN_MAX = 0.95;
export const SUN_BURN_SIPS = 3;
export const SUN_BRONZE_GIVE = 5;

/* --------------------------- Évite les monstres -------------------------- */
export const TRAIN_PREP = 2000;
export const TRAIN_RIDE = 3000;       // trajet avant chaque bifurcation
export const TRAIN_CHOOSE = 5000;     // 5 s pour choisir
export const TRAIN_REVEAL = 3000;     // révélation du monstre
export const TRAIN_FORKS = 3;
export const TRAIN_SIPS = 3;
export const TRAIN_GIVE = 5;
export const TRAIN_MONSTERS = [
  { ic: "🐺", name: "le loup-garou" }, { ic: "🧛", name: "le vampire" }, { ic: "🧙", name: "la sorcière" },
];
export const TRAIN_WALLS = [
  { ic: "🐍", name: "le serpent" }, { ic: "🧟", name: "le zombie" }, { ic: "👻", name: "le fantôme" },
];
const TRAIN_CYCLE = TRAIN_RIDE + TRAIN_CHOOSE + TRAIN_REVEAL;

/* Bornes temporelles de la bifurcation i (ms, horloge locale). */
export function trainFork(mg, i) {
  const ride = mg.startsAt + i * TRAIN_CYCLE;
  return { ride, choose: ride + TRAIN_RIDE, reveal: ride + TRAIN_RIDE + TRAIN_CHOOSE, end: ride + TRAIN_CYCLE };
}
export function trainEnd(mg) { return mg.startsAt + TRAIN_FORKS * TRAIN_CYCLE + 800; }

/* Où en est le train à l'instant `now` : { fork, step: "prep"|"ride"|"choose"|"reveal"|"done" }. */
export function trainStage(mg, now) {
  if (now < mg.startsAt) return { fork: 0, step: "prep" };
  for (let i = 0; i < TRAIN_FORKS; i++) {
    const f = trainFork(mg, i);
    if (now < f.choose) return { fork: i, step: "ride" };
    if (now < f.reveal) return { fork: i, step: "choose" };
    if (now < f.end) return { fork: i, step: "reveal" };
  }
  return { fork: TRAIN_FORKS - 1, step: "done" };
}

/* Nombre de bifurcations déjà révélées à l'instant `now`. */
export function trainRevealed(mg, now) {
  let k = 0;
  for (let i = 0; i < TRAIN_FORKS; i++) if (now >= trainFork(mg, i).reveal) k = i + 1;
  return k;
}

/* Sort de chaque joueur sur les `upTo` premières bifurcations résolues :
   { [id]: { fork, ic, name } } pour ceux qui ont rencontré un monstre. */
export function trainDeaths(mg, players, upTo = TRAIN_FORKS) {
  const out = {};
  const choices = mg.choices || {};
  players.forEach((p) => {
    for (let i = 0; i < upTo; i++) {
      const c = choices[p.id] && choices[p.id][i];
      if (!c) { out[p.id] = { fork: i, wall: true, ...TRAIN_WALLS[i] }; return; }
      if (c === mg.monsterSide[i]) { out[p.id] = { fork: i, ...TRAIN_MONSTERS[i] }; return; }
    }
  });
  return out;
}

/* ----------------------------- Secret Santa ------------------------------ */
/* Tirage « père Noël secret » : un cycle aléatoire (personne ne s'offre
   rien à soi-même). Renvoie { [donneur]: receveur }. */
export function santaDraw(ids, shuffle) {
  const order = shuffle(ids);
  const out = {};
  order.forEach((id, i) => { out[id] = order[(i + 1) % order.length]; });
  return out;
}
