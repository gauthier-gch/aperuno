import React from "react";
import { MYID } from "../me.js";
import { game } from "../game/constants.js";
import { Overlay, DesignateLoser, ManualEscape } from "../components/common.jsx";
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

/* Phases où l'on attend la contribution de chaque joueur (risque de blocage
   si quelqu'un se déconnecte) → le lanceur peut débloquer manuellement. */
function collecting(mg) {
  return (
    (mg.kind === "inapp_vote" && mg.phase !== "result") ||
    (mg.kind === "inapp_pear" && mg.phase === "cut") ||
    (mg.kind === "inapp_city" && mg.phase === "mark") ||
    (mg.kind === "inapp_dix" && mg.phase === "guess") ||
    (mg.kind === "inapp_letter" && mg.phase === "play")
  );
}

export function Minigame({ room, act, busy, leave }) {
  const mg = room.minigame;
  const g = game(mg.gameId);
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
    <Overlay>
      <div className="space mb">
        <span className="chip">🎲 Carte jeu</span>
        <button className="btn btn-ghost btn-sm auto" onClick={leave}>Quitter</button>
      </div>
      <h3 className="h-title">{g.name}</h3>
      <p className="muted mb">{g.rule}</p>
      {body}
      {isLauncher && collecting(mg) && (
        <ManualEscape players={room.players} onPick={(id) => act({ type: "mgFinish", loserId: id })} />
      )}
    </Overlay>
  );
}
