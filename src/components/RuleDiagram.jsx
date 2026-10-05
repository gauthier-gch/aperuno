import React, { useEffect, useRef, useState } from "react";

/* Schémas animés des règles : une petite « table » de 4 joueurs qui rejoue un
   exemple de partie en boucle. Chaque schéma est une liste d'étapes (frames)
   décrivant l'état complet de la scène ; le rendu est commun à tous les jeux.

   Frame : { ms, cap, p: [état joueur ×4], center, links, phone }
   État joueur : { say, glass (0..1), drink, mark, dim, hl, lose, finger, down } */

const SEATS = [
  { name: "G", ini: "G", color: "#ff3b5c", x: 50, y: 13, bub: "r" },
  { name: "Ju", ini: "Ju", color: "#37a6ff", x: 86, y: 50, bub: "tl" },
  { name: "Chloé", ini: "Ch", color: "#27d17c", x: 50, y: 87, bub: "r" },
  { name: "Le C", ini: "LC", color: "#f4c95d", x: 14, y: 50, bub: "tr" },
];
const [G_, JU, CHLOE, LEC] = [0, 1, 2, 3];

/* Raccourci : 4 joueurs à l'état `base`, avec des surcharges par index. */
const ps = (base, over = {}) => SEATS.map((_, i) => ({ ...base, ...(over[i] || {}) }));

/* ---------------- Cascade ---------------- */
const CASCADE = [
  { ms: 1600, cap: "Top départ : tout le monde lève son verre", p: ps({ glass: 1 }), center: { big: "3, 2, 1…" } },
  { ms: 2200, cap: "Tout le monde boit en même temps", p: ps({ glass: 0.75, drink: true }), center: { big: "🍺" } },
  { ms: 2200, cap: "G (lanceur) s'arrête quand bon lui semble", p: ps({ glass: 0.55, drink: true }, { [G_]: { glass: 0.75, drink: false, mark: "✋", hl: true } }), center: { order: true } },
  { ms: 2200, cap: "G a posé son verre → Ju a le droit de s'arrêter", p: ps({ glass: 0.4, drink: true }, { [G_]: { glass: 0.75, mark: "✋", drink: false }, [JU]: { glass: 0.55, drink: false, mark: "✋", hl: true } }), center: { order: true } },
  { ms: 2400, cap: "Le C ne peut pas s'arrêter : Chloé boit encore !", p: ps({ glass: 0.25, drink: true }, { [G_]: { glass: 0.75, mark: "✋", drink: false }, [JU]: { glass: 0.55, mark: "✋", drink: false }, [LEC]: { glass: 0.15, drink: true, mark: "🚫", say: "Je peux ?" } }), center: { order: true } },
  { ms: 2200, cap: "Le C finit son verre avant que Chloé ne s'arrête…", p: ps({ glass: 0.18, drink: true }, { [G_]: { glass: 0.75, mark: "✋", drink: false }, [JU]: { glass: 0.55, mark: "✋", drink: false }, [LEC]: { glass: 0, drink: false, mark: "✅", say: "Fini !" } }), center: { order: true } },
  { ms: 2800, cap: "…alors Chloé, juste avant Le C, finit son verre cul sec 🥃", p: ps({ drink: false }, { [G_]: { glass: 0.75, dim: true }, [JU]: { glass: 0.55, dim: true }, [CHLOE]: { glass: 0, drink: true, lose: true, mark: "🥃" }, [LEC]: { glass: 0, dim: true } }), center: { big: "Cul sec !" } },
];

/* ---------------- Connexion ---------------- */
const CONNEXION = [
  { ms: 1800, cap: "Une catégorie est tirée", p: ps({}), center: { tag: "Catégorie", big: "Sport" } },
  { ms: 900, cap: "Tout le monde ensemble…", p: ps({ say: "1…" }), center: { tag: "Catégorie", big: "Sport" } },
  { ms: 900, cap: "Tout le monde ensemble…", p: ps({ say: "2…" }), center: { tag: "Catégorie", big: "Sport" } },
  { ms: 900, cap: "Tout le monde ensemble…", p: ps({ say: "3 !" }), center: { tag: "Catégorie", big: "Sport" } },
  { ms: 2400, cap: "Chacun crie un mot de la catégorie", p: ps({}, { [G_]: { say: "Basket" }, [JU]: { say: "Foot" }, [CHLOE]: { say: "Basket" }, [LEC]: { say: "Danse" } }), center: { tag: "Catégorie", big: "Sport" } },
  { ms: 3000, cap: "G et Chloé ont dit « Basket » : connectés, les deux boivent !", p: ps({ dim: true }, { [G_]: { say: "Basket", hl: true, lose: true, mark: "🍺", dim: false }, [JU]: { say: "Foot" }, [CHLOE]: { say: "Basket", hl: true, lose: true, mark: "🍺", dim: false }, [LEC]: { say: "Danse" } }), links: [[G_, CHLOE, "both"]], center: { big: "🔗" } },
];

