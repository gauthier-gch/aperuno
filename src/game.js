/* =========================================================================
   apéruno — moteur de jeu (logique pure, partagée par tous les clients)
   Aucune dépendance React/Firebase ici : juste des fonctions sur l'état.
   ========================================================================= */

export const ACTION_CARDS = [
  { label: "1 gorgée", drink: "boit 1 gorgée", chill: 25, hard: 10 },
  { label: "2 gorgées", drink: "boit 2 gorgées", chill: 20, hard: 15 },
  { label: "3 gorgées", drink: "boit 3 gorgées", chill: 12, hard: 15 },
  { label: "5 gorgées", drink: "boit 5 gorgées", chill: 3, hard: 17 },
  { label: "1 shot", drink: "boit 1 shot", chill: 0, hard: 3 },
];

// kind: inapp_dice | inapp_vote | inapp_timer | inapp_letter | regard | facilitator | offapp
export const GAMES = [
  { id: "21", name: "Le 21", chill: 3, hard: 1, kind: "offapp",
    rule: "À tour de rôle, chacun dit 1, 2 ou 3 chiffres qui se suivent, mais jamais le même nombre de chiffres que le joueur précédent. Celui qui tombe sur 21 perd." },
  { id: "valise", name: "La valise", chill: 2, hard: 2, kind: "offapp",
    rule: "Le premier joueur dit un objet « dans sa valise ». Chacun répète la liste et ajoute un objet. Celui qui se trompe perd." },
  { id: "de", name: "Défi de dé", chill: 3, hard: 2, kind: "inapp_dice",
    rule: "Choisis un adversaire. Vous lancez chacun un dé. Le plus haut gagne et distribue l'écart en gorgées." },
  { id: "categorie", name: "Catégorie", chill: 2, hard: 2, kind: "offapp",
    rule: "Choisis une catégorie. Chacun donne un item à tour de rôle. Le premier qui sèche perd." },
  { id: "petitbac", name: "Petit bac", chill: 4, hard: 2, kind: "inapp_letter",
    rule: "Une lettre est tirée. Chacun écrit un mot par catégorie commençant par cette lettre, avant la fin du chrono." },
  { id: "nioui", name: "Ni oui ni non", chill: 1, hard: 1, kind: "inapp_timer",
    rule: "Pendant 10 minutes, interdit de dire « oui » ou « non ». Chaque personne qui se fait avoir boit une gorgée." },
  { id: "motinterdit", name: "Mot interdit", chill: 2, hard: 2, kind: "inapp_timer",
    rule: "Le joueur choisit un mot interdit pendant 10 minutes. Chaque personne qui le dit boit une gorgée." },
  { id: "regard", name: "Le regard", chill: 3, hard: 2, kind: "regard", draws: false,
    rule: "Tout le monde fixe la table. Au top, chacun lève les yeux vers quelqu'un. Si deux personnes se regardent : elles boivent une gorgée (pas de pioche)." },
  { id: "vote", name: "Vote secret", chill: 4, hard: 2, kind: "inapp_vote",
    rule: "Le joueur pose une question (ex : qui mourrait en premier dans un film d'horreur ?). Chacun vote en secret. Le plus voté perd." },
  { id: "cascade", name: "Cascade", chill: 0, hard: 2, kind: "facilitator",
    rule: "Tout le monde boit en même temps. Un joueur ne peut s'arrêter que lorsque le précédent a reposé son verre." },
  { id: "russe", name: "Shot russe", chill: 0, hard: 3, kind: "facilitator",
    rule: "Le joueur prépare plusieurs shots, un seul contient de l'alcool. Chacun en prend un à tour de rôle." },
  { id: "duelsec", name: "Duel de sec", chill: 0, hard: 1, kind: "facilitator",
    rule: "Le joueur défie un adversaire à un cul-sec. Les deux verres doivent avoir un volume similaire." },
  { id: "duelregard", name: "Duel de regard", chill: 1, hard: 1, kind: "facilitator",
    rule: "Le joueur défie un adversaire : ils se fixent dans les yeux. Le premier qui rit ou détourne perd." },
  { id: "enchere", name: "L'enchère", chill: 0, hard: 2, kind: "offapp",
    rule: "Le joueur déclare boire son verre en moins de X secondes. Le suivant surenchérit ou crie « menteur ». Le perdant pioche." },
];

