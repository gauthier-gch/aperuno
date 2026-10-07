/* =========================================================================
   Constantes de contenu (cartes, mini-jeux, métadonnées d'affichage).
   Mode de jeu : "chill" | "harr".  (anciennement "hard" → renommé "Harr")
   ========================================================================= */

/* Cartes Action : on stocke une valeur numérique `sips` + une `unit`, ce qui
   permet d'empiler plusieurs cartes identiques (2 × « 2 gorgées » = 4). */
export const ACTION_CARDS = [
  { sips: 1, unit: "gorgée", chill: 18, harr: 8 },
  { sips: 2, unit: "gorgée", chill: 14, harr: 11 },
  { sips: 3, unit: "gorgée", chill: 9, harr: 12 },
  { sips: 5, unit: "gorgée", chill: 4, harr: 11 },
  { sips: 1, unit: "shot", chill: 0, harr: 3 },
];

export function actionLabel(sips, unit) {
  return `${sips} ${unit}${sips > 1 ? "s" : ""}`;
}
export function actionDrink(sips, unit) {
  return `boit ${sips} ${unit}${sips > 1 ? "s" : ""}`;
}

/* Gorgées infligées au perdant d'un mini-jeu, selon le mode.
   En premium, la valeur est réglable par l'hôte (défaut 2, comme Harr). */
export function sipsFor(mode, premium) {
  if (mode === "premium") return (premium && premium.mgSips) || 2;
  return mode === "harr" ? 2 : 1;
}

/* -------------------------------------------------------------------------
   Mode PREMIUM : l'hôte compose lui-même le paquet.
   - Cartes « spéciales » (hors gorgée / hors échange) : réglables de 0 à
     5× leur nombre classique (le nombre classique = valeur ci-dessous, fixe
     quel que soit le mode dans le paquet standard).
   - Mini-jeux : chacun réglable de 0 à 10 (défaut = valeur du mode Harr).
   - mgSips : gorgées infligées au perdant d'un mini-jeu (1 à 3, défaut 2).
   Les cartes gorgée/shot et les cartes Échange restent aux valeurs Harr.
   ------------------------------------------------------------------------- */
export const CLASSIC_COUNTS = { diable: 24, joker: 8, plus2: 8, plus4: 4 };
export const PREMIUM_MAX_MULT = 5; // scale « de 0 à 5× le nombre classique »
export const PREMIUM_GAME_MAX = 10; // scale des mini-jeux « de 0 à 10 »
export const PREMIUM_SIPS_MAX = 3; // scale des gorgées perdant mini-jeu

/* Métadonnées des scales « cartes spéciales » du mode premium. */
export const PREMIUM_CARD_SCALES = [
  { key: "diable", label: "Diables", ic: "😈", classic: CLASSIC_COUNTS.diable },
  { key: "joker", label: "Jokers", ic: "🃏", classic: CLASSIC_COUNTS.joker },
  { key: "plus2", label: "Relance +2", ic: "⏫", classic: CLASSIC_COUNTS.plus2 },
  { key: "plus4", label: "Relance +4", ic: "⏫", classic: CLASSIC_COUNTS.plus4 },
];

/* Présentation courte de chaque mode (modale de confirmation + onglet Règles). */
export const MODE_INFO = {
  chill: {
    emoji: "😎", name: "Chill",
    blurb: "Ce mode se marie très bien avec une soirée en bar ou en terrasse !",
  },
  harr: {
    emoji: "🔥", name: "Harr",
    blurb: "Ce mode contient des culs secs et des shots, il est donc idéal pour un before ou une soirée en appart !",
  },
  premium: {
    emoji: "💎", name: "Premium",
    blurb: "Ce mode te permet de personnaliser complètement la composition du jeu, en te laissant le choix du nombre de chaque carte !",
  },
};

/* Recommandations personnalisées sur une composition premium.
   Renvoie une liste de messages (vide = composition équilibrée). */