/* ---------------- Jeu du doigt ---------------- */
const ON = { finger: "on" }, OFF = { finger: "off" }, OUT = { finger: "out", dim: true, mark: "🏆" };
const DOIGT = [
  { ms: 2000, cap: "Chacun pose un doigt sur le verre", p: ps(ON), center: { glassBig: true } },
  { ms: 1300, cap: "G compte…", p: ps(ON, { [G_]: { ...ON, say: "1, 2, 3…" } }), center: { glassBig: true } },
  { ms: 2400, cap: "G annonce 4… mais Ju a retiré son doigt", p: ps(ON, { [G_]: { ...ON, say: "4 !", hl: true }, [JU]: OFF }), center: { glassBig: true, count: 3 } },
  { ms: 2000, cap: "Il reste 3 doigts : raté, on remet tout en jeu", p: ps(ON, { [G_]: { ...ON, mark: "❌" } }), center: { glassBig: true } },
  { ms: 1300, cap: "Au tour de Ju…", p: ps(ON, { [JU]: { ...ON, say: "1, 2, 3…" } }), center: { glassBig: true } },
  { ms: 2400, cap: "Ju annonce 2 : Chloé et Le C retirent leur doigt", p: ps(ON, { [JU]: { ...ON, say: "2 !", hl: true }, [CHLOE]: OFF, [LEC]: OFF }), center: { glassBig: true, count: 2 } },
  { ms: 2200, cap: "Il reste bien 2 doigts : Ju retire définitivement le sien", p: ps(ON, { [JU]: OUT }), center: { glassBig: true } },
  { ms: 1300, cap: "Plus que 3 joueurs. Au tour de Chloé…", p: ps(ON, { [JU]: OUT, [CHLOE]: { ...ON, say: "1, 2, 3…" } }), center: { glassBig: true } },
  { ms: 2200, cap: "Chloé annonce 1 : G et Le C retirent, il en reste bien 1", p: ps(OFF, { [JU]: OUT, [CHLOE]: { ...ON, say: "1 !", hl: true } }), center: { glassBig: true, count: 1 } },
  { ms: 2000, cap: "Chloé gagne… et célèbre en levant la main !", p: ps(ON, { [JU]: OUT, [CHLOE]: { ...OFF, say: "Yesss 🙌", mark: "🎉" } }), center: { glassBig: true } },
  { ms: 2800, cap: "Interdit de célébrer : Chloé doit remettre son doigt !", p: ps(ON, { [JU]: OUT, [CHLOE]: { ...ON, lose: true, mark: "😬" } }), center: { glassBig: true } },
];

/* ---------------- L'enchère des secs ---------------- */
const ENCHERE = [
  { ms: 2200, cap: "G annonce un temps pour finir son verre", p: ps({ glass: 1 }, { [G_]: { glass: 1, say: "En 40 s !" } }), center: { big: "⏱" } },
  { ms: 2200, cap: "Ju surenchérit", p: ps({ glass: 1 }, { [JU]: { glass: 1, say: "Moi en 20 s !", hl: true } }), center: { big: "⏱" } },
  { ms: 2200, cap: "Chloé n'y croit pas…", p: ps({ glass: 1 }, { [JU]: { glass: 1, say: "20 s" }, [CHLOE]: { glass: 1, say: "Menteur !", hl: true } }), center: { big: "🤨" } },
  { ms: 3200, cap: "Ju doit le prouver : 20 s pour finir son verre", p: ps({ glass: 1 }, { [JU]: { glass: 0, drink: true, hl: true } }), center: { timer: 20 } },
  { ms: 1800, cap: "Fini à temps ✅", p: ps({ glass: 1 }, { [JU]: { glass: 0, mark: "✅", say: "Et voilà !" } }), center: { big: "18 s" } },
  { ms: 3000, cap: "Chloé a crié « menteur » à tort : verre fini aussi !", p: ps({ glass: 1, dim: true }, { [JU]: { glass: 0, mark: "✅" }, [CHLOE]: { glass: 0, drink: true, lose: true, mark: "🥃", dim: false } }), center: { big: "Cul sec !" } },
];

