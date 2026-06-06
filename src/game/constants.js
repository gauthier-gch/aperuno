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

/* Gorgées infligées au perdant d'un mini-jeu, selon le mode. */
export function sipsFor(mode) {
  return mode === "harr" ? 2 : 1;
}

/* kind : inapp_dice | inapp_vote | inapp_timer | inapp_letter | regard |
          inapp_mime | inapp_pear | inapp_city | inapp_roulette |
          facilitator | offapp
   harrOnly : carte présente uniquement dans le deck du mode Harr. */
export const GAMES = [
  { id: "21", name: "Le 21", chill: 3, harr: 1, kind: "offapp",
    rule: "À tour de rôle, chacun dit 1, 2 ou 3 chiffres qui se suivent, mais jamais le même nombre de chiffres que le joueur précédent. Celui qui tombe sur 21 perd et boit." },
  { id: "valise", name: "La valise", chill: 2, harr: 2, kind: "offapp",
    rule: "Le premier joueur dit un objet « dans sa valise ». Chacun répète la liste et ajoute un objet. Celui qui se trompe perd et boit." },
  { id: "de", name: "Défi de dé", chill: 3, harr: 2, kind: "inapp_dice",
    rule: "Choisis un adversaire. Vous lancez chacun votre dé. Le plus bas boit l'écart en gorgées." },
  { id: "categorie", name: "Catégorie", chill: 2, harr: 2, kind: "offapp",
    rule: "Choisis une catégorie. Chacun donne un item à tour de rôle. Le premier qui sèche perd et boit." },
  { id: "petitbac", name: "Petit bac", chill: 4, harr: 2, kind: "inapp_letter",
    rule: "Une lettre est tirée. Chacun écrit un mot par catégorie commençant par cette lettre, avant la fin du chrono." },
  { id: "nioui", name: "Ni oui ni non", chill: 1, harr: 1, kind: "inapp_timer",
    rule: "Pendant 10 minutes, interdit de dire « oui » ou « non ». Chaque personne qui se fait avoir boit une gorgée." },
  { id: "motinterdit", name: "Mot interdit", chill: 2, harr: 2, kind: "inapp_timer",
    rule: "Le joueur choisit un mot interdit pendant 10 minutes. Chaque personne qui le dit boit une gorgée." },
  { id: "regard", name: "Le regard", chill: 3, harr: 2, kind: "regard",
    rule: "Tout le monde fixe la table. Au top, chacun lève les yeux vers quelqu'un. Si deux personnes se regardent : elles boivent une gorgée." },
  { id: "vote", name: "Vote secret", chill: 4, harr: 2, kind: "inapp_vote",
    rule: "Le joueur pose une question (ex : qui mourrait en premier dans un film d'horreur ?). Chacun vote en secret — même pour soi. Le plus voté perd et boit." },
  { id: "mime", name: "Mime", chill: 2, harr: 2, kind: "inapp_mime",
    rule: "Le lanceur choisit un mot ou une situation. Tout le monde mime. Le lanceur désigne le pire mime, qui boit." },
  { id: "doigt", name: "Jeu du doigt", chill: 2, harr: 2, kind: "facilitator",
    rule: "Chaque joueur pose un doigt sur le verre. Le lanceur compte 1, 2, 3 puis annonce combien de doigts resteront. Les autres retirent ou non leur doigt. Si le lanceur devine juste, il retire définitivement son doigt. Le dernier à pouvoir retirer définitivement son doigt perd et boit. Attention : si tu célèbres ta réussite en retirant ton doigt, tu dois le remettre en jeu !" },
  { id: "poire", name: "Coupe la poire", chill: 2, harr: 2, kind: "inapp_pear",
    rule: "Une poire apparaît. Chaque joueur effectue une coupe verticale. Le plus éloigné de la coupe parfaitement centrale perd et boit." },
  { id: "ville", name: "Place la ville", chill: 2, harr: 2, kind: "inapp_city",
    rule: "Une ville française est tirée. Chacun place un marqueur sur la carte. Le plus éloigné de la vraie position perd et boit." },
  { id: "cascade", name: "Cascade", chill: 0, harr: 2, kind: "facilitator", noLoser: true,
    rule: "Tout le monde boit en même temps. Un joueur ne peut s'arrêter que lorsque le précédent a reposé son verre." },
  { id: "russe", name: "Shot russe", chill: 0, harr: 3, kind: "facilitator", noLoser: true,
    rule: "Le joueur prépare plusieurs shots, un seul contient de l'alcool. Chacun en prend un à tour de rôle." },
  { id: "duelsec", name: "Duel de sec", chill: 0, harr: 1, kind: "facilitator",
    rule: "Le joueur défie un adversaire à un cul-sec. Les deux verres doivent avoir un volume similaire." },
  { id: "duelregard", name: "Duel de regard", chill: 1, harr: 1, kind: "facilitator",
    rule: "Le joueur défie un adversaire : ils se fixent dans les yeux. Le premier qui rit ou détourne perd et boit." },
  { id: "enchere", name: "L'enchère des secs", chill: 0, harr: 2, kind: "offapp", noLoser: true,
    rule: "Le joueur déclare finir son verre en moins de X secondes. Le suivant surenchérit ou crie « menteur ». Si « menteur » a tort et que le bluffeur a fini son verre dans les temps, celui qui a crié « menteur » finit aussi son verre. Sinon, c'est le bluffeur qui finit son verre." },
  { id: "roulette", name: "Roulette Harr", chill: 0, harr: 2, kind: "inapp_roulette", harrOnly: true,
    rule: "Réservée au mode Harr. Lance la roue et applique le sort qui tombe !" },
];