export const TYPE_META = {
  action: { color: "#ff3b5c", glow: "rgba(255,59,92,.55)", tag: "ACTION", ic: "🍺" },
  diable: { color: "#b15bff", glow: "rgba(177,91,255,.55)", tag: "DIABLE", ic: "😈" },
  jeu: { color: "#37a6ff", glow: "rgba(55,166,255,.55)", tag: "JEU", ic: "🎲" },
  joker: { color: "#27d17c", glow: "rgba(39,209,124,.55)", tag: "JOKER", ic: "🃏" },
};

export const DICE = [null, "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
export const PETITBAC_CATS = ["Prénom", "Pays", "Alcool", "Métier", "Objet", "Animal"];
const PETITBAC_LETTERS = "ABCDEFGHILMNOPRSTV";
const TEN_MIN = 10 * 60 * 1000;

export const CARD_INFO = {
  action: "Carte action. À ton tour : pose-la et tu bois la peine. Tu repioches 1 carte (ta main ne diminue pas). Ajoute un Diable pour refiler la peine à un autre joueur.",
  diable: "Carte diable. Se pose toujours AVEC une carte action : elle envoie la peine à un autre joueur. Action + diable = tu poses 2 cartes et n'en repioches qu'1 (ta main diminue).",
  joker: "Carte joker. Se joue uniquement EN RÉACTION pour refuser un diable dirigé contre toi. Quand tu la joues, elle quitte ta main (ta main diminue).",
};

/* ------------------------------- utilitaires ----------------------------- */

function makeUid(prefix, i) {
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
    for (let i = 0; i < a[mode]; i++) deck.push({ id: makeUid("a", n++), type: "action", label: a.label, drink: a.drink });
  });
  GAMES.forEach((g) => {
    for (let i = 0; i < g[mode]; i++) deck.push({ id: makeUid("j", n++), type: "jeu", gameId: g.id, label: g.name });
  });
  for (let i = 0; i < 12; i++) deck.push({ id: makeUid("d", n++), type: "diable", label: "Diable" });
  for (let i = 0; i < 8; i++) deck.push({ id: makeUid("k", n++), type: "joker", label: "Joker" });
  return deck;
}

function clone(s) { return JSON.parse(JSON.stringify(s)); }
function game(id) { return GAMES.find((g) => g.id === id); }

/* ----------------------------- création d'état --------------------------- */

export function newLobby(code, mode, host) {
  return {
    code, mode, status: "lobby", hostId: host.id,
    players: [{ id: host.id, name: host.name, photo: host.photo || null, hand: [] }],
    deck: [], discard: [], current: 0, winnerId: null,
    announce: null, reaction: null, minigame: null, timers: [],
    createdAt: Date.now(),
  };
}

export function dealNewGame(s0, starterIdx) {
  const s = clone(s0);
  const deck = shuffle(buildDeck(s.mode));
  s.players = s.players.map((p) => ({ ...p, hand: deck.splice(0, 7) }));
  s.deck = deck;
  s.discard = [];
  s.current = Math.max(0, Math.min(starterIdx, s.players.length - 1));
  s.status = "playing";
  s.winnerId = null;
  s.announce = note(`C'est parti ! ${s.players[s.current].name} commence 🥃`);
  s.reaction = null; s.minigame = null; s.timers = [];
  return s;
}

/* ------------------------------- helpers état ---------------------------- */

function note(text) { return { text, ts: Date.now() + Math.random() }; }
function idx(s, id) { return s.players.findIndex((p) => p.id === id); }
function isTurn(s, id) { return s.players[s.current] && s.players[s.current].id === id; }