/* ---------------- Le 21 ---------------- */
const SEQ_21 = [[G_, "1-2-3"], [JU, "4-5"], [CHLOE, "6-7-8"], [LEC, "9"], [G_, "10-11"], [JU, "12-13-14"], [CHLOE, "15"], [LEC, "16-17"], [G_, "18-19-20"]];
const LE21 = [
  ...SEQ_21.map(([who, s]) => ({
    ms: 1150, cap: "1, 2 ou 3 nombres, jamais autant que le joueur précédent",
    p: ps({}, { [who]: { say: s, hl: true } }), center: { big: s.split("-").pop(), tag: "compteur" },
  })),
  { ms: 3000, cap: "Ju tombe sur 21 : perdu, Ju boit !", p: ps({ dim: true }, { [JU]: { say: "21…", lose: true, mark: "🍺", dim: false } }), center: { big: "21", tag: "perdu" } },
];

/* ---------------- Le regard ---------------- */
const DOWN = { down: true };
const REGARD = [
  { ms: 1800, cap: "Tout le monde baisse la tête", p: ps(DOWN), center: { big: "🙇" } },
  { ms: 800, cap: "Décompte…", p: ps(DOWN), center: { big: "3" } },
  { ms: 800, cap: "Décompte…", p: ps(DOWN), center: { big: "2" } },
  { ms: 800, cap: "Décompte…", p: ps(DOWN), center: { big: "1" } },
  { ms: 2400, cap: "Top ! Chacun lève les yeux vers un joueur", p: ps({ mark: "👀" }), links: [[G_, CHLOE], [JU, G_], [CHLOE, G_], [LEC, JU]], center: { big: "Top !" } },
  { ms: 3000, cap: "G et Chloé se regardent : les deux boivent !", p: ps({ dim: true }, { [G_]: { hl: true, lose: true, mark: "🍺", dim: false }, [CHLOE]: { hl: true, lose: true, mark: "🍺", dim: false } }), links: [[G_, CHLOE, "both"]], center: { big: "😳" } },
];

/* ---------------- Patate chaude ---------------- */
const PATATE = [
  { ms: 1400, cap: "La musique monte… G lance le dé", p: ps({}, { [G_]: { hl: true } }), phone: { at: G_, roll: true }, center: { notes: true } },
  { ms: 1700, cap: "4 : pas de 6, G relance", p: ps({}, { [G_]: { hl: true } }), phone: { at: G_, die: 4 }, center: { notes: true } },
  { ms: 1200, cap: "G relance…", p: ps({}, { [G_]: { hl: true } }), phone: { at: G_, roll: true }, center: { notes: true } },
  { ms: 1700, cap: "6 ! G passe le téléphone", p: ps({}, { [G_]: { hl: true, say: "6 !" } }), phone: { at: G_, die: 6 }, center: { notes: true } },
  { ms: 1400, cap: "Ju récupère le téléphone et lance", p: ps({}, { [JU]: { hl: true } }), phone: { at: JU, roll: true }, center: { notes: true } },
  { ms: 1300, cap: "2…", p: ps({}, { [JU]: { hl: true } }), phone: { at: JU, die: 2 }, center: { notes: true } },
  { ms: 3200, cap: "Ça explose ! Ju tient le téléphone : verre cul sec 🥃", p: ps({ dim: true }, { [JU]: { lose: true, mark: "🥃", dim: false } }), phone: { at: JU, boom: true } },
];