export function premiumRecos(cfg) {
  const c = sanitizePremium(cfg);
  const actionTotal = ACTION_CARDS.reduce((s, a) => s + a.harr, 0); // gorgées/shots (fixes)
  const echange = 6; // 3 échange de main + 3 échange de carte (fixes)
  const gamesTotal = Object.values(c.games).reduce((s, n) => s + n, 0);
  const plus = c.plus2 + c.plus4;
  const special = c.diable + c.joker + plus;
  const total = actionTotal + echange + gamesTotal + special;
  const recos = [];

  if (c.diable === 0)
    recos.push("😈 Aucun Diable : les joueurs ne pourront pas s'attaquer entre eux. Comme le Diable aide aussi à vider sa main, la partie risque de ne jamais se terminer.");
  else if (c.diable < CLASSIC_COUNTS.diable / 2)
    recos.push("😈 Peu de Diables : les attaques entre joueurs seront rares.");

  if (c.joker === 0)
    recos.push("🃏 Aucun Joker : impossible de bloquer un Diable dirigé contre soi.");

  if (plus === 0)
    recos.push("⏫ Aucune Relance (+2/+4) : pas de contre-attaque possible face à un Diable.");

  if (gamesTotal === 0)
    recos.push("🎲 Aucun mini-jeu : la partie se jouera uniquement aux cartes.");
  else if (gamesTotal / total > 0.45)
    recos.push("🎲 Beaucoup de mini-jeux : peu de cartes pour vider sa main, la partie risque de traîner en longueur.");

  if (c.mgSips >= PREMIUM_SIPS_MAX)
    recos.push("🥃 Pénalité mini-jeu au maximum : les perdants vont boire fort !");

  if (total > 220)
    recos.push(`🃏 Gros paquet (${total} cartes) : prévois une longue partie.`);
  else if (total < 70)
    recos.push(`🃏 Petit paquet (${total} cartes) : la partie sera rapide.`);

  return recos;
}

/* Config premium par défaut : reproduit le mode Harr. */
export function defaultPremium() {
  const games = {};
  GAMES.forEach((g) => { games[g.id] = g.harr; });
  return {
    diable: CLASSIC_COUNTS.diable,
    joker: CLASSIC_COUNTS.joker,
    plus2: CLASSIC_COUNTS.plus2,
    plus4: CLASSIC_COUNTS.plus4,
    games,
    mgSips: 2,
  };
}

/* Borne + assainit une config premium reçue (défensif : valeurs hors bornes,
   clés manquantes). Renvoie toujours un objet complet et valide. */
export function sanitizePremium(p) {
  const d = defaultPremium();
  if (!p || typeof p !== "object") return d;
  const clamp = (v, max, fallback) =>
    Number.isFinite(v) ? Math.max(0, Math.min(Math.round(v), max)) : fallback;
  const out = {
    diable: clamp(p.diable, CLASSIC_COUNTS.diable * PREMIUM_MAX_MULT, d.diable),
    joker: clamp(p.joker, CLASSIC_COUNTS.joker * PREMIUM_MAX_MULT, d.joker),
    plus2: clamp(p.plus2, CLASSIC_COUNTS.plus2 * PREMIUM_MAX_MULT, d.plus2),
    plus4: clamp(p.plus4, CLASSIC_COUNTS.plus4 * PREMIUM_MAX_MULT, d.plus4),
    games: {},
    mgSips: p.mgSips ? Math.max(1, Math.min(Math.round(p.mgSips), PREMIUM_SIPS_MAX)) : d.mgSips,
  };
  const src = (p.games && typeof p.games === "object") ? p.games : {};
  GAMES.forEach((g) => { out.games[g.id] = clamp(src[g.id], PREMIUM_GAME_MAX, g.harr); });
  return out;
}

/* kind : inapp_dice | inapp_vote | inapp_timer | inapp_letter | regard |
          inapp_mime | inapp_pear | inapp_city | inapp_roulette |
          inapp_connexion | inapp_patate | inapp_piraterie | facilitator | offapp
   harrOnly : carte présente uniquement dans le deck du mode Harr. */