function draw(s, playerIdx, n = 1) {
  for (let k = 0; k < n; k++) {
    if (s.deck.length === 0) { s.deck = shuffle(s.discard); s.discard = []; }
    if (s.deck.length === 0) break;
    s.players[playerIdx].hand.push(s.deck.shift());
  }
}
function discardFrom(s, playerIdx, cardIds) {
  const removed = [];
  s.players[playerIdx].hand = s.players[playerIdx].hand.filter((c) => {
    if (cardIds.includes(c.id)) { removed.push(c); return false; }
    return true;
  });
  s.discard = [...removed, ...s.discard];
  return removed;
}
function advance(s) { s.current = (s.current + 1) % s.players.length; }
function checkWinner(s) {
  const w = s.players.find((p) => p.hand.length === 0);
  if (w) { s.status = "finished"; s.winnerId = w.id; }
}
function endTurn(s) { s.reaction = null; s.minigame = null; advance(s); checkWinner(s); }

function initMinigame(s) {
  const g = game(s.minigamePending);
  const base = { gameId: g.id, kind: g.kind, draws: g.draws !== false, phase: "intro", launcherIdx: s.current };
  if (g.kind === "inapp_dice") return { ...base };
  if (g.kind === "inapp_vote") return { ...base, votes: {} };
  if (g.kind === "inapp_letter")
    return { ...base, letter: PETITBAC_LETTERS[Math.floor(Math.random() * PETITBAC_LETTERS.length)], endsAt: Date.now() + 90 * 1000, answers: {} };
  return { ...base };
}

/* ================================ REDUCER ================================ */
/* applyMove(state, move, myId) -> nouvel état. Lève une erreur si interdit. */

