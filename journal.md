# Journal de travail - Projet 1 : plateforme de commandes B2B

## 25/10/2026
- Mise en place du dossier du projet (`backend/`, `frontend/`, `docs/`), git init et création du dépôt GitHub `nicole774/b2b-order-platform`.
- Rédaction d'une première version des exigences, du journal des décisions et des cas de test.
- Choix de la stack : React + Vite, Express, Prisma, PostgreSQL, JWT. J'ai pris Express plutôt que NestJS (voir D1).

À faire ensuite : vérifier que j'arrive à me connecter à PostgreSQL, créer la base, démarrer le backend.

## 28/10/2026
- Relecture des documents : correction des fautes et des métriques de succès qui n'étaient pas mesurables (j'avais mis une « notification » alors que j'avais exclu les emails du périmètre, je l'ai remplacée par une alerte de stock bas côté admin).
- Les tableaux ne s'affichaient pas sur GitHub parce que je les avais mis dans des blocs de code. Corrigé.
- Git affichait des avertissements LF/CRLF à chaque `git add`. J'ai ajouté un `.gitattributes` et réglé VS Code en LF.
- Création de la base `b2b_orders` avec `psql`.
- Installation de Prisma. Problème : `npx prisma init` a généré des fichiers prévus pour Prisma 7 (`prisma.config.ts`, nouveau générateur). Je suis restée sur Prisma 6, j'ai supprimé ce fichier et remis le générateur `prisma-client-js` (D8).
- `npm audit` signale 3 vulnérabilités dans `deepmerge-ts`. C'est une dépendance de l'outil Prisma, utilisée seulement en développement. Je n'ai pas lancé `npm audit fix --force` parce qu'il passerait à Prisma 7.
- Écriture du schéma, une table à la fois, avec une migration à chaque fois : users, products, puis le panier (carts, cart_items), puis orders, order_items, invoices, et enfin activity_logs. 5 migrations au total.

## 29/10/2026
- Serveur Express avec une route `/api/health` pour vérifier que l'API tourne.
- Inscription (`POST /api/auth/register`) avec bcrypt. Vérifié dans Prisma Studio que la colonne contient bien un hash et pas le mot de passe.
- Un email déjà utilisé renvoie 409.

## 30/10/2026
- Connexion avec JWT. Même message d'erreur pour un email inconnu ou un mauvais mot de passe.
- Middlewares `authenticate` (401 si pas de token ou token invalide) et `requireRole` (403 si le rôle ne convient pas), route `/api/auth/me`.
- Script de seed : un compte admin, un compte client et 8 produits, dont un avec un stock de 3 et un en rupture pour pouvoir tester les cas limites.

## 31/10/2026
- Validation des entrées avec zod et un middleware `validate`. Gestion des erreurs centralisée dans `errorHandler` (les erreurs Prisma P2002, P2025 et P2003 sont traduites en 409, 404 et 409).
- Journal d'audit : une fonction `logActivity` appelée sur l'inscription, la connexion, le panier, les produits et les commandes.
- Produits : catalogue public avec recherche et pagination, création, modification et suppression pour l'admin. Un produit déjà commandé ne peut pas être supprimé.
- Panier : un panier par client, contrôle du stock dès l'ajout, et vérification qu'on ne touche qu'à son propre panier.
- Commandes : c'est la partie qui m'a pris le plus de temps. Tout se passe dans une transaction (commande, lignes, facture, stock, panier vidé, log). Pour le stock j'ai utilisé un `updateMany` avec la condition `stockQuantity >= quantité`, pour éviter que deux commandes en même temps fassent passer le stock en négatif (D5).
- Factures et route `/api/admin/audit-logs` avec filtres.
- Tests à la main avec curl : CT-01 à CT-07 conformes. Il reste CT-08.

## 01/11/2026
- Relecture et mise à jour des documents (décisions D8 et D9 ajoutées, limites connues dans le README).
- CT-08 exécuté et conforme : avec le token d'un 2e client (créé via l'inscription), la commande n°1 qui appartient à un autre renvoie bien « Commande introuvable » (404, voir D6). Les 8 cas de test passent.

À faire ensuite : tests automatisés avec Jest et Supertest, frontend, Docker, README final.