export const GAMES = [
  { id: "21", name: "Le 21", chill: 3, harr: 1, kind: "offapp",
    rule: "À tour de rôle, chacun dit **1, 2 ou 3 chiffres** qui se suivent.\n- Interdit de dire *le même nombre de chiffres* que le joueur précédent.\n- On compte ainsi jusqu'à 21.\n\nCelui qui tombe sur **21** perd et boit." },
  { id: "valise", name: "La valise", chill: 2, harr: 2, kind: "offapp",
    rule: "Le premier joueur dit : « Dans ma valise, il y a… » et un objet.\nChacun **répète toute la liste** puis ajoute son objet.\n\nCelui qui se trompe ou oublie un objet perd et boit." },
  { id: "de", name: "Défi de dé", chill: 3, harr: 2, kind: "inapp_dice",
    rule: "Choisis un adversaire. Vous lancez **chacun votre dé**.\n\nLe plus bas boit **l'écart** en gorgées." },
  { id: "categorie", name: "Catégorie", chill: 2, harr: 2, kind: "offapp",
    rule: "Choisis une catégorie *(marques de bière, pays, Pokémon…)*.\nChacun donne un item à tour de rôle, **sans répéter**.\n\nLe premier qui sèche perd et boit." },
  { id: "chanteur", name: "Le chanteur", chill: 2, harr: 2, kind: "offapp",
    rule: "Le lanceur propose un **chanteur ou un groupe** connu.\nÀ tour de rôle, chacun cite une chanson de cet artiste, *sans répéter*.\n\nLe premier qui sèche perd et boit." },
  { id: "connexion", name: "Connexion", chill: 2, harr: 2, kind: "inapp_connexion",
    rule: "Une catégorie simple est tirée *(couleur, fruit, fast-food…)*.\nAu décompte, chacun **dit un mot** de cette catégorie en même temps.\n\nTous ceux qui ont dit **le même mot** sont connectés et boivent !" },
  { id: "petitbac", name: "Petit bac", chill: 4, harr: 2, kind: "inapp_letter",
    rule: "Une **lettre** est tirée.\nChacun écrit un mot par catégorie commençant par cette lettre, *avant la fin du chrono*.\n\nLe lanceur du petit bac désigne le perdant, qui boit." },
  { id: "nioui", name: "Ni oui ni non", chill: 1, harr: 1, kind: "inapp_timer",
    rule: "Pendant **10 minutes**, interdit de dire « __oui__ » ou « __non__ ».\n\nChaque personne qui se fait avoir boit **une gorgée**." },
  { id: "motinterdit", name: "Mot interdit", chill: 2, harr: 2, kind: "inapp_timer",
    rule: "Le joueur choisit un **mot interdit** pour les **10 prochaines minutes**.\n\nChaque personne qui le prononce boit **une gorgée**." },
  { id: "regard", name: "Le regard", chill: 3, harr: 2, kind: "regard",
    rule: "Tout le monde fixe la table.\nAu **top**, chacun lève les yeux vers quelqu'un.\n\nSi deux personnes **se regardent** : elles boivent une gorgée." },
  { id: "vote", name: "Vote secret", chill: 4, harr: 2, kind: "inapp_vote",
    rule: "Le joueur pose une question *(ex : qui mourrait en premier dans un film d'horreur ?)*.\nChacun vote **en secret**.\n\nLe (ou les) plus voté perd et boit." },
  { id: "mime", name: "Mime", chill: 2, harr: 2, kind: "inapp_mime",
    rule: "Le lanceur choisit un mot ou une situation. **Tout le monde mime** en même temps.\n\nLe lanceur désigne le **pire mime**, qui boit." },
  { id: "doigt", name: "Jeu du doigt", chill: 2, harr: 2, kind: "facilitator",
    rule: "Chaque joueur pose **un doigt sur le verre**.\n- Le lanceur compte *1, 2, 3* puis annonce combien de doigts resteront.\n- Les autres retirent ou non leur doigt.\n- Si le lanceur devine juste, il retire **définitivement** son doigt.\n\nLe dernier à pouvoir retirer son doigt perd et boit.\n__Attention__ : si tu célèbres ta réussite en retirant ton doigt, tu dois le remettre en jeu !" },
  { id: "poire", name: "Coupe la poire", chill: 2, harr: 2, kind: "inapp_pear",
    rule: "Une poire apparaît avec une **direction de coupe cible** *(la même pour tous)*.\nReproduis-la du mieux possible.\n\nLe plus éloigné de la cible perd et boit." },
  { id: "ville", name: "Place la ville", chill: 2, harr: 2, kind: "inapp_city",
    rule: "Une **ville française** est tirée.\nChacun place un marqueur sur la carte.\n\nLe plus éloigné de la vraie position perd et boit." },
  { id: "imposteur", name: "Undercover", chill: 2, harr: 2, kind: "inapp_imposteur",
    rule: "Chacun reçoit un **mot secret**, sauf :\n- l'**undercover**, qui a un mot différent mais proche ;\n- **Mister White**, qui n'a *aucun mot*.\n\nÀ tour de rôle, décrivez votre mot **sans le dire**. À chaque manche, votez pour éliminer un joueur *(l'hôte désigne l'éliminé)*.\n\nLes civils gagnent si l'undercover et Mister White sont éliminés. **Les éliminés boivent.**" },
  { id: "dix", name: "C'est un 10 mais", chill: 2, harr: 2, kind: "inapp_dix",
    rule: "Le lanceur voit une carte *(1 à 10)* et lance un « **c'est un 10 mais…** » à l'oral.\nChacun note de 1 à 10.\n\nAu dévoilement de la carte :\n- chacun boit **l'écart** entre sa note et la carte ;\n- le lanceur boit **la moyenne** des écarts." },
  { id: "cascade", name: "Cascade", chill: 0, harr: 2, kind: "facilitator", noLoser: true, harrOnly: true,
    rule: "Tout le monde **commence à boire** en même temps.\n- Le lanceur pose son verre quand il veut.\n- Un joueur ne peut reposer son verre qu'**après** le joueur précédent.\n\nSi un joueur finit son verre avant que le précédent n'ait reposé le sien, ce dernier doit finir son verre **cul sec** 🥃." },
  { id: "russe", name: "Shot russe", chill: 0, harr: 3, kind: "facilitator", noLoser: true, harrOnly: true,
    rule: "Le joueur prépare plusieurs shots : **un seul** contient de l'alcool.\nChacun en prend un à tour de rôle, *en pokerface* 😐. Le lanceur choisit son shot **en dernier**.\n\nÀ vous de découvrir qui avait le shot alcoolisé !" },
  { id: "duelsec", name: "Duel de sec", chill: 0, harr: 1, kind: "facilitator", drawLoser: true, duel: true, harrOnly: true,
    rule: "Le joueur défie un adversaire à un **cul-sec**.\nLes deux verres doivent avoir un *volume similaire*.\n\nLe perdant **pioche une carte**." },
  { id: "duelregard", name: "Duel de regard", chill: 1, harr: 1, kind: "facilitator", duel: true,
    rule: "Le joueur défie un adversaire : ils se **fixent dans les yeux**.\n\nLe premier qui *rit* ou *détourne le regard* perd et boit." },
  { id: "enchere", name: "L'enchère des secs", chill: 0, harr: 2, kind: "offapp", noLoser: true, harrOnly: true,
    rule: "Le joueur déclare finir son verre en moins de **X secondes**.\nLe suivant **surenchérit** ou crie « **menteur !** ».\n- Si le bluffeur finit dans les temps : celui qui a crié « menteur » finit aussi son verre.\n- Sinon : c'est le bluffeur qui finit son verre." },
  { id: "roulette", name: "Roulette Harr", chill: 0, harr: 2, kind: "inapp_roulette", harrOnly: true,
    rule: "*Réservée au mode Harr.*\n\nLance la roue et **applique le sort** qui tombe !" },
  { id: "patate", name: "Patate chaude", chill: 0, harr: 2, kind: "inapp_patate", harrOnly: true, noLoser: true,
    rule: "*Réservée au mode Harr.*\n\nLa musique monte… Lance le dé :\n- dès que tu fais **6**, passe le téléphone *(le 6 affiché !)* au voisin, qui relance ;\n- et ainsi de suite jusqu'au **drop**.\n\nCelui qui tient le téléphone au moment du drop finit son verre **cul sec** 🥃 !" },
  { id: "buffalo", name: "Le Buffalo", chill: 0, harr: 2, kind: "inapp_timer", harrOnly: true,
    rule: "*Réservée au mode Harr.*\n\nUn chrono de **10 minutes** est lancé. Pendant toute la durée, interdit de boire de sa __bonne main__ *(la droite pour les droitiers, la gauche pour les gauchers)*.\n\nQui se fait repérer finit son verre **cul sec** 🥃 !" },
  { id: "piraterie", name: "La Piraterie", chill: 0, harr: 2, kind: "inapp_piraterie", harrOnly: true, noLoser: true,
    rule: "*Réservée au mode Harr.*\n\n**20 coffres** de pirates, un seul cache une **bombe** 💣.\nSur le téléphone du lanceur, chacun son tour ouvre autant de coffres qu'il ose, puis passe l'appareil au voisin.\n\nCelui qui déterre la bombe finit son verre **cul sec** 🥃 !" },
];

