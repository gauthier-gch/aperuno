/* =========================================================================
   Pages SEO statiques, générées au BUILD (npm run build) à partir des données
   du jeu (src/game/constants.js) :
     /regles/                 règles complètes + modes
     /mini-jeux/              liste des mini-jeux
     /mini-jeux/<slug>/       une page par mini-jeu
     /sitemap.xml             toutes les URL ci-dessus + l'accueil

   Ce sont de simples pages HTML (sans React ni Firebase) : rapides et lisibles
   par Google / Bing / les IA. Elles renvoient vers l'accueil pour jouer. Elles
   ne touchent ni à l'appli ni au déroulé d'une partie.
   ========================================================================= */

import { GAMES, MODE_INFO } from "../src/game/constants.js";
import { INTROS } from "./intros.js";

const SITE = "https://aperuno.fr";
const OG_IMAGE = `${SITE}/og-image.jpg`;

// Mêmes catégories que l'onglet Règles de l'appli (src/components/Home.jsx).
const HORS_APP_KINDS = ["offapp", "facilitator", "regard", "inapp_connexion"];

/* « Défi de dé » → « defi-de-de », « C'est un 10 mais » → « c-est-un-10-mais ». */
export function slugify(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Même mini-balisage que RichText (src/components/common.jsx) :
   **gras**, __souligné__, *italique*, lignes « - » = liste, ligne vide = paragraphe. */
function inline(s) {
  return s.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g).map((t) => {
    if (t.startsWith("**") && t.endsWith("**") && t.length > 4) return `<strong>${esc(t.slice(2, -2))}</strong>`;
    if (t.startsWith("__") && t.endsWith("__") && t.length > 4) return `<u>${esc(t.slice(2, -2))}</u>`;
    if (t.startsWith("*") && t.endsWith("*") && t.length > 2) return `<em>${esc(t.slice(1, -1))}</em>`;
    return esc(t);
  }).join("");
}
function richText(text) {
  const blocks = [];
  String(text || "").split("\n").forEach((line) => {
    const last = blocks[blocks.length - 1];
    if (/^\s*[-•]\s+/.test(line)) {
      const item = line.replace(/^\s*[-•]\s+/, "");
      if (last && last.type === "ul") last.items.push(item);
      else blocks.push({ type: "ul", items: [item] });
    } else if (!line.trim()) {
      blocks.push({ type: "gap" });
    } else if (last && last.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  });
  return blocks.map((b) => {
    if (b.type === "ul") return `<ul>${b.items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`;
    if (b.type === "p") return `<p>${b.lines.map(inline).join("<br>")}</p>`;
    return "";
  }).join("\n");
}
/* Texte brut (meta description). */
const plain = (s) => String(s).replace(/\*\*|__|\*/g, "").replace(/\s*\n\s*-?\s*/g, " ").replace(/\s+/g, " ").trim();
const clip = (s, n = 155) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…");

const games = [...GAMES]
  .sort((a, b) => a.name.localeCompare(b.name, "fr"))
  .map((g) => ({ ...g, slug: slugify(g.name), horsApp: HORS_APP_KINDS.includes(g.kind) }));

const CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#f3ecff;line-height:1.6;
  background:radial-gradient(900px 500px at 15% -5%,rgba(177,91,255,.35),transparent 60%),
  radial-gradient(800px 500px at 95% 8%,rgba(255,59,92,.28),transparent 55%),#0a0718;background-attachment:fixed;min-height:100vh}
main,header,footer{max-width:720px;margin:0 auto;padding:0 18px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:18px;padding-bottom:6px}
.brand{display:flex;align-items:center;gap:10px;color:#f4c95d;text-decoration:none;font-weight:700;font-size:20px}
.brand img{border-radius:12px}
nav a{color:#c9b8ff;text-decoration:none;margin-left:14px;font-size:15px}
nav a:hover{color:#fff}
.crumbs{font-size:13px;opacity:.7;margin:14px 0 4px}
.crumbs a{color:#c9b8ff}
h1{font-size:30px;line-height:1.2;margin:8px 0 12px}
h2{font-size:21px;margin:30px 0 10px}
a{color:#f4c95d}
.lead{font-size:17px;opacity:.95}
.panel{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px 18px;margin:14px 0}
.panel p{margin:0}.panel p+p,.panel ul+p,.panel p+ul{margin-top:8px}
.panel ul{margin:0;padding-left:20px}
u{text-decoration-color:#ff6f86;text-underline-offset:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}
.chip{font-size:13px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.1)}
.chip.harr{background:rgba(255,59,92,.25)}
.cta{display:inline-block;margin:18px 0 6px;padding:14px 22px;border-radius:14px;font-weight:700;color:#fff;text-decoration:none;
  background:linear-gradient(135deg,#ff3b5c,#b15bff);box-shadow:0 10px 26px rgba(177,91,255,.35)}
.grid{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.grid a{display:block;height:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#f3ecff;text-decoration:none}
.grid a:hover{border-color:#f4c95d}
.grid b{display:block;color:#f4c95d}
.grid span{font-size:13px;opacity:.75}
footer{font-size:13px;opacity:.7;padding-top:28px;padding-bottom:40px}
footer a{color:#c9b8ff}
`;

function layout({ path, title, description, crumbs, body, jsonLd = [] }) {
  const url = `${SITE}${path}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "apéruno", path: "/" }, ...crumbs].map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE}${c.path}`,
    })),
  };
  const ld = [breadcrumb, ...jsonLd]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
  const crumbHtml = [{ name: "Accueil", path: "/" }, ...crumbs]
    .map((c, i, all) => (i === all.length - 1 ? esc(c.name) : `<a href="${c.path}">${esc(c.name)}</a>`)).join(" › ");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0718">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="/logo_aperuno.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="apéruno">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
${ld}
<style>${CSS.trim()}</style>
</head>
<body>
<header>
  <a class="brand" href="/"><img src="/logo_aperuno.png" alt="" width="36" height="36">apéruno</a>
  <nav><a href="/regles/">Règles</a><a href="/mini-jeux/">Mini-jeux</a></nav>
</header>
<main>
<p class="crumbs">${crumbHtml}</p>
${body}
</main>
<footer>
  <p>🔞 apéruno est réservé aux 18 ans et plus. L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Toutes les gorgées peuvent être remplacées par une boisson sans alcool.</p>
  <p><a href="/">Jouer à apéruno</a> · <a href="/regles/">Règles du jeu</a> · <a href="/mini-jeux/">Tous les mini-jeux</a></p>
</footer>
</body>
</html>
`;
}

const playCta = (label = "🎴 Jouer gratuitement sur apéruno") => `<a class="cta" href="/">${label}</a>`;

function gameGrid(list) {
  return `<ul class="grid">${list.map((g) => `<li><a href="/mini-jeux/${g.slug}/"><b>${esc(g.name)}</b><span>${g.harrOnly ? "🔥 Mode Harr" : "Chill & Harr"} · ${g.horsApp ? "à l'oral / physique" : "piloté par l'appli"}</span></a></li>`).join("")}</ul>`;
}

function rulesPage() {
  const modes = ["chill", "harr", "premium"].map((k) => MODE_INFO[k]);
  return layout({
    path: "/regles/",
    title: "Règles d'apéruno — le jeu à boire multijoueur en ligne",
    description: "Les règles complètes d'apéruno, le jeu de cartes à boire multijoueur en ligne : déroulé d'un tour, cartes spéciales, modes Chill, Harr et Premium et mini-jeux.",
    crumbs: [{ name: "Règles", path: "/regles/" }],
    body: `
<h1>Règles d'apéruno, le jeu à boire en ligne</h1>
<p class="lead">apéruno est un jeu de cartes à boire qui se joue <strong>depuis le téléphone de chaque joueur</strong>, de 3 à 15 joueurs. Un joueur crée un salon et partage le code, les autres le rejoignent, et la partie est synchronisée en temps réel. Pas d'installation, pas de compte.</p>
${playCta()}

<h2>🎯 Objectif</h2>
<div class="panel"><p>Se débarrasser de toutes ses cartes. Le premier à vider sa main gagne et distribue un cul sec 🥃.</p></div>

<h2>🔁 Déroulé d'un tour</h2>
<div class="panel">
<p>1️⃣ Tu <strong>pioches</strong> obligatoirement une carte.<br>2️⃣ Puis tu <strong>joues</strong> une carte, ou tu <strong>passes</strong>.</p>
<p>Comme tu pioches puis joues, le seul moyen de réduire ta main est de poser <strong>plusieurs cartes d'un coup</strong> :</p>
<ul>
<li><strong>Cartes identiques</strong> : empile-les (2 × « 2 gorgées » = 4 gorgées).</li>
<li><strong>Action + Diable</strong> : un autre joueur boit (tu poses 2 cartes).</li>
<li><strong>Échange de main</strong> : tu échanges toute ta main avec un adversaire.</li>
<li><strong>Échange de carte</strong> : tu défausses une carte et en pioches une nouvelle.</li>
<li><strong>Joker</strong> / <strong>Relance</strong> : se jouent en réaction (et quittent ta main).</li>
</ul>
<p>Une carte posée ne peut jamais être reprise.</p>
</div>

<h2>🎲 Les cartes Jeu</h2>
<div class="panel"><p>Les cartes Jeu lancent un <a href="/mini-jeux/">mini-jeu</a>. En général, le <strong>perdant du mini-jeu boit</strong>.</p></div>

<h2>🎮 Les 3 modes de jeu</h2>
${modes.map((m) => `<div class="panel"><p><strong>${m.emoji} ${esc(m.name)}</strong> — ${esc(m.blurb)}</p></div>`).join("\n")}
<div class="panel"><p>En <strong>Premium</strong>, l'hôte règle le nombre de Diables, Jokers, +2 et +4 (jusqu'à 5× la quantité habituelle), le nombre de chaque mini-jeu (0 à 10) et les gorgées infligées au perdant d'un mini-jeu.</p></div>

<h2>🕹️ Les ${games.length} mini-jeux</h2>
${gameGrid(games)}
${playCta()}
`,
    jsonLd: [{
      "@context": "https://schema.org", "@type": "Article", inLanguage: "fr-FR",
      headline: "Règles d'apéruno, le jeu à boire en ligne", image: OG_IMAGE,
      author: { "@type": "Person", name: "Gauthier Gâche" }, mainEntityOfPage: `${SITE}/regles/`,
    }],
  });
}

function gamesIndexPage() {
  return layout({
    path: "/mini-jeux/",
    title: `Les ${games.length} mini-jeux à boire d'apéruno — règles`,
    description: `Les règles des ${games.length} mini-jeux d'apéro d'apéruno : Undercover, petit bac, jeu du doigt, le 21, ni oui ni non, cascade, shot russe et bien d'autres.`,
    crumbs: [{ name: "Mini-jeux", path: "/mini-jeux/" }],
    body: `
<h1>Les ${games.length} mini-jeux à boire d'apéruno</h1>
<p class="lead">Dans apéruno, certaines cartes déclenchent un mini-jeu : jeux d'oral, d'adresse, de bluff ou de rapidité. Une partie est pilotée par l'appli (dés, chrono, votes, cartes), d'autres se jouent à voix haute autour de la table. Le perdant boit !</p>
${gameGrid(games)}
${playCta()}
`,
    jsonLd: [{
      "@context": "https://schema.org", "@type": "ItemList", name: "Mini-jeux d'apéruno",
      itemListElement: games.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/mini-jeux/${g.slug}/`, name: g.name })),
    }],
  });
}

function gamePage(g, i) {
  const intro = INTROS[g.id] ||
    `${g.name} est l'un des mini-jeux à boire d'apéruno, déclenché quand un joueur pose une carte Jeu.`;
  const others = games.filter((o) => o.id !== g.id);
  // Quelques suggestions voisines (rotation), pour le maillage interne.
  const related = Array.from({ length: 6 }, (_, k) => others[(i + k * 4) % others.length]);
  const path = `/mini-jeux/${g.slug}/`;
  const title = `${g.name} : règles du jeu à boire | apéruno`;
  return layout({
    path,
    title,
    description: clip(`${g.name}, règles du mini-jeu à boire : ${plain(g.rule)}`),
    crumbs: [{ name: "Mini-jeux", path: "/mini-jeux/" }, { name: g.name, path }],
    body: `
<h1>${esc(g.name)} — règles du jeu à boire</h1>
<div class="chips">
  <span class="chip${g.harrOnly ? " harr" : ""}">${g.harrOnly ? "🔥 Mode Harr uniquement" : "😎 Chill & 🔥 Harr"}</span>
  <span class="chip">${g.horsApp ? "🗣️ Se joue à l'oral / physiquement" : "📱 Piloté par l'appli"}</span>
  ${g.duel ? `<span class="chip">⚔️ Duel</span>` : ""}
</div>
<p class="lead">${esc(intro)}</p>

<h2>📜 Règles</h2>
<div class="panel">
${richText(g.rule)}
</div>

<h2>Comment y jouer dans apéruno ?</h2>
<p>${esc(g.name)} est l'un des ${games.length} mini-jeux d'apéruno, le jeu de cartes à boire multijoueur en ligne. Il se déclenche quand un joueur pose une <strong>carte Jeu</strong>${g.harrOnly ? ", uniquement en mode <strong>Harr</strong> (ou en <strong>Premium</strong> si l'hôte l'ajoute au paquet)" : ""}. ${g.horsApp ? "L'appli annonce le mini-jeu et ses règles à tout le monde, puis il se joue autour de la table ; le lanceur indique ensuite le perdant." : "L'appli gère tout sur les téléphones des joueurs, et le résultat s'affiche chez tout le monde en même temps."} Gratuit, sans installation, de 3 à 15 joueurs.</p>
${playCta()}

<h2>D'autres mini-jeux à boire</h2>
${gameGrid(related)}
<p><a href="/mini-jeux/">Voir les ${games.length} mini-jeux</a> · <a href="/regles/">Règles complètes d'apéruno</a></p>
`,
    jsonLd: [{
      "@context": "https://schema.org", "@type": "Article", inLanguage: "fr-FR",
      headline: `${g.name} — règles du jeu à boire`, image: OG_IMAGE,
      author: { "@type": "Person", name: "Gauthier Gâche" }, mainEntityOfPage: `${SITE}${path}`,
    }],
  });
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: "/", priority: "1.0" },
    { loc: "/regles/", priority: "0.8" },
    { loc: "/mini-jeux/", priority: "0.8" },
    ...games.map((g) => ({ loc: `/mini-jeux/${g.slug}/`, priority: "0.6" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
}

/* Plugin Vite : émet les pages dans dist/ au build uniquement. */
export function seoPages() {
  return {
    name: "aperuno-seo-pages",
    apply: "build",
    generateBundle() {
      const slugs = new Set(games.map((g) => g.slug));
      if (slugs.size !== games.length) this.error("Deux mini-jeux ont le même slug d'URL.");
      const emit = (fileName, source) => this.emitFile({ type: "asset", fileName, source });
      emit("regles/index.html", rulesPage());
      emit("mini-jeux/index.html", gamesIndexPage());
      games.forEach((g, i) => emit(`mini-jeux/${g.slug}/index.html`, gamePage(g, i)));
      emit("sitemap.xml", sitemap());
    },
  };
}
