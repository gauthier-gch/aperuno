/* =========================================================================
   apéruno — moteur de jeu (logique pure, partagée par tous les clients).
   Aucune dépendance React/Firebase : juste des fonctions sur l'état.
   Tout l'aléatoire (dés, lettres, roulette, calculs de perdant…) est résolu
   ICI, dans la transaction Firestore, pour que tous les clients soient
   strictement d'accord sur le résultat.
   ========================================================================= */

import {
  GAMES, game, PETITBAC_LETTERS, PETITBAC_DURATION, TEN_MIN, MIME_WORDS,
  ROULETTE, sipsFor, actionDrink, IMPOSTER_PAIRS, imposterSetup, CARD_SUITS,
  CONNEXION_CATS,
} from "./constants.js";
import { buildDeck, shuffle, makeUid } from "./deck.js";
import { CITIES, project, unproject, distanceKm } from "./cities.js";

/* ----------------------------- création d'état --------------------------- */

export function newLobby(code, mode, host) {
  return {
    code, mode, status: "lobby", hostId: host.id,
    players: [{ id: host.id, name: host.name, photo: host.photo || null, hand: [] }],
    // members : { <uid Firebase> : true } — utilisé par les règles Firestore
    // pour n'autoriser l'écriture qu'aux membres du salon (voir firestore.rules).
    members: host.uid ? { [host.uid]: true } : {},
    deck: [], discard: [], current: 0, winnerId: null,
    turn: { drawn: false },
    announce: null, reaction: null, minigame: null, timers: [], secTarget: null,
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
  s.turn = { drawn: false };
  s.announce = note(`C'est parti ! ${s.players[s.current].name} commence — pioche puis joue 🥃`);
  s.reaction = null; s.minigame = null; s.timers = []; s.secTarget = null;
  return s;
}

/* Ajoute un joueur à une partie déjà lancée : 7 cartes, en fin d'ordre de
   table (n'affecte pas l'index du joueur courant). */
export function joinInProgress(s0, player) {
  const s = clone(s0);
  const hand = [];
  for (let k = 0; k < 7; k++) {
    if (s.deck.length === 0) { s.deck = shuffle(s.discard); s.discard = []; }
    if (s.deck.length === 0) break;
    hand.push(s.deck.shift());
  }
  s.players.push({ id: player.id, name: player.name, photo: player.photo || null, hand });
  s.announce = note(`${player.name} rejoint la partie en cours 👋`);
  return s;
}

/* ------------------------------- helpers état ---------------------------- */

function clone(s) { return JSON.parse(JSON.stringify(s)); }
/* long = true → l'annonce reste affichée longtemps (messages « X boit … »).
   Les autres (pioche, lance un jeu, échange…) disparaissent vite. */
function note(text, long = false) { return { text, ts: Date.now() + Math.random(), long }; }
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
function endTurn(s) {
  s.reaction = null; s.minigame = null;
  advance(s);
  s.turn = { drawn: false };
  checkWinner(s);
}

/* ----------------------------- cartes réaction --------------------------- */

function reactionCardsOf(s, playerIdx) {
  const hand = s.players[playerIdx].hand;
  return {
    joker: hand.find((c) => c.type === "joker"),
    plus2: hand.find((c) => c.type === "plus" && c.value === 2),
    plus4: hand.find((c) => c.type === "plus" && c.value === 4),
  };
}
function resolveDrink(s) {
  const r = s.reaction;
  const ti = idx(s, r.targetId);
  const extra = r.bonus > 0 ? ` + ${r.bonus} gorgée${r.bonus > 1 ? "s" : ""}` : "";
  s.announce = note(`${s.players[ti].name} boit ${r.baseLabel}${extra} 🍻`, true);
  s.reaction = null;
  endTurn(s);
  return s;
}
function offerOrResolve(s) {
  const r = s.reaction;
  const ti = idx(s, r.targetId);
  const rc = reactionCardsOf(s, ti);
  if (rc.joker || rc.plus2 || rc.plus4) {
    s.announce = note(`${s.players[ti].name} est visé : « ${r.baseLabel} »${r.bonus ? ` +${r.bonus}` : ""} 😈`);
    return s;
  }
  return resolveDrink(s);
}

/* --------------------------- init des mini-jeux -------------------------- */

function initMinigame(s, gameId) {
  const g = game(gameId);
  const base = { gameId: g.id, kind: g.kind, phase: "intro", launcherIdx: s.current };
  switch (g.kind) {
    case "inapp_dice": return { ...base, phase: "intro", d1: null, d2: null, oppIdx: null };
    case "inapp_vote": return { ...base, votes: {} };
    case "inapp_letter":
      return { ...base, phase: "intro", letter: randLetter(), answers: {} };
    case "inapp_mime": return { ...base, word: MIME_WORDS[Math.floor(Math.random() * MIME_WORDS.length)] };
    case "inapp_pear": return { ...base, phase: "cut", targetAngle: Math.floor(Math.random() * 180), cuts: {} };
    case "inapp_city": return { ...base, phase: "mark", cityIdx: Math.floor(Math.random() * CITIES.length), marks: {} };
    case "inapp_roulette": return { ...base, segment: null };
    case "inapp_dix": {
      const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
      return { ...base, phase: "guess", value: 1 + Math.floor(Math.random() * 10), suit: suit.s, red: suit.red, guesses: {} };
    }
    case "inapp_imposteur": return initImposteur(s, base);
    case "inapp_connexion":
      return { ...base, phase: "show", category: randCategory() };
    default: return { ...base };
  }
}
function randLetter() { return PETITBAC_LETTERS[Math.floor(Math.random() * PETITBAC_LETTERS.length)]; }
function randCategory() { return CONNEXION_CATS[Math.floor(Math.random() * CONNEXION_CATS.length)]; }

function initImposteur(s, base) {
  const n = s.players.length;
  if (n < 3) return { ...base, phase: "over", cantPlay: true };
  const { imposteurs, white } = imposterSetup(n);
  const pair = IMPOSTER_PAIRS[Math.floor(Math.random() * IMPOSTER_PAIRS.length)];
  const order = shuffle(s.players.map((p) => p.id));
  const roles = {};
  let k = 0;
  for (let i = 0; i < imposteurs; i++) roles[order[k++]] = "imposteur";
  for (let i = 0; i < white; i++) roles[order[k++]] = "white";
  while (k < order.length) roles[order[k++]] = "civil";
  return {
    ...base, phase: "reveal", civilWord: pair[0], imposterWord: pair[1],
    roles, eliminated: [], speakerIdx: 0, speakOrder: [], round: 1, lastElim: null, result: null,
  };
}

/* Ordre de parole des joueurs encore en jeu.
   Règle : Mister White ne commence jamais (il n'a aucun mot). Si le premier
   de la file est Mister White, on le décale à la fin. */
function imposteurSpeakOrder(mg, players) {
  const ids = players.filter((p) => !mg.eliminated.includes(p.id)).map((p) => p.id);
  let guard = 0;
  while (ids.length > 1 && mg.roles[ids[0]] === "white" && guard < ids.length) {
    ids.push(ids.shift());
    guard++;
  }
  return ids;
}

/* ================================ REDUCER ================================ */

export function applyMove(s0, move, myId) {
  const s = clone(s0);
  const me = idx(s, myId);
  if (me < 0) throw new Error("Tu n'es pas dans ce salon.");
  const mine = s.players[me];
  const mode = s.mode;
  const launcher = s.minigame ? s.minigame.launcherIdx : s.current;
  const isLauncher = launcher === me;

  switch (move.type) {
    /* ---------- pioche obligatoire en début de tour ---------- */
    case "drawTurn": {
      requireTurn(s, myId);
      if (s.turn.drawn) throw new Error("Tu as déjà pioché ce tour-ci.");
      draw(s, me, 1);
      s.turn.drawn = true;
      s.announce = note(`${mine.name} pioche une carte 🃏`);
      return s;
    }

    /* ---------- jeu obligatoire ensuite ---------- */
    case "action": {
      requireTurnPlay(s, myId);
      const cards = stackedActions(mine, move.cardIds || [move.cardId]);
      discardFrom(s, me, cards.map((c) => c.id));
      const total = cards.reduce((n, c) => n + c.sips, 0);
      const unit = cards[0].unit;
      s.announce = note(`${mine.name} ${actionDrink(total, unit)} 🍻`, true);
      endTurn(s);
      return s;
    }
    case "actionDiable": {
      requireTurnPlay(s, myId);
      const cards = stackedActions(mine, move.cardIds || [move.cardId]);
      const diable = handCard(mine, move.diableId, "diable");
      const t = idx(s, move.targetId);
      if (t < 0 || t === me) throw new Error("Cible invalide.");
      discardFrom(s, me, [...cards.map((c) => c.id), diable.id]);
      const total = cards.reduce((n, c) => n + c.sips, 0);
      const unit = cards[0].unit;
      s.reaction = {
        byId: myId, targetId: move.targetId,
        baseLabel: actionDrink(total, unit).replace("boit ", ""), bonus: 0,
      };
      return offerOrResolve(s);
    }
    case "reactDrink": {
      if (!s.reaction || s.reaction.targetId !== myId) throw new Error("Aucune réaction attendue de ta part.");
      const r = s.reaction;
      const rc = reactionCardsOf(s, me);
      if (move.choice === "subir") return resolveDrink(s);
      if (move.choice === "joker") {
        if (!rc.joker) throw new Error("Tu n'as pas de joker.");
        discardFrom(s, me, [rc.joker.id]);
        s.announce = note(`${mine.name} refuse avec un joker ! 🃏`);
        s.reaction = null; endTurn(s); return s;
      }
      if (move.choice === "plus") {
        const card = move.value === 4 ? rc.plus4 : rc.plus2;
        if (!card) throw new Error(`Tu n'as pas de carte +${move.value}.`);
        const nt = idx(s, move.nextId);
        if (nt < 0 || nt === me) throw new Error("Cible invalide.");
        discardFrom(s, me, [card.id]);
        r.bonus += move.value;
        r.targetId = move.nextId;
        s.announce = note(`${mine.name} relance +${move.value} sur ${s.players[nt].name} ⏫`);
        return offerOrResolve(s);
      }
      throw new Error("Choix invalide.");
    }
    case "echange": {
      requireTurnPlay(s, myId);
      const card = handCard(mine, move.cardId, "echange");
      const t = idx(s, move.targetId);
      if (t < 0 || t === me) throw new Error("Cible invalide.");
      discardFrom(s, me, [card.id]);
      const tmp = s.players[me].hand;
      s.players[me].hand = s.players[t].hand;
      s.players[t].hand = tmp;
      s.announce = note(`${mine.name} échange sa main avec ${s.players[t].name} 🔄`);
      endTurn(s);
      return s;
    }
    case "echangeCarte": {
      requireTurnPlay(s, myId);
      const card = handCard(mine, move.cardId, "echangecarte");
      const swapOut = mine.hand.find((c) => c.id === move.discardId);
      if (!swapOut || swapOut.id === card.id) throw new Error("Choisis une autre carte à défausser.");
      discardFrom(s, me, [card.id, swapOut.id]);
      draw(s, me, 1); // remplacée par une carte de la pioche
      s.announce = note(`${mine.name} échange une carte 🔃`);
      endTurn(s);
      return s;
    }
    case "playJeu": {
      requireTurnPlay(s, myId);
      const card = handCard(mine, move.cardId, "jeu");
      discardFrom(s, me, [card.id]);
      if (mine.hand.length === 0) {
        s.announce = note(`${mine.name} pose sa dernière carte ! 🏆`);
        s.status = "finished"; s.winnerId = myId; s.minigame = null;
        return s;
      }
      s.minigame = initMinigame(s, card.gameId);
      s.announce = note(`${mine.name} lance « ${card.label} » 🎲`);
      return s;
    }
    case "pass": {
      requireTurnPlay(s, myId);
      s.announce = note(`${mine.name} passe son tour 🙅`);
      endTurn(s);
      return s;
    }

    /* ---------- le gagnant distribue un cul sec ---------- */
    case "winnerSec": {
      if (s.status !== "finished") throw new Error("La partie n'est pas terminée.");
      if (myId !== s.winnerId) throw new Error("Seul le gagnant offre le cul sec.");
      if (s.secTarget) throw new Error("Cul sec déjà distribué.");
      const t = idx(s, move.targetId);
      if (t < 0 || move.targetId === myId) throw new Error("Choisis un autre joueur.");
      s.secTarget = move.targetId;
      s.announce = note(`${mine.name} offre un cul sec à ${s.players[t].name} 🥃`, true);
      return s;
    }

    /* ------------------------------ mini-jeux ------------------------------ */
    case "mgDicePick": {
      mgGuard(s, isLauncher);
      const o = idx(s, move.oppId);
      if (o < 0 || o === launcher) throw new Error("Adversaire invalide.");
      s.minigame.oppIdx = o;
      s.minigame.d1 = null; s.minigame.d2 = null;
      s.minigame.phase = "roll";
      return s;
    }
    case "mgDiceRoll": {
      if (!s.minigame || s.minigame.kind !== "inapp_dice" || s.minigame.phase !== "roll")
        throw new Error("Pas de dé à lancer.");
      const roll = 1 + Math.floor(Math.random() * 6);
      if (me === launcher) { if (s.minigame.d1) throw new Error("Déjà lancé."); s.minigame.d1 = roll; }
      else if (me === s.minigame.oppIdx) { if (s.minigame.d2) throw new Error("Déjà lancé."); s.minigame.d2 = roll; }
      else throw new Error("Tu n'es pas dans ce duel.");
      if (s.minigame.d1 && s.minigame.d2) {
        if (s.minigame.d1 === s.minigame.d2) {
          s.minigame.d1 = null; s.minigame.d2 = null; // égalité → on relance
          s.minigame.tie = (s.minigame.tie || 0) + 1;
        } else {
          s.minigame.phase = "result";
        }
      }
      return s;
    }
    case "mgVote": {
      if (!s.minigame || s.minigame.kind !== "inapp_vote") throw new Error("Pas de vote en cours.");
      const t = idx(s, move.targetId);
      if (t < 0) throw new Error("Vote invalide."); // on autorise le vote pour soi
      s.minigame.votes[myId] = move.targetId;
      if (Object.keys(s.minigame.votes).length >= s.players.length) {
        const tally = {};
        Object.values(s.minigame.votes).forEach((id) => { tally[id] = (tally[id] || 0) + 1; });
        const max = Math.max(...Object.values(tally));
        s.minigame.loserIds = Object.keys(tally).filter((id) => tally[id] === max); // tous les ex æquo
        s.minigame.phase = "result";
      }
      return s;
    }
    case "mgPbReroll": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "intro") throw new Error("Trop tard pour changer la lettre.");
      s.minigame.letter = randLetter();
      return s;
    }
    case "mgPbStart": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "intro") throw new Error("Déjà démarré.");
      s.minigame.phase = "play";
      s.minigame.startsAt = Date.now() + 1500; // petit "prêt ? 3,2,1" synchronisé
      s.minigame.endsAt = s.minigame.startsAt + PETITBAC_DURATION;
      s.announce = note(`Petit bac : lettre « ${s.minigame.letter} » — top dans 1,5 s ! ⏱️`);
      return s;
    }
    case "mgAnswer": {
      if (!s.minigame || s.minigame.kind !== "inapp_letter") throw new Error("Pas de petit bac en cours.");
      s.minigame.answers[myId] = move.answers || {};
      // La 1re validation arrête tout : on révèle (les autres réponses en cours
      // sont auto-validées côté client) — inutile d'attendre la fin du chrono.
      if (!s.minigame.stoppedBy && s.minigame.phase === "play") {
        s.minigame.stoppedBy = myId;
        s.minigame.phase = "reveal";
        s.announce = note(`${mine.name} a validé en premier — fin du petit bac ! ⏱️`);
      }
      return s;
    }
    case "mgReveal": {
      mgGuard(s, isLauncher);
      s.minigame.phase = "reveal";
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
    case "mgRegardCount": {
      mgGuard(s, isLauncher);
      s.minigame.phase = "count";
      s.minigame.endsAt = Date.now() + 3000;
      return s;
    }
    case "mgMimeReroll": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "intro") throw new Error("Le mime a déjà démarré.");
      s.minigame.word = MIME_WORDS[Math.floor(Math.random() * MIME_WORDS.length)];
      return s;
    }
    case "mgMimeStart": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "intro") throw new Error("Le mime a déjà démarré.");
      const w = (move.word || "").trim() || s.minigame.word;
      s.minigame.word = w;
      s.minigame.phase = "play"; // le mot devient visible par tous les joueurs
      s.announce = note(`Mime lancé : à vous de jouer ! 🎭`);
      return s;
    }
    case "mgPearCut": {
      if (!s.minigame || s.minigame.kind !== "inapp_pear") throw new Error("Pas de poire en cours.");
      const cut = move.cut;
      if (!cut || typeof cut.angle !== "number") throw new Error("Coupe invalide.");
      s.minigame.cuts[myId] = cut;
      if (Object.keys(s.minigame.cuts).length >= s.players.length) {
        const target = s.minigame.targetAngle;
        let loserId = null, worst = -1;
        s.players.forEach((p) => {
          const c = s.minigame.cuts[p.id];
          let da = Math.abs((c ? c.angle : 90) - target) % 180;
          if (da > 90) da = 180 - da;                       // écart d'orientation 0..90
          const off = c ? Math.abs(c.offset || 0) : 0.5;    // décalage vs le centre
          const score = da + off * 120;
          s.minigame.cuts[p.id] = { ...(c || {}), score: Math.round(score) };
          if (score > worst) { worst = score; loserId = p.id; }
        });
        s.minigame.loserId = loserId;
        s.minigame.phase = "result";
      }
      return s;
    }
    case "mgCityMark": {
      if (!s.minigame || s.minigame.kind !== "inapp_city") throw new Error("Pas de carte en cours.");
      if (typeof move.x !== "number" || typeof move.y !== "number") throw new Error("Position invalide.");
      s.minigame.marks[myId] = { x: move.x, y: move.y };
      if (Object.keys(s.minigame.marks).length >= s.players.length) {
        const city = CITIES[s.minigame.cityIdx];
        let loserId = null, worst = -1;
        s.players.forEach((p) => {
          const m = s.minigame.marks[p.id];
          const d = m ? distanceKm(unproject(m), city) : 1e9;
          s.minigame.marks[p.id] = { ...m, km: d };
          if (d > worst) { worst = d; loserId = p.id; }
        });
        s.minigame.loserId = loserId;
        s.minigame.phase = "result";
      }
      return s;
    }
    case "mgRouletteSpin": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase === "result") throw new Error("La roue a déjà tourné.");
      s.minigame.segment = Math.floor(Math.random() * ROULETTE.length);
      s.minigame.spinId = (s.minigame.spinId || 0) + 1;
      s.minigame.phase = "result";
      return s;
    }
    /* ---------- passer le tour d'un joueur absent (n'importe qui) ---------- */
    case "skipCurrent": {
      if (s.minigame || s.reaction) throw new Error("Impossible pendant un mini-jeu ou une réaction.");
      const skipped = s.players[s.current];
      s.announce = note(`${skipped.name} est passé (absent) ⏭️`);
      endTurn(s);
      return s;
    }

    /* ---------- duels (regard / sec) : choisir l'adversaire ---------- */
    case "mgDuelPick": {
      mgGuard(s, isLauncher);
      const o = idx(s, move.oppId);
      if (o < 0 || o === launcher) throw new Error("Adversaire invalide.");
      s.minigame.oppIdx = o;
      s.minigame.phase = "duel";
      return s;
    }

    /* ---------- C'est un 10 mais ---------- */
    case "mgDixGuess": {
      if (!s.minigame || s.minigame.kind !== "inapp_dix") throw new Error("Pas de partie en cours.");
      if (me === launcher) throw new Error("Le lanceur ne note pas.");
      if (s.minigame.phase !== "guess") throw new Error("Trop tard pour noter.");
      const v = move.value;
      if (typeof v !== "number" || v < 1 || v > 10) throw new Error("Note invalide (1 à 10).");
      s.minigame.guesses[myId] = v;
      return s;
    }
    case "mgDixReveal": {
      mgGuard(s, isLauncher);
      // Le lanceur boit la moyenne (arrondie) des écarts des autres joueurs.
      const ecarts = Object.values(s.minigame.guesses || {})
        .filter((v) => typeof v === "number")
        .map((v) => Math.abs(v - s.minigame.value));
      s.minigame.launcherSips = ecarts.length
        ? Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length) : 0;
      s.minigame.phase = "reveal";
      return s;
    }

    /* ---------- Connexion ---------- */
    case "mgConnexionReroll": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "show") throw new Error("Trop tard pour changer la catégorie.");
      s.minigame.category = randCategory();
      return s;
    }

    /* ---------- L'imposteur ---------- */
    case "mgImpStart": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "reveal") throw new Error("Déjà démarré.");
      s.minigame.phase = "play"; s.minigame.speakerIdx = 0;
      s.minigame.speakOrder = imposteurSpeakOrder(s.minigame, s.players);
      return s;
    }
    case "mgImpNext": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "play") throw new Error("Pas en phase de parole.");
      const order = s.minigame.speakOrder && s.minigame.speakOrder.length
        ? s.minigame.speakOrder
        : s.players.filter((p) => !s.minigame.eliminated.includes(p.id)).map((p) => p.id);
      s.minigame.speakerIdx = Math.min(s.minigame.speakerIdx + 1, order.length);
      return s;
    }
    case "mgImpToVote": {
      mgGuard(s, isLauncher);
      s.minigame.phase = "elim"; s.minigame.lastElim = null;
      return s;
    }
    case "mgImpEliminate": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "elim") throw new Error("Pas en phase d'élimination.");
      const t = idx(s, move.targetId);
      if (t < 0) throw new Error("Joueur invalide.");
      if (s.minigame.eliminated.includes(move.targetId)) throw new Error("Déjà éliminé.");
      const role = s.minigame.roles[move.targetId];
      s.minigame.eliminated.push(move.targetId);
      s.minigame.lastElim = { id: move.targetId, role };
      s.announce = note(`${s.players[t].name} est éliminé — ${roleLabel(role)} — et boit 1 gorgée 🍻`, true);
      if (role === "white") s.minigame.phase = "whiteguess"; // Mister White tente de deviner
      else imposteurCheckOver(s);
      return s;
    }
    case "mgImpWhiteGuess": {
      if (!s.minigame || s.minigame.kind !== "inapp_imposteur" || s.minigame.phase !== "whiteguess") throw new Error("Pas de tentative en cours.");
      if (!s.minigame.lastElim || s.minigame.lastElim.id !== myId) throw new Error("Ce n'est pas à toi de deviner.");
      const guess = (move.guess || "").trim().toLowerCase();
      const target = s.minigame.civilWord.trim().toLowerCase();
      if (guess && guess === target) {
        s.minigame.result = "white"; s.minigame.phase = "over";
        s.announce = note(`🎭 Mister White a deviné « ${s.minigame.civilWord} » et gagne la manche !`, true);
      } else {
        s.minigame.whiteGuessFailed = true;
        imposteurCheckOver(s);
        if (s.minigame.phase === "whiteguess") s.minigame.phase = "elim";
      }
      return s;
    }
    case "mgImpNextRound": {
      mgGuard(s, isLauncher);
      if (s.minigame.phase !== "elim" || !s.minigame.lastElim) throw new Error("Rien à enchaîner.");
      s.minigame.round += 1;
      s.minigame.speakerIdx = 0;
      s.minigame.speakOrder = imposteurSpeakOrder(s.minigame, s.players);
      s.minigame.lastElim = null;
      s.minigame.whiteGuessFailed = false;
      s.minigame.phase = "play";
      return s;
    }

    case "mgFinish": {
      mgGuard(s, isLauncher);
      const n = move.sips || sipsFor(mode);
      const ids = move.loserIds && move.loserIds.length ? move.loserIds : (move.loserId ? [move.loserId] : []);
      const g = game(s.minigame.gameId);
      if (move.text) {
        // long par défaut (messages de gorgées) sauf si l'appelant précise long:false.
        s.announce = note(move.text, move.long !== false);
      } else if (g.drawLoser && ids.length) {
        // ex. duel de sec : le perdant pioche une carte (rien à boire).
        const names = ids.map((id) => { const i = idx(s, id); if (i < 0) throw new Error("Perdant invalide."); draw(s, i, 1); return s.players[i].name; }).join(", ");
        const many = ids.length > 1;
        s.announce = note(`${names} ${many ? "piochent" : "pioche"} une carte 🃏`);
      } else if (ids.length) {
        const names = ids.map((id) => { const i = idx(s, id); if (i < 0) throw new Error("Perdant invalide."); return s.players[i].name; }).join(", ");
        const many = ids.length > 1;
        s.announce = note(`${names} ${many ? "perdent et boivent" : "perd et boit"} ${n} gorgée${n > 1 ? "s" : ""} 🍻`, true);
      } else {
        s.announce = note("Le perdant boit ! 🍻", true);
      }
      endTurn(s);
      return s;
    }

    default:
      throw new Error("Action inconnue.");
  }
}