/* ---------------- Shot russe ---------------- */
const SHOTS0 = [{ k: "eau" }, { k: "eau" }, { k: "vodka" }, { k: "eau" }];
const RUSSE = [
  { ms: 2400, cap: "1 shot de vodka, 3 shots d'eau…", p: ps({}), shots: { reveal: true } },
  { ms: 2000, cap: "…ils se ressemblent tous. On mélange !", p: ps({}), shots: { shuffle: true } },
  { ms: 1500, cap: "Chacun prend un shot à tour de rôle (G, le lanceur, en dernier)", p: ps({}, { [JU]: { hl: true } }), shots: { taken: [JU] } },
  { ms: 1300, cap: "Chacun boit en pokerface 😐", p: ps({}, { [JU]: { mark: "😐" }, [CHLOE]: { hl: true } }), shots: { taken: [JU, CHLOE], drunk: [JU] } },
  { ms: 1300, cap: "Chacun boit en pokerface 😐", p: ps({}, { [JU]: { mark: "😐" }, [CHLOE]: { mark: "😐" }, [LEC]: { hl: true } }), shots: { taken: [JU, CHLOE, LEC], drunk: [JU, CHLOE] } },
  { ms: 1500, cap: "Chacun boit en pokerface 😐", p: ps({ mark: "😐" }, { [G_]: { hl: true } }), shots: { taken: [JU, CHLOE, LEC, G_], drunk: [JU, CHLOE, LEC, G_] } },
  { ms: 2600, cap: "Votez : qui avait la vodka ?", p: ps({ mark: "🤔" }), links: [[G_, CHLOE], [JU, CHLOE], [CHLOE, LEC], [LEC, CHLOE]], shots: { taken: [JU, CHLOE, LEC, G_], drunk: [JU, CHLOE, LEC, G_] } },
  { ms: 3000, cap: "Raté ! C'était Le C : bien joué le pokerface 🥃", p: ps({ dim: true }, { [LEC]: { hl: true, mark: "😏", dim: false } }), shots: { taken: [JU, CHLOE, LEC, G_], drunk: [JU, CHLOE, LEC, G_], vodkaAt: LEC } },
];

const DIAGRAMS = { cascade: CASCADE, connexion: CONNEXION, doigt: DOIGT, enchere: ENCHERE, "21": LE21, regard: REGARD, patate: PATATE, russe: RUSSE };

export function hasRuleDiagram(id) { return !!DIAGRAMS[id]; }

/* Avance automatiquement d'étape en étape, en boucle. `go` permet de sauter
   à une étape (swipe / points) : le minuteur repart de cette étape. */
function useLoop(frames, playing) {
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [frames]);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % frames.length), frames[i].ms);
    return () => clearTimeout(t);
  }, [i, frames, playing]);
  const go = (k) => setI(((k % frames.length) + frames.length) % frames.length);
  return [i, go];
}

/* Verre individuel : le niveau descend en douceur pendant la durée de l'étape. */
function Glass({ level, drink, ms }) {
  return (
    <div className={"rd-glass" + (drink ? " drink" : "")}>
      <div className="rd-liquid" style={{ height: `${Math.round(level * 100)}%`, transitionDuration: `${ms}ms` }} />
    </div>
  );
}

/* Flèches de regard / de vote / de connexion entre deux joueurs. */
function Links({ links }) {
  if (!links || !links.length) return null;
  return (
    <svg className="rd-links" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <marker id="rd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
      {links.map(([a, b, both], k) => {
        const A = SEATS[a], B = SEATS[b];
        // raccourcit le trait pour ne pas recouvrir les avatars
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), r = 11 / d;
        return (
          <line key={k} className={both ? "rd-link hot" : "rd-link"}
            x1={A.x + dx * r} y1={A.y + dy * r} x2={B.x - dx * r} y2={B.y - dy * r}
            markerEnd="url(#rd-arrow)" markerStart={both ? "url(#rd-arrow)" : undefined} />
        );
      })}
    </svg>
  );
}

function Center({ c, ms }) {
  if (!c) return null;
  if (c.glassBig) {
    return (
      <div className="rd-center">
        <div className="rd-bigglass"><div className="rd-liquid" style={{ height: "70%" }} /></div>
        {c.count != null && <div className="rd-count">{c.count} 👆</div>}
      </div>
    );
  }
  if (c.timer) {
    return (
      <div className="rd-center">
        <div className="rd-timer" style={{ animationDuration: `${ms}ms` }}><span>{c.timer} s</span></div>
      </div>
    );
  }
  if (c.order) return <div className="rd-center"><div className="rd-order">↻</div><div className="rd-tag">sens du jeu</div></div>;
  if (c.notes) return <div className="rd-center rd-notes"><span>🎵</span><span>🎶</span><span>🎵</span></div>;
  return (
    <div className="rd-center" key={c.big}>
      {c.tag && <div className="rd-tag">{c.tag}</div>}
      {c.big && <div className="rd-big">{c.big}</div>}
    </div>
  );
}

/* Téléphone de la patate chaude : se déplace vers le joueur qui le tient. */
function Phone({ ph }) {
  if (!ph) return null;
  const s = SEATS[ph.at];
  const x = 50 + (s.x - 50) * 0.52, y = 50 + (s.y - 50) * 0.52;
  return (
    <div className={"rd-phone" + (ph.boom ? " boom" : "")} style={{ left: `${x}%`, top: `${y}%` }}>
      {ph.boom ? <span className="rd-boom">💥</span>
        : <div className={"rd-die" + (ph.roll ? " roll" : "")}>{ph.roll ? "?" : ph.die}</div>}
    </div>
  );
}

