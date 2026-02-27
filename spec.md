# Spécification Technique - Minesweeper 1v1 en Temps Réel

## 1. Vue d'ensemble du Projet et Objectifs

Ce document décrit la spécification technique pour un jeu web multijoueur de Démineur (Minesweeper) en temps réel, opposant deux joueurs. L'objectif est de fournir une expérience utilisateur fluide et réactive, où les deux joueurs s'affrontent simultanément sur des grilles identiques, avec des mises à jour en temps réel de l'état de l'adversaire.

**Objectifs Principaux:**
*   **Jeu en Temps Réel:** Interaction simultanée et synchronisation des états de jeu via WebSockets.
*   **Monorepo Efficace:** Séparation claire entre les couches frontend (React) et backend (Node.js).
*   **Expérience Utilisateur Rich:** Interface intuitive, réactive et optimisée pour les tablettes et les ordinateurs de bureau.
*   **Progressive Web App (PWA):** Fournir des fonctionnalités offline de base et une installation rapide.
*   **Scalabilité Initiale:** Architecture permettant une expansion future si nécessaire.

## 2. Structure des Modules/Fichiers

Le projet sera organisé en un monorepo avec deux dossiers principaux : `client/` pour le frontend et `server/` pour le backend.

```
.
├── README.md                 // README principal du monorepo
├── package.json              // Scripts globaux et dépendances du monorepo
├── client/                   // Application frontend
│   ├── public/               // Fichiers statiques (icônes, manifest.json)
│   │   ├── manifest.json
│   │   ├── service-worker.ts // Worker pour la PWA
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/           // Images, sons, etc.
│   │   ├── components/       // Composants React réutilisables
│   │   │   ├── Board.tsx
│   │   │   ├── Cell.tsx
│   │   │   ├── GameGrid.tsx  // Wrapper pour la grille d'un joueur
│   │   │   ├── Timer.tsx
│   │   │   └── PlayerInfo.tsx
│   │   ├── hooks/            // Hooks React personnalisés
│   │   │   └── useGameWebSocket.ts
│   │   ├── pages/            // Composants de page
│   │   │   ├── HomePage.tsx
│   │   │   ├── LobbyPage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── services/         // Services API et WebSocket
│   │   │   ├── websocket.ts
│   │   │   └── gameLogic.ts  // Logique côté client pour l'affichage (calcul des scores, etc.)
│   │   ├── styles/           // Styles globaux, variables CSS, thème
│   │   │   ├── index.css
│   │   │   └── variables.css
│   │   ├── types/            // Définitions de types TypeScript
│   │   │   ├── game.d.ts
│   │   │   └── websocket.d.ts
│   │   ├── App.tsx           // Composant racine de l'application
│   │   └── main.tsx          // Point d'entrée React
│   ├── index.html            // Fichier HTML principal
│   ├── package.json          // Dépendances et scripts frontend
│   ├── tsconfig.json         // Configuration TypeScript frontend
│   └── vite.config.ts        // Configuration Vite
└── server/                   // Application backend
    ├── src/
    │   ├── game/             // Logique de jeu spécifique au démineur
    │   │   ├── minesweeper.ts // Génération de grille, révélation, drapeaux, vérification de victoire/défaite
    │   │   └── utils.ts       // Fonctions utilitaires pour le jeu
    │   ├── managers/         // Gestionnaires de connexion et de salles
    │   │   ├── roomManager.ts
    │   │   └── gameManager.ts // Gère les instances de jeu actives
    │   ├── types/            // Définitions de types TypeScript
    │   │   ├── game.d.ts
    │   │   └── websocket.d.ts
    │   └── server.ts         // Point d'entrée du serveur, configuration Express et WebSocket
    ├── package.json          // Dépendances et scripts backend
    ├── tsconfig.json         // Configuration TypeScript backend
    └── tsconfig.build.json   // Configuration TypeScript pour la compilation
```

### Descriptions des fichiers clés:

*   **`README.md` (racine):** Instructions générales, setup du monorepo, comment exécuter les deux parties.
*   **`client/public/manifest.json`:** Manifest PWA pour "Minesweeper 1v1", icônes, thème sombre.
*   **`client/public/service-worker.ts`:** Cache le shell de l'application pour une expérience offline de base.
*   **`client/src/services/websocket.ts`:** Gère la connexion WebSocket, envoi et réception de messages.
*   **`server/src/server.ts`:** Initialisation du serveur Express et du serveur WebSocket (`ws`). Routage de base (si nécessaire) et gestion des connexions.
*   **`server/src/managers/roomManager.ts`:** Gère la création, la jonction, et la suppression des salles. Génération de codes de salle uniques.
*   **`server/src/managers/gameManager.ts`:** Supervise les instances de jeu actives. Distribue les messages WebSocket aux instances de jeu appropriées.
*   **`server/src/game/minesweeper.ts`:** Contient toute la logique du jeu de Démineur : génération de la grille (avec seed), révélation de cases, pose de drapeaux, détection de mines, vérification des conditions de victoire/défaite.

## 3. Fonctions/Classes Clés et Signatures

### 3.1. Backend (`server/`)

#### `server.ts`
*   `startServer(port: number): void`: Initialise le serveur Express et le serveur WebSocket, écoute les connexions et les messages.

#### `managers/roomManager.ts`
*   `createRoom(playerId: string): { roomId: string, hostId: string }`: Crée une nouvelle salle, génère un code à 4 lettres unique.
*   `joinRoom(roomId: string, playerId: string): boolean`: Ajoute un joueur à une salle existante. Retourne `true` si succès, `false` sinon (salle pleine ou inexistante).
*   `removePlayerFromRoom(roomId: string, playerId: string): void`: Supprime un joueur d'une salle.
*   `getRoom(roomId: string): RoomState | undefined`: Récupère l'état d'une salle.
*   `isRoomReadyToStart(roomId: string): boolean`: Vérifie si 2 joueurs sont connectés.
*   `generateRoomCode(): string`: Génère un code alphanumérique de 4 caractères unique.

#### `managers/gameManager.ts`
*   `startGame(roomId: string, playerIds: string[]): GameState`: Initialise une nouvelle partie de Démineur pour la salle donnée, génère la grille avec une seed.
*   `handlePlayerAction(roomId: string, playerId: string, action: 'reveal' | 'flag', row: number, col: number): GameState | null`: Traite une action de joueur, met à jour l'état du jeu.
*   `getGameState(roomId: string): GameState | undefined`: Récupère l'état actuel d'une partie.
*   `endGame(roomId: string): GameState`: Termine une partie, calcule les scores finaux et le gagnant.
*   `getWinner(gameState: GameState): { winnerId: string | null, draw: boolean }`: Détermine le gagnant basé sur les scores.

#### `game/minesweeper.ts`
*   `generateBoard(seed: number, rows: number, cols: number, mines: number): Cell[][]`: Génère une grille de démineur avec des mines placées aléatoirement mais de manière déterministe grâce à la seed.
*   `revealCell(grid: Cell[][], row: number, col: number): { updatedGrid: Cell[][], revealedCount: number, hitMine: boolean, gameOver: boolean }`: Révèle une cellule et propage la révélation si elle est vide.
*   `flagCell(grid: Cell[][], row: number, col: number): Cell[][]`: Pose ou retire un drapeau sur une cellule.
*   `checkWinCondition(grid: Cell[][], totalSafeCells: number): boolean`: Vérifie si toutes les cases sûres ont été révélées.

### 3.2. Frontend (`client/`)

#### `services/websocket.ts`
*   `connect(url: string): void`: Établit une connexion WebSocket.
*   `sendMessage<T>(type: string, payload: T): void`: Envoie un message JSON au serveur via WebSocket.
*   `onMessage(callback: (event: MessageEvent) => void): void`: Enregistre un callback pour les messages entrants.
*   `disconnect(): void`: Ferme la connexion WebSocket.

#### `hooks/useGameWebSocket.ts`
*   `useGameWebSocket(roomId: string): { gameState: GameState | null, playerGrid: Cell[][], opponentGrid: Cell[][], sendAction: (action: 'reveal' | 'flag', row: number, col: number) => void, startGame: () => void, isHost: boolean }`: Hook pour gérer la logique de connexion WebSocket et les mises à jour de l'état du jeu côté client.

#### `components/Board.tsx`
*   `<Board grid={Cell[][]} onCellClick={...} onContextMenu={...} readOnly={boolean} />`: Affiche la grille de démineur interactive ou en lecture seule.