export function applyMove(s0, move, myId) {
  const s = clone(s0);
  const me = idx(s, myId);
  if (me < 0) throw new Error("Tu n'es pas dans ce salon.");
  const mine = s.players[me];
  const launcher = s.minigame ? s.minigame.launcherIdx : s.current;
  const isLauncher = launcher === me;

  switch (move.type) {
    /* ---------- tour normal ---------- */
    case "pass": {
      requireTurn(s, myId);
      draw(s, me, 1);
      s.announce = note(`${mine.name} pioche une carte 🃏`);
      endTurn(s);
      return s;
    }
    case "action": {
      requireTurn(s, myId);
      const card = handCard(mine, move.cardId, "action");
      discardFrom(s, me, [card.id]);
      draw(s, me, 1);
      s.announce = note(`${mine.name} ${card.drink} 🍻`);
      endTurn(s);
      return s;
    }
    case "actionDiable": {
      requireTurn(s, myId);
      const action = handCard(mine, move.cardId, "action");
      const diable = handCard(mine, move.diableId, "diable");
      const t = idx(s, move.targetId);
      if (t < 0 || t === me) throw new Error("Cible invalide.");
      discardFrom(s, me, [action.id, diable.id]);
      draw(s, me, 1);
      const targetJoker = s.players[t].hand.find((c) => c.type === "joker");
      if (targetJoker) {
        s.reaction = { type: "diable", byId: myId, targetId: move.targetId, drink: action.drink, label: action.label, jokerId: targetJoker.id };
        s.announce = note(`${mine.name} envoie « ${action.label} » à ${s.players[t].name}… joker possible 😈`);
        return s; // on attend la réaction, le tour n'avance pas
      }
      s.announce = note(`${s.players[t].name} ${action.drink} (diable de ${mine.name}) 😈`);
      endTurn(s);
      return s;
    }
    case "reactDiable": {
      if (!s.reaction || s.reaction.targetId !== myId) throw new Error("Aucune réaction attendue de ta part.");
      const r = s.reaction;
      if (move.choice === "refuse") {
        discardFrom(s, me, [r.jokerId]);
        s.announce = note(`${mine.name} refuse avec un joker ! 🃏`);
      } else {
        s.announce = note(`${mine.name} ${r.drink} 🍻`);
      }
      endTurn(s);
      return s;
    }
    case "playJeu": {
      requireTurn(s, myId);
      const card = handCard(mine, move.cardId, "jeu");
      discardFrom(s, me, [card.id]);
      if (mine.hand.length === 0) { // poser sa dernière carte = victoire immédiate
        s.announce = note(`${mine.name} pose sa dernière carte ! 🏆`);
        s.status = "finished"; s.winnerId = myId; s.minigame = null;
        return s;
      }
      s.minigamePending = card.gameId;
      s.minigame = initMinigame(s);
      delete s.minigamePending;
      s.announce = note(`${mine.name} lance « ${card.label} » 🎲`);
      return s;
    }

    /* ---------- mini-jeux ---------- */
    case "mgCancel": {
      if (!s.minigame || !isLauncher) throw new Error("Seul le lanceur peut annuler.");
      // rendre la carte jeu au lanceur
      s.players[launcher].hand.push({ id: makeUid("j", 999), type: "jeu", gameId: s.minigame.gameId, label: game(s.minigame.gameId).name });
      s.minigame = null;
      s.announce = note(`Mini-jeu annulé.`);
      return s;
    }
    case "mgDice": {
      mgGuard(s, isLauncher);
      const o = idx(s, move.oppId);
      if (o < 0 || o === launcher) throw new Error("Adversaire invalide.");
      s.minigame.d1 = 1 + Math.floor(Math.random() * 6);
      s.minigame.d2 = 1 + Math.floor(Math.random() * 6);
      s.minigame.oppIdx = o;
      s.minigame.phase = "result";
      return s;
    }
    case "mgVote": {
      if (!s.minigame || s.minigame.kind !== "inapp_vote") throw new Error("Pas de vote en cours.");
      const t = idx(s, move.targetId);
      if (t < 0 || t === me) throw new Error("Vote invalide.");
      s.minigame.votes[myId] = move.targetId;
      if (Object.keys(s.minigame.votes).length >= s.players.length) {
        const tally = {};
        Object.values(s.minigame.votes).forEach((id) => { tally[id] = (tally[id] || 0) + 1; });
        const loserId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        s.minigame.phase = "result";
        s.minigame.loserId = loserId;
      }
      return s;
    }
    case "mgAnswer": {
      if (!s.minigame || s.minigame.kind !== "inapp_letter") throw new Error("Pas de petit bac en cours.");
      s.minigame.answers[myId] = move.answers;
      return s;
    }
    case "mgReveal": {
      mgGuard(s, isLauncher);
      s.minigame.phase = "reveal";
      return s;
    }
    case "mgRegardCount": {
      mgGuard(s, isLauncher);
      s.minigame.phase = "count";
      s.minigame.endsAt = Date.now() + 2800;
      return s;
    }
    case "mgStartTimer": {
      mgGuard(s, isLauncher);
      const label = move.label || game(s.minigame.gameId).name;
      s.timers = [...(s.timers || []), { id: makeUid("t", 0), label, endsAt: Date.now() + TEN_MIN }];
      s.announce = note(`Chrono lancé : ${label} (10 min) ⏳`);
      endTurn(s);
      return s;
    }
    case "mgFinishLoser": {
      mgGuard(s, isLauncher);
      const l = idx(s, move.loserId);
      if (l < 0) throw new Error("Perdant invalide.");
      draw(s, l, 1);
      s.announce = note(`${s.players[l].name} perd et pioche une carte 🃏`);
      endTurn(s);
      return s;
    }
    case "mgFinishNoDraw": {
      mgGuard(s, isLauncher);
      s.announce = note(move.text || "Les perdants boivent une gorgée 🍻");
      endTurn(s);
      return s;
    }

    default:
      throw new Error("Action inconnue.");
  }
}

function requireTurn(s, id) {
  if (s.minigame) throw new Error("Un mini-jeu est en cours.");
  if (s.reaction) throw new Error("On attend une réaction.");
  if (!isTurn(s, id)) throw new Error("Ce n'est pas ton tour.");
}
function mgGuard(s, isLauncher) {
  if (!s.minigame) throw new Error("Aucun mini-jeu en cours.");
  if (!isLauncher) throw new Error("Seul le lanceur peut faire ça.");
}
function handCard(player, cardId, type) {
  const c = player.hand.find((x) => x.id === cardId);
  if (!c || c.type !== type) throw new Error("Carte introuvable.");
  return c;
}

/* code de salon à 4 lettres */
export function genCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I/O
  let c = "";
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}
