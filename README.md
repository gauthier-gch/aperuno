# 🍹 apéruno

> **Le meilleur jeu d'alcool multijoueur.**

apéruno est un jeu de soirée multijoueur qui se joue **depuis le téléphone de
chaque joueur**. Un joueur crée un **salon**, les autres le rejoignent avec un
**code à 4 lettres**, et tout le monde partage la même partie **synchronisée en
temps réel** via Firebase Firestore. Pas d'installation, pas de compte : on
ouvre le lien, on entre son prénom et sa photo, et c'est parti.

🔞 **Réservé aux 18 ans et plus.** Le jeu met en scène la consommation d'alcool.
L'abus d'alcool est dangereux pour la santé — à consommer avec modération. Toutes
les gorgées peuvent être remplacées par une boisson sans alcool.

🌐 En ligne : **[aperuno.fr](https://aperuno.fr)**

---

## 🎲 Le principe

Une variante « soirée » du jeu de cartes classique : on enchaîne les tours, on
pose des cartes qui font **boire**, et des **mini-jeux** viennent pimenter la
partie. Trois ambiances :

- **Chill** — la version conviviale.
- **Harr** — la version qui pique (mini-jeux plus intenses : roulette, patate
  chaude…).
- **Premium** — l'hôte **compose lui-même le paquet** : réglettes pour le
  nombre de Diables / Jokers / +2 / +4 (de 0 à 5× la quantité classique), une
  réglette par mini-jeu (0 à 10) et le nombre de gorgées infligées au perdant
  d'un mini-jeu. Par défaut, chaque réglette est calée sur le mode Harr. Les
  cartes gorgée/shot et Échange restent aux valeurs Harr.

Jusqu'à **15 joueurs** par salon.

## 📜 Les règles

- **Créer une partie** → tu choisis le mode (**chill** / **Harr** / **Premium**),
  ton prénom et ta photo → tu obtiens un **code à 4 lettres** à partager.
- Les autres joueurs font **Rejoindre une partie** avec ce code.
- L'**hôte** (👑) choisit qui commence, puis lance la partie.
- À **chaque tour** : tu **pioches** d'abord une carte (obligatoire), puis tu
  **joues** une carte (obligatoire).
- Comme on pioche *puis* on joue, le seul moyen de **réduire sa main** est de
  poser plusieurs cartes d'un coup :
  - **cartes identiques empilées** (2 × « 2 gorgées » = 4 gorgées),
  - **Action + Diable** (un autre joueur boit),
  - **Échange de main**,
  - ou se débarrasser d'un **Joker / Relance** joué en réaction.
- Une carte posée ne peut **jamais** être reprise.
- Le **perdant d'un mini-jeu boit** (et ne pioche plus).
- Premier à vider sa main → **victoire** 🏆.

On peut **rejoindre une partie en cours** (on reçoit 7 cartes, en fin d'ordre)
et l'hôte peut **passer le tour** d'un joueur absent. Si un joueur recharge la
page, il **revient automatiquement** dans son salon (le code est mémorisé
localement).

### 🚪 Joueur parti sans quitter le jeu

Quand quelqu'un s'absente sans fermer l'appli, plus rien ne doit bloquer la
table :

- **Passer son tour** ou **virer du salon** — touche l'avatar d'un joueur : tu
  peux sauter son tour ou le **retirer définitivement** du salon (ses cartes
  retournent dans la pioche). Il ne compte alors plus dans les gorgées ni les
  mini-jeux.
- **Gorgées prises** — si tu envoies une gorgée (Diable) à quelqu'un d'absent,
  tu peux **valider toi-même** « gorgées prises » sans attendre sa réponse.
- **Débloquer un mini-jeu** — n'importe quel mini-jeu peut être **terminé**
  (avec ou sans perdant) via « ⚠️ Un joueur absent bloque le jeu ? », même si
  c'est le lanceur lui-même qui est parti.
- Les mini-jeux où **chaque joueur vote** (vote, poire, ville, « c'est un 10
  mais… ») se **valident automatiquement** dès que tout le monde a répondu.

> Tout l'aléatoire (dés, lettres, roulette, distances, désignation des perdants)
> est tiré **dans la transaction Firestore**, donc identique sur tous les
> téléphones — aucun écart d'affichage entre joueurs.

## 🕹️ Les mini-jeux

In-app (jouables directement dans l'appli) :

- 🎲 **Dé pseudo-3D** — chacun lance le sien.
- 🗳️ **Vote secret** — on peut voter pour soi.
- 🔤 **Petit bac** — lettre modifiable, chrono synchronisé, catégorie Célébrité,
  réponses en tableau.
- 🎭 **Mime** — le mot est visible par tous sauf le mimeur.
- 🍐 **Coupe la poire** — direction cible à reproduire au doigt.
- 🗺️ **Place la ville** — carte de France + 50 villes, zoom + classement.
- 🕵️ **Undercover** — avec un Mister White qui peut deviner le mot.
- 🔟 **C'est un 10 mais…** — le lanceur boit la moyenne des écarts.
- 🔗 **Connexion** — un mot commun au décompte : les « connectés » boivent.
- 🎡 **Roulette Harr**, 🥔 **Patate chaude** (build-up sonore + drop, un seul
  téléphone qu'on se passe), ⏱️ **chronos**, 👀 **le regard**, ⚔️ **duels**.

## 🗂️ Structure du repo

```
index.html                     → entrée Vite (icône, manifest PWA, balises d'aperçu)
firestore.rules                → règles de sécurité Firestore (à publier côté console)
vite.config.js                 → build Vite (base "/", noms de fichiers stables)
public/
  logo_aperuno.png             → icône d'app / écran d'accueil / aperçu au partage
  apple-touch-icon.png
  manifest.webmanifest         → manifeste PWA
  CNAME                         → domaine perso GitHub Pages (aperuno.fr)
src/
  main.jsx                     → montage React
  App.jsx                      → routing des écrans + toasts + garde anti-double-tap
  firebase.js                  → config Firebase + auth anonyme + identifiant appareil
  me.js                        → identifiant stable de l'appareil (MYID)
  util.js                      → compression des photos de profil
  ErrorBoundary.jsx            → écran de secours en cas d'erreur React
  styles.css                   → thème festif (Marcellus + Montserrat)
  net/
    useRoom.js                 → abonnement temps réel + présence + actions (transactions)
  game/
    constants.js               → cartes, métadonnées mini-jeux, mots de mime, textes légaux
    deck.js                    → construction/mélange du paquet + génération du code de salon
    engine.js                  → reducer pur applyMove (toutes les règles + aléatoire)
    cities.js                  → 50 villes + projection + tracé de la France
  components/                  → Home, Rules, Forms, Lobby, GameTable, Win, common
  minigames/                   → Dice, Vote, PetitBac, Timer, Regard, Mime, Pear, City,
                                 Roulette, Patate, Imposteur, Duel, Dix, Connexion, Pear…
                                 + dispatcher (index.jsx)
.github/workflows/deploy.yml   → build Vite + déploiement GitHub Pages
```

## 🛠️ Développement

Pré-requis : **Node.js 18+**.

```bash
npm install      # installer les dépendances
npm run dev      # lancer en local (http://localhost:5173)
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

Pour tester **à plusieurs sur de vrais téléphones** sur ton Wi-Fi local :

```bash
npm run dev -- --host
```

puis ouvre l'URL « Network » (`http://192.168.x.x:5173`) sur chaque téléphone.

### Configuration Firebase

La config Firebase (`src/firebase.js`) contient des **clés publiques** côté
navigateur : c'est normal et sans danger, la sécurité vient des **règles
Firestore**. Pour repartir d'un projet Firebase neuf :

1. [Console Firebase](https://console.firebase.google.com) → **Ajouter un projet**.
2. **Build → Firestore Database → Créer une base** (mode production, région
   `europe-west`).
3. **Build → Authentication → Sign-in method** → active **Anonyme**.
4. **Paramètres du projet → Tes applications → Web `</>`** → copie l'objet
   `firebaseConfig` dans `src/firebase.js`.
5. **Firestore Database → Règles** → colle le contenu de `firestore.rules`.
6. **Firestore Database → TTL** → crée une règle sur le champ **`expireAt`**
   (supprime automatiquement les salons inactifs depuis ~12 h).

### 📊 Suivi des salons (Google Sheet, optionnel)

L'appli peut ajouter **une ligne dans un Google Sheet à chaque partie lancée**
(date/heure, mode, nombre de joueurs, pseudos). **RGPD : seuls les pseudos sont
envoyés — jamais les photos.** L'écriture se fait côté **hôte uniquement**, une
seule fois par salon. Désactivé par défaut (aucun envoi tant que l'URL n'est pas
renseignée).

Mise en place (aucun serveur à héberger, tout passe par Google Apps Script) :

1. Crée un Google Sheet (par ex. un onglet `Salons`) avec les en-têtes :
   `Date` · `Code` · `Mode` · `Nb joueurs` · `Joueurs`.
2. Dans le Sheet : **Extensions → Apps Script**, colle ce code :

   ```js
   function doPost(e) {
     var ss = SpreadsheetApp.getActiveSpreadsheet();
     var sheet = ss.getSheetByName('Salons') || ss.getSheets()[0];
     var d = JSON.parse(e.postData.contents);
     sheet.appendRow([
       new Date(d.at),                 // Date + heure
       d.code,                          // Code du salon
       d.mode,                          // chill / harr / premium
       d.playerCount,                   // Nombre de joueurs
       (d.players || []).join(', ')     // Pseudos (pas de photo — RGPD)
     ]);
     return ContentService.createTextOutput('ok');
   }
   ```

3. **Déployer → Nouveau déploiement → Application Web** :
   « Exécuter en tant que : moi », « Accès : tout le monde ». Copie l'URL
   `…/exec`.
4. Colle cette URL dans `SHEET_WEBHOOK_URL` (fichier `src/analytics.js`), puis
   redéploie l'appli.

> L'envoi est « fire-and-forget » (`fetch` en `no-cors`) : il n'affiche jamais
> d'erreur au joueur et ne peut pas bloquer la partie. L'URL du web app est
> publique (visible dans le bundle) — n'y mets aucune donnée sensible ; au pire
> quelqu'un pourrait y insérer des lignes, sans lire le Sheet.

## 🚀 Déploiement

Le site est déployé sur **GitHub Pages** avec un domaine perso (`aperuno.fr`,
fichier `public/CNAME`). Le workflow `.github/workflows/deploy.yml` build et
publie automatiquement `dist/` **à chaque push sur `main`**.

`vite.config.js` utilise `base: "/"` (site servi à la racine du domaine).

## 🔒 Sécurité & mentions légales

- Les écritures Firestore sont réservées aux **membres authentifiés** d'un salon
  (auth anonyme Firebase), la structure des documents est validée (mode, statut,
  ≤ 15 joueurs) et les salons **expirent automatiquement** (TTL 12 h).
- Une **porte d'âge** (déclaration de majorité sur l'honneur), des **CGU**, une
  **politique de confidentialité** (RGPD) et un rappel de **consommation
  responsable** sont intégrés à l'application.

> ⚠️ **Avant une mise en production commerciale**, voir les recommandations de
> durcissement (logique de jeu autoritaire côté Cloud Functions, App Check,
> restriction de la clé API par domaine, protection de la branche `main`).
