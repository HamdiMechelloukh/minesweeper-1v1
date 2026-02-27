# Minesweeper 1v1 en Temps Réel

Jeu web multijoueur de Démineur (Minesweeper) en temps réel, opposant deux joueurs sur des grilles identiques.

## Fonctionnalités

*   **1 contre 1 en Temps Réel**: Affrontez un adversaire sur la même grille (seed identique).
*   **Synchronisation**: Mises à jour en temps réel des actions de l'adversaire via WebSockets.
*   **Grilles Côte à Côte**: Vue simultanée de votre grille (interactive) et de celle de l'adversaire (lecture seule).
*   **PWA**: Installable, fonctionne hors ligne (shell uniquement).
*   **Design**: Thème sombre, responsive (Desktop/Tablette).

## Technologies Utilisées

### Frontend
*   React 18
*   TypeScript
*   Vite
*   CSS Modules (fichiers .css séparés)
*   WebSockets (natif)

### Backend
*   Node.js
*   Express
*   ws (WebSocket)
*   TypeScript

## Structure du Projet

Le projet est un monorepo contenant :

*   `client/` : Application Frontend React/Vite.
*   `server/` : Application Backend Node/Express/WS.

## Pré-requis

*   Node.js (v16+)
*   npm

## Installation

1.  Cloner le dépôt.
2.  Installer les dépendances à la racine (si workspaces configurés) ou dans chaque dossier.

```bash
# Racine (si supporté)
npm install

# Ou manuellement
cd server && npm install
cd ../client && npm install
```

## Exécution

Vous devez lancer le serveur ET le client.

### Backend

```bash
cd server
npm run dev
# Le serveur démarre sur http://localhost:3001
```

### Frontend

```bash
cd client
npm run dev
# Le client démarre sur http://localhost:3000 (ou autre port libre)
```

## Utilisation

1.  Ouvrez le client dans votre navigateur.
2.  **Créer une salle** : Cliquez sur "Créer une salle". Un code à 4 lettres est généré.
3.  **Rejoindre une salle** : Ouvrez un autre onglet/navigateur. Entrez le code de la salle et cliquez sur "Rejoindre".
4.  **Démarrer** : Une fois les deux joueurs dans le lobby, l'hôte peut cliquer sur "Démarrer la partie".
5.  **Jouer** :
    *   **Clic Gauche** : Révéler une case.
    *   **Clic Droit** : Poser/Retirer un drapeau.
    *   Objectif : Révéler plus de cases sûres que l'adversaire sans toucher de mine.
    *   Si vous touchez une mine, vous perdez instantanément (game over pour vous). L'autre joueur peut continuer.
    *   La partie se termine quand les deux joueurs ont fini (victoire ou mine).

## PWA

L'application est une PWA. Vous pouvez l'installer via l'icône dans la barre d'adresse (Chrome/Edge) ou "Ajouter à l'écran d'accueil" (Mobile).
Le Service Worker met en cache les assets statiques pour un chargement rapide.

## Licence

ISC