#### `public/service-worker.ts`
*   `installEvent(event: ExtendableEvent): void`: Cache les assets statiques lors de l'installation.
*   `fetchEvent(event: FetchEvent): void`: Intercepte les requêtes réseau et sert les ressources depuis le cache si disponible. Affiche un message spécifique en cas d'offline pour les ressources non cachées.

## 4. Modèles de Données et Interfaces

Les interfaces seront définies en TypeScript pour assurer la cohérence entre le client et le serveur.

```typescript
// Shared Types (server/src/types/game.d.ts & client/src/types/game.d.ts)

interface Cell {
  row: number;
  col: number;
  hasMine: boolean;
  minesAround: number; // 0-8
  revealed: boolean;
  flagged: boolean;
  // Ajout pour l'état de l'adversaire (mine touchée)
  exploded?: boolean;
}

interface Player {
  id: string;
  name: string; // Nom généré ou donné par le joueur
  score: number; // Nombre de cases sûres révélées
  gameOver: boolean; // True si le joueur a touché une mine ou a gagné
  gridState: Cell[][]; // Grille spécifique à ce joueur
}

interface RoomState {
  id: string;
  hostId: string;
  players: { [playerId: string]: Player };
  status: 'waiting' | 'ready' | 'in-game' | 'ended';
  gameSeed?: number; // Utilisé pour générer la grille
}

interface GameState {
  roomId: string;
  players: Player[]; // Array ordonné des joueurs
  status: 'waiting' | 'playing' | 'ended';
  seed: number;
  timerStart: number; // Timestamp du début de partie
  timerEnd?: number; // Timestamp de fin de partie
  winnerId: string | null; // ID du gagnant
  draw: boolean; // True si match nul
  totalSafeCells: number; // Nombre total de cases sûres sur la grille
  boardRows: number;
  boardCols: number;
  totalMines: number;
}

// WebSocket Events (server/src/types/websocket.d.ts & client/src/types/websocket.d.ts)

// Client -> Server
interface RevealCellEvent {
  type: 'reveal_cell';
  payload: {
    row: number;
    col: number;
  };
}

interface FlagCellEvent {
  type: 'flag_cell';
  payload: {
    row: number;
    col: number;
  };
}

interface StartGameEvent {
  type: 'start_game';
}

interface CreateRoomEvent {
  type: 'create_room';
}

interface JoinRoomEvent {
  type: 'join_room';
  payload: {
    roomId: string;
  };
}

// Server -> Client
interface GameStateEvent {
  type: 'game_state';
  payload: GameState;
}

interface OpponentUpdateEvent {
  type: 'opponent_update';
  payload: {
    playerId: string;
    revealedCells: { row: number, col: number, value: number }[]; // Seulement les valeurs nécessaires
    flaggedCells: { row: number, col: number, flagged: boolean }[];
    hitMine?: boolean; // Indique si l'adversaire a touché une mine
  };
}

interface GameOverEvent {
  type: 'game_over';
  payload: {
    winnerId: string | null;
    draw: boolean;
    scores: { playerId: string, score: number }[];
    totalTime: number; // en secondes
  };
}

interface RoomCreatedEvent {
  type: 'room_created';
  payload: {
    roomId: string;
    hostId: string;
  };
}

interface RoomJoinedEvent {
  type: 'room_joined';
  payload: {
    roomId: string;
    players: Player[]; // Liste des joueurs dans la salle
    isHost: boolean;
  };
}

interface ErrorEvent {
  type: 'error';
  payload: {
    message: string;
    code?: number;
  };
}
```

## 5. Notes d'Implémentation et Cas Limites

### 5.1. Logique de Jeu

*   **Génération de Grille:** Utiliser une bibliothèque de génération de nombres pseudo-aléatoires avec une `seed` pour s'assurer que les deux joueurs reçoivent exactement la même grille. La seed sera transmise lors de l'initialisation de la partie.
*   **Propagation de Révélation:** Lorsqu'une cellule vide (0 mine autour) est révélée, le serveur doit implémenter une logique de propagation récursive pour révéler toutes les cellules adjacentes jusqu'aux cellules avec des chiffres.
*   **Conditions de Victoire/Défaite:**
    *   **Défaite:** Un joueur perd s'il clique sur une mine. Sa grille se fige.
    *   **Victoire:** La partie se termine quand toutes les cases sûres ont été révélées par les joueurs ou que les deux joueurs ont touché une mine. Le gagnant est celui qui a révélé le plus de cases sûres. En cas d'égalité de score, c'est un match nul.