export function game(id) { return GAMES.find((g) => g.id === id); }

export const TYPE_META = {
  action: { color: "#ff3b5c", glow: "rgba(255,59,92,.55)", tag: "ACTION", ic: "🍺" },
  diable: { color: "#b15bff", glow: "rgba(177,91,255,.55)", tag: "DIABLE", ic: "😈" },
  jeu: { color: "#37a6ff", glow: "rgba(55,166,255,.55)", tag: "JEU", ic: "🎲" },
  joker: { color: "#27d17c", glow: "rgba(39,209,124,.55)", tag: "JOKER", ic: "🃏" },
  plus: { color: "#ff9b2f", glow: "rgba(255,155,47,.55)", tag: "RELANCE", ic: "⏫" },
  echange: { color: "#00c6c6", glow: "rgba(0,198,198,.55)", tag: "ÉCHANGE", ic: "🔄" },
  echangecarte: { color: "#12b3a6", glow: "rgba(18,179,166,.55)", tag: "ÉCHANGE 1", ic: "🔃" },
};

export const DICE = [null, "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
export const PETITBAC_CATS = ["Prénom", "Pays", "Alcool", "Métier", "Objet", "Animal", "Célébrité"];
export const PETITBAC_LETTERS = "ABCDEFGHILMNOPRSTV";
export const TEN_MIN = 10 * 60 * 1000;
export const PETITBAC_DURATION = 75 * 1000;

export const CARD_INFO = {
  action: "**Carte action.** À ton tour, après avoir pioché : pose-la et **bois la peine**.\n- Empile plusieurs cartes **identiques** pour cumuler les gorgées.\n- Ajoute un **Diable** pour refiler la peine à un autre joueur.",
  diable: "**Carte diable.** Se pose __avec__ une (ou plusieurs) carte(s) action identiques : elle **envoie la peine** à un autre joueur.\n\nTu poses 2 cartes ou plus → ta main diminue.",
  joker: "**Carte joker.** Se joue *en réaction* pour **refuser un diable** dirigé contre toi.\n\nQuand tu la joues, elle quitte ta main.",
  plus: "**Carte relance (+2 / +4).** En réaction à un diable : tu **renvoies la peine** à un autre joueur en ajoutant *+2 ou +4 gorgées*.\n\nElle quitte ta main.",
  echange: "**Carte échange de main.** À ton tour : choisis un adversaire, vous **échangez intégralement** vos mains.\n\n*Parfait pour te débarrasser d'une grosse main !*",
  echangecarte: "**Carte échange de carte.** À ton tour : choisis une carte de ta main à **défausser**, elle est remplacée par une carte piochée.\n\n*Idéal pour te débarrasser d'une carte qui ne t'arrange pas.*",
};

/* Mots / situations proposés pour le mime. */
export const MIME_WORDS = [
  "Un poulet", "Faire du ski", "Un robot", "Se laver les dents", "Un singe",
  "Jouer de la guitare", "Un zombie", "Pêcher un poisson", "Conduire une voiture",
  "Un funambule", "Faire un selfie", "Un boxeur", "Manger des spaghettis",
  "Un super-héros", "Repasser une chemise", "Un chat qui dort", "Faire la cuisine",
  "Un magicien", "Nager le crawl", "Un bébé qui pleure", "Tondre la pelouse",
  "Un cow-boy", "Prendre l'avion", "Un fantôme", "Jouer au tennis",
  "Un serveur débordé", "Faire du yoga", "Un dinosaure", "Se faire piquer par une abeille",
  "Un mannequin sur un podium", "Ouvrir une bouteille de champagne", "Un sumo",
];

/* Roulette Harr : segments dans l'ordre d'affichage sur la roue.
   needsTarget → le lanceur choisit une cible avant de valider. */
export const ROULETTE = [
  { label: "Bois 3 gorgées", color: "#ff3b5c", self: "boit 3 gorgées" },
  { label: "Distribue 3 gorgées", color: "#37a6ff", needsTarget: true, give: "boit 3 gorgées" },
  { label: "Ajoute de l'alcool dans ton verre", color: "#b15bff", self: "ajoute de l'alcool dans son verre" },
  { label: "Finis ton verre", color: "#ff9b2f", self: "finit son verre 🥃" },
  { label: "Bois 5 gorgées", color: "#e8401e", self: "boit 5 gorgées" },
  { label: "Distribue 5 gorgées", color: "#27d17c", needsTarget: true, give: "boit 5 gorgées" },
  { label: "Alcool dans le verre de ton choix", color: "#7d3bff", needsTarget: true, give: "se prend un peu d'alcool en plus dans son verre" },
  { label: "Distribue un sec", color: "#f4c95d", needsTarget: true, give: "se prend un sec 🥃" },
];

/* « L'imposteur » : paires (mot des civils / mot de l'imposteur), proches. */
export const IMPOSTER_PAIRS = [
  /* ALCOOL */
  ["Shot", "Cul Sec"], ["Vodka", "Tequila"], ["Gueule de bois", "Blackout"],
  ["Kebab", "McDo"], ["Barman", "Videur"], ["Cendrier", "Briquet"],
  ["Bière", "Cidre"], ["Boîte de nuit", "Bar de strip-tease"],
  /* SEXE */
  ["Fion", "Anus"], ["Sexe anal", "Sexe oral"], ["Fellation", "Cunnilingus"],
  ["Partouze", "Plan à 3"], ["Masturbation", "Préliminaires"],
  ["Missionnaire", "Levrette"], ["Sextape", "Nudes"], ["Cougar", "MILF"],
  ["Sugar Daddy", "Gigolo"], ["Ex partenaire", "Amant / Maîtresse"],
  ["Tinder", "Pornhub"],
  /* OBJETS */
  ["Préservatif", "Pilule"], ["Menottes", "Fouet"], ["String", "Culotte"],
  ["Papier toilette", "Brosse à chiottes"],
  /* BEURK */
  ["Pet", "Rot"], ["Diarrhée", "Constipation"], ["Poil de cul", "Poil de nez"],
  ["Sperme", "Cyprine"],
];

/* Nombre de rôles selon le nombre de joueurs. */
export function imposterSetup(n) {
  const imposteurs = n >= 6 ? 2 : 1;
  const white = n <= 3 ? 0 : 1;
  return { imposteurs, white };
}

/* « C'est un 10 mais » : couleurs de cartes. */
export const CARD_SUITS = [
  { s: "♥", red: true }, { s: "♦", red: true }, { s: "♣", red: false }, { s: "♠", red: false },
];

/* « Connexion » : catégories simples proposées au hasard. */
export const CONNEXION_CATS = [
  "Une couleur", "Un fruit", "Un fast-food", "Un animal", "Un pays",
  "Une marque de voiture", "Un sport", "Un métier", "Une boisson", "Un légume",
  "Un film culte", "Un jour de la semaine", "Une partie du corps", "Un instrument de musique",
  "Un super-héros", "Une saison", "Un dessert", "Un moyen de transport",
  "Une pièce de la maison", "Un réseau social",
];

/* Adresse qui reçoit les suggestions d'amélioration (bouton de la home). */
export const SUGGEST_EMAIL = "gauthier.gache@gmail.com";

/* Page de dons/soutien (bouton « Soutenir le projet » de la home). */
export const SUPPORT_URL = "https://ko-fi.com/aperuno";

/* Réseaux sociaux (liens cliquables de la home). Ce sont des « universal links »
   https://… : sur mobile, iOS/Android les ouvrent directement dans l'app native
   Instagram / TikTok si elle est installée (sinon dans le navigateur). */
export const INSTAGRAM_URL = "https://www.instagram.com/aperuno.app/";
export const TIKTOK_URL = "https://www.tiktok.com/@aperuno.app";

/* Informations légales (CGU / confidentialité). */
export const APP_NAME = "APERUNO";
export const CONTACT_EMAIL = "gauthier.gache@gmail.com";
export const LEGAL_UPDATED = "août 2026";

/* ------------------------------------------------------------------------
   Mentions légales (obligatoires en France — LCEN, art. 6-III).
   Éditeur = personne physique (particulier). ⚠️ À COMPLÉTER avant mise en
   ligne : remplace les valeurs entre crochets par tes informations réelles.
   ------------------------------------------------------------------------ */
export const SITE_NAME = "aperuno.fr";
// Nom et prénom de l'éditeur du site (obligatoire).
export const LEGAL_EDITOR = "Gauthier Gâche";
// Directeur de la publication (en général la même personne que l'éditeur).
export const LEGAL_PUBLISHER = "Gauthier Gâche";
// Hébergeur (le site est publié via GitHub Pages).
export const LEGAL_HOST =
  "GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis";

