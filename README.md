# Plateforme de commandes B2B

Projet 1 de mon stage Full Stack chez Arrowstack.

Un distributeur vend des fournitures à des entreprises. Avant, les commandes passaient par email et par téléphone, avec des erreurs de stock et aucun historique. Cette application permet aux clients de commander en ligne et à l'administrateur de gérer les produits, le stock, les commandes et les factures, avec un journal de toutes les actions.

## Technologies

- Backend : Node.js, Express 5, Prisma 6, PostgreSQL
- Authentification : JWT et bcrypt
- Validation : zod
- Frontend : React + Vite
- Déploiement : Docker Compose

Les raisons de ces choix sont dans [docs/decisions.md](docs/decisions.md).

## Organisation du dépôt

```
backend/     API REST
  prisma/    schéma, migrations, seed
  src/       routes, middlewares, schémas de validation
frontend/    interface React
docs/        exigences, décisions, cas de test
journal.md   journal de travail
```

## Lancer le backend

Il faut Node.js 20 ou plus et PostgreSQL 15 ou plus.

1. Installer les dépendances :
   ```bash
   cd backend
   npm install
   ```
2. Copier `.env.example` en `.env`, puis mettre dans `DATABASE_URL` l'utilisateur, le mot de passe et le port de votre PostgreSQL, et une longue chaîne aléatoire dans `JWT_SECRET` :
   ```bash
   cp .env.example .env
   ```
3. Créer les tables puis charger les données de démonstration :
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Démarrer l'API :
   ```bash
   npm run dev
   ```

L'API tourne sur http://localhost:4000. Pour vérifier : http://localhost:4000/api/health doit afficher `{"status":"ok"}`.

### Comptes de test

Créés par le seed :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@b2b.test | Admin123! |
| Client | client@b2b.test | Client123! |

## Lancer le frontend

À compléter.

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, liste des routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md) et leurs résultats
- [Journal de travail](journal.md)

## Où j'en suis

Terminé :
- base de données (8 tables, 5 migrations) ;
- API : authentification, produits, panier, commandes, factures, journal d'audit ;
- tests manuels CT-01 à CT-08, tous conformes.

Reste à faire :
- tests automatisés (Jest + Supertest) ;
- frontend ;
- configuration Docker.

## Limites connues

- Une commande annulée ne remet pas les produits en stock.
- Le numéro de facture est calculé à partir du nombre de factures existantes. Si deux commandes sont passées exactement en même temps, la seconde peut échouer (la contrainte d'unicité l'empêche d'avoir le même numéro) et le client doit recommencer.
- Les règles « prix > 0 » et « stock >= 0 » sont vérifiées par l'API mais pas par la base elle-même (voir D9).
- Vulnérabilités signalées par `npm audit` dans une dépendance de Prisma utilisée seulement en développement (voir D8).