/* Shots du shot russe : au centre, puis chacun glisse vers son joueur. */
function Shots({ sh }) {
  if (!sh) return null;
  const taken = sh.taken || [], drunk = sh.drunk || [];
  // shot n°k revient au k-ième joueur servi (Ju, Chloé, Le C, G) ; la vodka est chez Le C.
  const order = [JU, CHLOE, LEC, G_];
  return SHOTS0.map((shot, k) => {
    const owner = order[k];
    const isTaken = taken.includes(owner);
    let x = 35 + k * 10, y = 50;
    if (sh.shuffle) { x = 35 + ((k * 3 + 1) % 4) * 10; y = 50 + (k % 2 ? -6 : 6); }
    if (isTaken) { const s = SEATS[owner]; x = 50 + (s.x - 50) * 0.55; y = 50 + (s.y - 50) * 0.55; }
    const label = sh.reveal ? (shot.k === "vodka" ? "🔥" : "💧") : (sh.vodkaAt === owner ? "🔥" : "");
    return (
      <div key={k} className={"rd-shot" + (drunk.includes(owner) ? " empty" : "") + (sh.vodkaAt === owner ? " vodka" : "")} style={{ left: `${x}%`, top: `${y}%` }}>
        <div className="rd-shotglass"><div className="rd-liquid" /></div>
        {label && <span className="rd-shotlbl">{label}</span>}
      </div>
    );
  });
}

function Seat({ seat, st, ms }) {
  const cls = "rd-seat" + (st.dim ? " dim" : "") + (st.hl ? " hl" : "") + (st.lose ? " lose" : "") + (st.down ? " down" : "");
  return (
    <div className={cls} style={{ left: `${seat.x}%`, top: `${seat.y}%` }}>
      <div className="rd-ava" style={{ background: seat.color }}>
        {st.down ? "🙇" : seat.ini}
        {st.mark && <span className="rd-mark" key={st.mark}>{st.mark}</span>}
      </div>
      <div className="rd-name">{seat.name}</div>
      {st.glass != null && <Glass level={st.glass} drink={st.drink} ms={ms} />}
      {st.say && <div className={"rd-bubble " + seat.bub} key={st.say}>{st.say}</div>}
    </div>
  );
}

/* Doigts posés sur le verre central (jeu du doigt). */
function Fingers({ p }) {
  if (!p.some((s) => s.finger)) return null;
  return SEATS.map((seat, i) => {
    const f = p[i].finger;
    if (!f) return null;
    const k = f === "on" ? 0.3 : 0.62;
    return (
      <div key={i} className={"rd-finger " + f}
        style={{ left: `${50 + (seat.x - 50) * k}%`, top: `${50 + (seat.y - 50) * k}%`, transform: `translate(-50%,-50%) rotate(${Math.atan2(50 - seat.y, 50 - seat.x) * 180 / Math.PI + 90}deg)` }}>
        👆
      </div>
    );
  });
}

export function RuleDiagram({ id }) {
  const frames = DIAGRAMS[id];
  if (!frames) return null;
  return <DiagramPlayer frames={frames} />;
}

function DiagramPlayer({ frames }) {
  // en pause hors de l'écran (page des règles : plusieurs schémas à la suite).
  const box = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!box.current || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(box.current);
    return () => io.disconnect();
  }, []);
  const [i, go] = useLoop(frames, visible);
  const f = frames[i];
  // swipe horizontal : gauche = étape suivante, droite = étape précédente.
  const startX = useRef(null);
  const onDown = (e) => { startX.current = e.clientX; };
  const onUp = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 30) go(i + (dx < 0 ? 1 : -1));
  };
  return (
    <div ref={box} className={"rd-box mb" + (visible ? "" : " paused")} aria-hidden="true"
      onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { startX.current = null; }}>
      <div className="rd-stage">
        <div className="rd-table" />
        <Links links={f.links} />
        <Center c={f.center} ms={f.ms} />
        <Fingers p={f.p} />
        <Shots sh={f.shots} />
        <Phone ph={f.phone} />
        {SEATS.map((s, k) => <Seat key={k} seat={s} st={f.p[k]} ms={f.ms} />)}
      </div>
      <div className="rd-cap" key={i}>{f.cap}</div>
      <div className="rd-dots">{frames.map((_, k) => <button key={k} type="button" className={k === i ? "on" : k < i ? "done" : ""} onClick={() => go(k)} />)}</div>
    </div>
  );
}
