import React from "react";
import { MYID } from "../me.js";
import { game } from "../game/constants.js";
import { Overlay, DesignateLoser, ManualEscape, PartialEscape, PARTIAL_KINDS, RichText } from "../components/common.jsx";
import { SEASONS } from "../game/seasons.js";
import { DiceGame } from "./Dice.jsx";
import { VoteGame } from "./Vote.jsx";
import { PetitBacGame } from "./PetitBac.jsx";
import { TimerGame } from "./Timer.jsx";
import { RegardGame } from "./Regard.jsx";
import { MimeGame } from "./Mime.jsx";
import { PearGame } from "./Pear.jsx";
import { CityGame } from "./City.jsx";
import { RouletteGame } from "./Roulette.jsx";
import { DuelGame } from "./Duel.jsx";
import { DixGame } from "./Dix.jsx";
import { ImposteurGame } from "./Imposteur.jsx";
import { ConnexionGame } from "./Connexion.jsx";
import { PatateGame } from "./Patate.jsx";
import { PiraterieGame } from "./Piraterie.jsx";
import { CategorieGame } from "./Categorie.jsx";
import { NewYearGame } from "./NewYear.jsx";
import { CupidonGame } from "./Cupidon.jsx";
import { FleurGame } from "./Fleur.jsx";
import { EggsGame } from "./Eggs.jsx";
import { SunGame } from "./Sun.jsx";
import { InterroGame } from "./Interro.jsx";
import { TrainGame } from "./Train.jsx";
import { SantaGame } from "./Santa.jsx";

/* Phases pendant lesquelles on peut arrêter un mini-jeu avec les joueurs qui
   ont déjà joué (PARTIAL_KINDS : poire, ville, vote, Cupidon, Secret Santa). */
const PARTIAL_PHASES = { inapp_santa: ["give"], inapp_cupidon: ["vote"] };
const LIVE_KINDS = ["inapp_newyear", "inapp_eggs", "inapp_sun", "inapp_train"];
function canPartial(mg) {
  if (!PARTIAL_KINDS.includes(mg.kind)) return false;
  const ph = PARTIAL_PHASES[mg.kind];
  return ph ? ph.includes(mg.phase) : mg.phase !== "result" && mg.phase !== "intro";
}

export function Minigame({ room, act, busy, leave }) {
  const mg = room.minigame;
  const g = game(mg.gameId);
  const season = g.seasonal ? SEASONS[g.seasonal] : null;
  const launcher = room.players[mg.launcherIdx];
  const isLauncher = launcher && launcher.id === MYID;
  const others = room.players.map((p, i) => ({ p, i })).filter((x) => x.p.id !== launcher.id);
  const waiting = <div className="center-col"><p className="muted">En attente de {launcher.name}…</p></div>;
  const shared = { room, mg, g, isLauncher, launcher, others, act, busy, waiting };

  let body = null;
  switch (mg.kind) {
    case "inapp_dice": body = <DiceGame {...shared} />; break;
    case "inapp_vote": body = <VoteGame {...shared} />; break;
    case "inapp_letter": body = <PetitBacGame {...shared} />; break;
    case "inapp_timer": body = <TimerGame {...shared} />; break;
    case "regard": body = <RegardGame {...shared} />; break;
    case "inapp_mime": body = <MimeGame {...shared} />; break;
    case "inapp_pear": body = <PearGame {...shared} />; break;
    case "inapp_city": body = <CityGame {...shared} />; break;
    case "inapp_roulette": body = <RouletteGame {...shared} />; break;
    case "inapp_dix": body = <DixGame {...shared} />; break;
    case "inapp_imposteur": body = <ImposteurGame {...shared} />; break;
    case "inapp_connexion": body = <ConnexionGame {...shared} />; break;
    case "inapp_patate": body = <PatateGame {...shared} />; break;
    case "inapp_piraterie": body = <PiraterieGame {...shared} />; break;
    case "inapp_categorie": body = <CategorieGame {...shared} />; break;
    case "inapp_newyear": body = <NewYearGame {...shared} />; break;
    case "inapp_cupidon": body = <CupidonGame {...shared} />; break;
    case "inapp_fleur": body = <FleurGame {...shared} />; break;
    case "inapp_eggs": body = <EggsGame {...shared} />; break;
    case "inapp_sun": body = <SunGame {...shared} />; break;
    case "inapp_interro": body = <InterroGame {...shared} />; break;
    case "inapp_train": body = <TrainGame {...shared} />; break;
    case "inapp_santa": body = <SantaGame {...shared} />; break;
    default:
      if (g.duel) {
        // duels : choisir l'adversaire PUIS désigner le perdant.
        body = <DuelGame {...shared} />;
      } else if (g.noLoser) {
        // pas de perdant à désigner (cascade, shot russe, enchère) : juste finir.
        body = isLauncher
          ? <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: "mgFinish", text: `« ${g.name} » terminé 🍻`, long: false })}>Terminer le jeu</button>
          : waiting;
      } else {
        // le lanceur désigne le perdant qui boit.
        body = isLauncher
          ? <DesignateLoser players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })} label="Le perdant boit :" />
          : waiting;
      }
  }

  return (
    <Overlay className="mg-sheet">
      <div className="space mb">
        {season
          ? <span className="chip season-chip">{season.emoji} Mini-jeu éphémère</span>
          : <span className="chip">🎲 Carte jeu</span>}
        <button className="btn btn-ghost auto quit-btn" onClick={leave}>Quitter la partie</button>
      </div>
      <h3 className="h-title">{g.name}</h3>
      {/* Jeux en temps réel : la règle laisse la place à l'action une fois lancés. */}
      {!(LIVE_KINDS.includes(mg.kind) && mg.phase !== "intro") && <RichText className="muted mb" text={g.rule} />}
      {body}
      {/* Débloquer un mini-jeu quand quelqu'un (y compris le lanceur) est absent :
          accessible à TOUS, car seul le lanceur a les boutons de fin.
          Inutile pour la patate chaude (un seul téléphone, piloté par le lanceur). */}
      {canPartial(mg) ? (
        <PartialEscape mg={mg} room={room} onStop={() => act({ type: "mgPartialResult" })} />
      ) : mg.kind !== "inapp_patate" && (
        <ManualEscape
          players={room.players}
          onPick={(id) => act({ type: "mgAbort", loserId: id })}
          onClose={() => act({ type: "mgAbort" })} />
      )}
    </Overlay>
  );
}
