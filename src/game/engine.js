/* =========================================================================
   apéruno — moteur de jeu (logique pure, partagée par tous les clients).
   Aucune dépendance React/Firebase : juste des fonctions sur l'état.
   Tout l'aléatoire (dés, lettres, roulette, calculs de perdant…) est résolu
   ICI, dans la transaction Firestore, pour que tous les clients soient
   strictement d'accord sur le résultat.
   ========================================================================= */

import {
  GAMES, game, PETITBAC_LETTERS, PETITBAC_DURATION, TEN_MIN, MIME_WORDS,
  ROULETTE, sipsFor, actionDrink,
} from "./constants.js";
import { buildDeck, shuffle, makeUid } from "./deck.js";
import { CITIES, project, unproject, distanceKm } from "./cities.js";

/* ----------------------------- création d'état --------------------------- */

export function newLobby(code, mode, host) {
  return {
    code, mode, status: "lobby", hostId: host.id,
    players: [{ id: host.id, name: host.name, photo: host.photo || null, hand: [] }],
    deck: [], discard: [], current: 0, winnerId: null,
    turn: { drawn: false },
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
  s.turn = { drawn: false };
  s.announce = note(`C'est parti ! ${s.players[s.current].name} commence — pioche puis joue 🥃`);
  s.reaction = null; s.minigame = null; s.timers = [];
  return s;
}

/* ------------------------------- helpers état ---------------------------- */

function clone(s) { return JSON.parse(JSON.stringify(s)); }
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
function endTurn(s) {
  s.reaction = null; s.minigame = null;
  advance(s);
  s.turn = { drawn: false };
  checkWinner(s);
}

/* Cartes jouables pour amorcer un tour (sinon le joueur peut « passer »). */
function hasPlayable(player) {
  return player.hand.some((c) => c.type === "action" || c.type === "jeu" || c.type === "echange");
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
  s.announce = note(`${s.players[ti].name} boit ${r.baseLabel}${extra} 🍻`);
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
    case "inapp_pear": return { ...base, phase: "cut", cuts: {} };
    case "inapp_city": return { ...base, phase: "mark", cityIdx: Math.floor(Math.random() * CITIES.length), marks: {} };
    case "inapp_roulette": return { ...base, segment: null };
    default: return { ...base };
  }
}
function randLetter() { return PETITBAC_LETTERS[Math.floor(Math.random() * PETITBAC_LETTERS.length)]; }

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
      s.announce = note(`${mine.name} ${actionDrink(total, unit)} 🍻`);
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
      if (hasPlayable(mine)) throw new Error("Tu dois jouer une carte.");
      s.announce = note(`${mine.name} n'a aucune carte jouable et passe son tour.`);
      endTurn(s);
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
        const loserId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        s.minigame.phase = "result";
        s.minigame.loserId = loserId;
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
      s.minigame.word = MIME_WORDS[Math.floor(Math.random() * MIME_WORDS.length)];
      return s;
    }
    case "mgPearCut": {
      if (!s.minigame || s.minigame.kind !== "inapp_pear") throw new Error("Pas de poire en cours.");
      if (typeof move.x !== "number") throw new Error("Coupe invalide.");
      s.minigame.cuts[myId] = move.x;
      if (Object.keys(s.minigame.cuts).length >= s.players.length) {
        let loserId = null, worst = -1;
        s.players.forEach((p) => {
          const dev = Math.abs((s.minigame.cuts[p.id] ?? 0.5) - 0.5);
          if (dev > worst) { worst = dev; loserId = p.id; }
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
    case "mgFinish": {
      mgGuard(s, isLauncher);
      if (move.text) {
        s.announce = note(move.text);
      } else if (move.loserId) {
        const l = idx(s, move.loserId);
        if (l < 0) throw new Error("Perdant invalide.");
        const n = move.sips || sipsFor(mode);
        s.announce = note(`${s.players[l].name} perd et boit ${n} gorgée${n > 1 ? "s" : ""} 🍻`);
      } else {
        s.announce = note("Le perdant boit ! 🍻");
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