/* -------------------------------- gardes -------------------------------- */

function requireTurn(s, id) {
  if (s.minigame) throw new Error("Un mini-jeu est en cours.");
  if (s.reaction) throw new Error("On attend une réaction.");
  if (!isTurn(s, id)) throw new Error("Ce n'est pas ton tour.");
}
function requireTurnPlay(s, id) {
  requireTurn(s, id);
  if (!s.turn.drawn) throw new Error("Tu dois d'abord piocher une carte.");
}
function mgGuard(s, isLauncher) {
  if (!s.minigame) throw new Error("Aucun mini-jeu en cours.");
  if (!isLauncher) throw new Error("Seul le lanceur peut faire ça.");
}

export function roleLabel(role) {
  return role === "imposteur" ? "Undercover" : role === "white" ? "Mister White" : "Civil";
}
function activeRoles(s) {
  const mg = s.minigame;
  return s.players.filter((p) => !mg.eliminated.includes(p.id)).map((p) => mg.roles[p.id]);
}
/* Fin de manche de l'imposteur : civils gagnent si imposteur(s)+white éliminés ;
   imposteurs gagnent s'ils atteignent la parité avec les civils. */
function imposteurCheckOver(s) {
  const roles = activeRoles(s);
  const imp = roles.filter((r) => r === "imposteur").length;
  const white = roles.filter((r) => r === "white").length;
  const civ = roles.filter((r) => r === "civil").length;
  if (imp === 0 && white === 0) { s.minigame.result = "civils"; s.minigame.phase = "over"; }
  else if (imp > 0 && civ <= imp) { s.minigame.result = "imposteurs"; s.minigame.phase = "over"; }
}
function handCard(player, cardId, type) {
  const c = player.hand.find((x) => x.id === cardId);
  if (!c || c.type !== type) throw new Error("Carte introuvable.");
  return c;
}
/* Valide un empilement de cartes action : au moins une, toutes identiques. */
function stackedActions(player, cardIds) {
  if (!cardIds || cardIds.length === 0) throw new Error("Aucune carte sélectionnée.");
  const cards = cardIds.map((id) => handCard(player, id, "action"));
  const first = cards[0];
  if (!cards.every((c) => c.sips === first.sips && c.unit === first.unit))
    throw new Error("Tu ne peux empiler que des cartes identiques.");
  return cards;
}