export function game(id) { return GAMES.find((g) => g.id === id); }

export const TYPE_META = {
  action: { color: "#ff3b5c", glow: "rgba(255,59,92,.55)", tag: "ACTION", ic: "🍺" },
  diable: { color: "#b15bff", glow: "rgba(177,91,255,.55)", tag: "DIABLE", ic: "😈" },
  jeu: { color: "#37a6ff", glow: "rgba(55,166,255,.55)", tag: "JEU", ic: "🎲" },
  joker: { color: "#27d17c", glow: "rgba(39,209,124,.55)", tag: "JOKER", ic: "🃏" },
  plus: { color: "#ff9b2f", glow: "rgba(255,155,47,.55)", tag: "RELANCE", ic: "⏫" },
  echange: { color: "#00c6c6", glow: "rgba(0,198,198,.55)", tag: "ÉCHANGE", ic: "🔄" },
};

export const DICE = [null, "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
export const PETITBAC_CATS = ["Prénom", "Pays", "Alcool", "Métier", "Objet", "Animal", "Célébrité"];
export const PETITBAC_LETTERS = "ABCDEFGHILMNOPRSTV";
export const TEN_MIN = 10 * 60 * 1000;
export const PETITBAC_DURATION = 75 * 1000;

export const CARD_INFO = {
  action: "Carte action. À ton tour, après avoir pioché : pose-la et bois la peine. Tu peux empiler plusieurs cartes identiques pour cumuler les gorgées. Ajoute un Diable pour refiler la peine à un autre joueur.",
  diable: "Carte diable. Se pose AVEC une (ou plusieurs) carte(s) action identiques : elle envoie la peine à un autre joueur. Pose 2 cartes ou plus → ta main diminue.",
  joker: "Carte joker. Se joue en réaction pour refuser un diable dirigé contre toi. Quand tu la joues, elle quitte ta main.",
  plus: "Carte relance (+2 / +4). En réaction à un diable : tu renvoies la peine à un autre joueur en ajoutant +2 ou +4 gorgées. Elle quitte ta main.",
  echange: "Carte échange de main. À ton tour : choisis un adversaire, vous échangez intégralement vos mains. Parfait pour te débarrasser d'une grosse main !",
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