*   **Scores:** Le score d'un joueur est le nombre de cases sûres qu'il a révélées.

### 5.2. Synchronisation en Temps Réel

*   **WebSocket:** La bibliothèque `ws` côté serveur est non opinionated, nécessitant une gestion manuelle des messages, des connexions et des déconnexions. Chaque joueur aura un ID unique géré par le serveur.
*   **Mises à Jour d'Adversaire:** Pour l'adversaire, seules les cases révélées (chiffres ou vide) et les drapeaux posés/retirés seront visibles. Les mines non explosées ne seront pas transmises avant la fin de la partie.
*   **Déconnexion:** Si un joueur se déconnecte pendant la partie, la partie continue pour l'autre joueur. Le joueur déconnecté est considéré comme ayant perdu (score 0).

### 5.3. PWA (Progressive Web App)

*   **Manifest.json:** Inclure les icônes nécessaires (au moins 192x192 et 512x512) et des couleurs de thème adaptées au mode sombre.
*   **Service Worker:** La stratégie de mise en cache sera principalement "cache-first" pour le shell (HTML, CSS, JS) et "network-first" ou "cache-then-network" pour les assets dynamiques (si applicable). En cas d'offline total, le service worker devrait afficher un message clair indiquant que "la connexion est requise pour jouer" ou une page d'information.

### 5.4. UI/UX

*   **Thème Sombre:** Utilisation de variables CSS pour faciliter le maintien du thème sombre.
*   **Polices:** Police monospace pour un alignement précis des chiffres et des éléments de grille.
*   **Animations CSS:** Transitions fluides et animations subtiles lors de la révélation des cases ou de l'explosion d'une mine.
*   **Responsive Design:** La mise en page sera conçue pour s'adapter aux écrans de tablette et de bureau, en mettant l'accent sur la lisibilité des deux grilles côte à côte. Les dimensions des grilles (16x16) rendent l'expérience mobile difficile, et ne sera pas une priorité.
*   **Clic Droit:** Le client devra intercepter le `contextmenu` event pour gérer le clic droit (poser/retirer drapeau) sans afficher le menu contextuel du navigateur.

### 5.5. Gestion des Erreurs

*   **Backend:** Gérer les entrées invalides (ex: coordonnées hors grille), les requêtes de salle inexistantes, et les erreurs de connexion WebSocket. Les erreurs seront transmises au client via des événements `error` spécifiques.
*   **Frontend:** Afficher des messages d'erreur clairs à l'utilisateur pour les problèmes de connexion, les salles pleines ou les codes invalides.

## 6. Plan du README

Le fichier `README.md` à la racine du monorepo contiendra les sections suivantes :

### 6.1. Introduction
*   Brève description du jeu.
*   Fonctionnalités clés.

### 6.2. Technologies Utilisées
*   Liste des technologies pour le Frontend et le Backend.

### 6.3. Structure du Projet
*   Présentation du monorepo et des dossiers `client/` et `server/`.

### 6.4. Pré-requis
*   Node.js version, gestionnaire de paquets (npm/yarn).

### 6.5. Installation
*   Cloner le dépôt.
*   `npm install` (à la racine et dans `client/` et `server/` si nécessaire, ou un `lerna` / `npm workspace` si configuré pour).

### 6.6. Exécution du Projet
*   **Développement:**
    *   `npm run dev:client` (dans `client/`)
    *   `npm run dev:server` (dans `server/`)
*   **Production:** Instructions pour la compilation et le lancement.

### 6.7. Utilisation du Jeu
*   Comment créer une salle.
*   Comment rejoindre une salle.
*   Instructions de jeu (clic gauche/droit).

### 6.8. Test (si implémenté)
*   Instructions pour lancer les tests unitaires/d'intégration.

### 6.9. PWA
*   Comment installer l'application sur un appareil.
*   Comportement hors ligne.

### 6.10. Licence
*   Informations sur la licence.

### 6.11. Contribution (si applicable)
*   Lignes directrices pour la contribution.
