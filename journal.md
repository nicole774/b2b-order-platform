# Journal de travail — Projet 1 : Plateforme de gestion de commandes B2B


## 2026-10-25
- Création de la structure du projet : `backend/`, `frontend/`, `docs/`.
- Initialisation de Git, création du dépôt GitHub `nicole774/b2b-order-platform`, premier push.
- Rédaction du document d'exigences (`docs/exigences.md`), du journal des décisions (`docs/decisions.md`) et du plan de tests (`docs/cas-de-test.md`).
### Prochaines étapes prévues
- Vérifier la connexion à PostgreSQL 18 (installé localement, service en cours d'exécution).
- Créer la base de données `b2b_orders`.
- Initialiser le backend Node.js/Express avec Prisma et écrire le schéma.

## 2026-10-28
- Revue des documents : correction des fautes.
- Ajout de `.gitattributes` (fins de ligne LF) et `.gitignore` (exclusion de `node_modules/` et `.env`).
- Création de la base `b2b_orders` sur le PostgreSQL 18 local.
- Initialisation du backend (`npm init`) et de Prisma 6 ; configuration de `DATABASE_URL` dans `backend/.env`.
- Écriture du schéma Prisma et création des 8 tables en 5 migrations : `users`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `invoices`, `activity_logs`.

