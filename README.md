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

- **Créer une partie** → tu choisis le mode (chill/hard), ton prénom, ta photo →
  tu obtiens un **code à 4 lettres**.
- Les autres font **Rejoindre une partie** avec ce code.
- L'**hôte** (👑) choisit qui commence, puis lance.
- Chacun voit sa main, les dos de cartes des autres, la pioche et la défausse.
- **Appuie sur une carte** pour voir ses règles et la jouer.

## Ce qui est synchronisé

- Tour par tour, distribution, pioche/défausse/remélange, condition de victoire.
- Action (tu bois), Action + Diable (un autre boit, avec choix de la cible),
  **Joker en réaction** (la cible peut refuser), passer.
- Mini-jeux **entièrement in-app** : défi de dé (dés animés), vote secret,
  **petit bac** (chacun saisit ses mots, chrono, révélation), chronos 10 min
  (ni oui ni non / mot interdit), le regard (décompte, on boit sans piocher).
- Les autres défis (le 21, l'enchère, valise, catégorie, cascade, shot russe,
  duels) : la règle s'affiche et le lanceur **désigne le perdant** qui pioche.

## Notes & limites

- Les photos sont compressées (≈ 140 px) pour rester légères. À 10 joueurs, on
  reste très en dessous de la limite d'1 Mo par document Firestore.
- Offre Firebase **gratuite (Spark)** : largement suffisante pour des soirées.
- Reconnexion : si un joueur recharge la page, il revient automatiquement dans
  son salon (le code est mémorisé localement).

## Structure

```
src/
  game.js      → moteur de jeu pur (paquet, mini-jeux, reducer applyMove)
  firebase.js  → config Firebase + auth anonyme + identifiant appareil
  useRoom.js   → abonnement temps réel + actions (créer/rejoindre/jouer)
  App.jsx      → toute l'interface (accueil, lobby, table, mini-jeux)
  styles.css   → thème festif (Marcellus + Montserrat)
firestore.rules → règles de sécurité à coller dans la console
```
