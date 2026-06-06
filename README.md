# 🍹 apéruno — version multijoueur

Jeu de soirée façon UNO × Mario Party. Chaque joueur se connecte depuis son
téléphone à un **salon** partagé ; tout est synchronisé en temps réel via
**Firebase Firestore**.

---

## 1. Pré-requis

- **Node.js 18 ou plus** (https://nodejs.org)
- Un compte **Google** (pour Firebase, gratuit)
- Un compte **GitHub** (pour héberger, gratuit)

## 2. Installer le projet

```bash
npm install
```

## 3. Configurer Firebase (≈ 5 min, gratuit)

1. Va sur https://console.firebase.google.com → **Ajouter un projet** (nom : `aperuno`).
2. Dans le menu de gauche : **Build → Firestore Database → Créer une base** →
   choisis **Mode production** → une région proche (ex. `europe-west`).
3. **Build → Authentication → Commencer → Sign-in method →** active
   **Anonyme** (Anonymous) et enregistre.
4. **Paramètres du projet** (roue crantée en haut) → section **Tes applications**
   → clique l'icône **Web `</>`** → donne un surnom → **Enregistrer l'application**.
   Firebase t'affiche un objet `firebaseConfig` : copie-le.
5. Colle ces valeurs dans **`src/firebase.js`** (remplace les `REMPLACE_MOI`).
6. **Règles Firestore** : onglet **Firestore Database → Règles**, colle le
   contenu de **`firestore.rules`** (fourni à la racine), puis **Publier**.

> Les clés `firebaseConfig` sont publiques côté navigateur, c'est normal et sans
> danger : la sécurité vient des règles Firestore (lecture/écriture réservées
> aux utilisateurs authentifiés, même anonymes).

## 4. Lancer en local

```bash
npm run dev
```

Ouvre l'URL affichée. Pour **tester à plusieurs sur de vrais téléphones** sur ton
Wi-Fi local :

```bash
npm run dev -- --host
```

puis ouvre l'URL « Network » (`http://192.168.x.x:5173`) sur chaque téléphone.

## 5. Déployer (au choix)

### Option A — Vercel (le plus simple, 2 min)
1. Pousse le projet sur un dépôt GitHub.
2. Va sur https://vercel.com → **Add New → Project** → importe le dépôt.
3. Framework détecté : **Vite**. Laisse les réglages par défaut → **Deploy**.
4. Tu obtiens une URL `https://aperuno-xxx.vercel.app` à partager. 🎉

### Option B — GitHub Pages (100 % GitHub)
1. Pousse le projet sur GitHub (branche `main`).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Le workflow fourni (`.github/workflows/deploy.yml`) build et publie automatiquement
   à chaque push. L'URL sera `https://<ton-pseudo>.github.io/<nom-du-repo>/`.

> `vite.config.js` utilise `base: "./"`, donc ça marche aussi bien sur Vercel
> (à la racine) que sur GitHub Pages (dans un sous-dossier).

---

## Comment on joue

- **Créer une partie** → tu choisis le mode (**chill** / **Harr**), ton prénom,
  ta photo → tu obtiens un **code à 4 lettres**.
- Les autres font **Rejoindre une partie** avec ce code.
- L'**hôte** (👑) choisit qui commence, puis lance.
- À **chaque tour** : tu **pioches** d'abord une carte (obligatoire), puis tu
  **joues** une carte (obligatoire).
- Comme on pioche puis on joue, le seul moyen de **réduire sa main** est de poser
  plusieurs cartes d'un coup : **cartes identiques empilées** (2 × « 2 gorgées »
  = 4 gorgées), **Action + Diable**, **Échange de main**, ou de se débarrasser
  d'un **Joker / Relance** en réaction.
- Une carte posée ne peut **jamais** être reprise.

## Ce qui est synchronisé

- Tour par tour, pioche obligatoire, distribution, défausse/remélange, victoire.
- Action (tu bois, empilable), Action + Diable (un autre boit), **Joker** et
  **Relance +2/+4** en réaction, **Échange de main**.
- Le **perdant des mini-jeux boit** (il ne pioche plus).
- Mini-jeux in-app : **dé pseudo-3D** (chacun lance le sien), **vote secret**
  (on peut voter pour soi), **petit bac** (lettre modifiable, chrono synchronisé,
  catégorie Célébrité, réponses visibles même non validées), **mime**,
  **coupe la poire**, **place la ville** (carte de France + 50 villes),
  **roulette Harr** (mode Harr), chronos 10 min, le regard.
- Tout l'aléatoire (dés, lettres, roulette, distances, perdants) est calculé
  côté serveur dans la transaction Firestore → aucun écart entre téléphones.

## Notes & limites

- Les photos sont compressées (≈ 140 px) pour rester légères. À 10 joueurs, on
  reste très en dessous de la limite d'1 Mo par document Firestore.
- Offre Firebase **gratuite (Spark)** : largement suffisante pour des soirées.
- Reconnexion : si un joueur recharge la page, il revient automatiquement dans
  son salon (le code est mémorisé localement).

## Structure

```
index.html            → entrée Vite minimale (icône, manifest PWA)
public/
  logo_aperuno.png    → icône d'app / écran d'accueil
  apple-touch-icon.png
  manifest.webmanifest
src/
  main.jsx            → montage React
  App.jsx             → routing des écrans + toasts + garde anti-double-tap
  firebase.js         → config Firebase + auth anonyme + identifiant appareil
  me.js               → identifiant stable de l'appareil (MYID)
  util.js             → compression photo de profil
  net/useRoom.js      → abonnement temps réel + présence + actions (transactions)
  game/
    constants.js      → cartes, mini-jeux, métadonnées, roulette, mots de mime
    deck.js           → construction/mélange du paquet + code de salon
    engine.js         → reducer pur applyMove (toutes les règles + aléatoire)
    cities.js         → 50 villes + projection + tracé France (« place la ville »)
  components/         → Home, Rules, MiniList, Forms, Lobby, GameTable, Win, common
  minigames/          → Dice, Vote, PetitBac, Timer, Regard, Mime, Pear, City,
                        Roulette + dispatcher (index.jsx)
  styles.css          → thème festif (Marcellus + Montserrat)
firestore.rules       → règles de sécurité à coller dans la console
.github/workflows/deploy.yml → build Vite + déploiement GitHub Pages
```

> Déploiement **GitHub Pages** automatique : à chaque push sur `main`, le
> workflow build le projet (`npm run build`) et publie `dist/`. Active
> **Settings → Pages → Source = GitHub Actions** une fois.
