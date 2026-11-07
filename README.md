# Plateforme de commandes B2B

Projet 1 de mon stage Full Stack chez Arrowstack.

Un distributeur vend des fournitures à des entreprises. Avant, les commandes passaient par email et par téléphone, avec des erreurs de stock et aucun historique. Cette application permet aux clients de commander en ligne et à l'administrateur de gérer les produits, le stock, les commandes et les factures, avec un journal de toutes les actions.

## Démo

Vidéo des deux parcours (client puis admin) : [voir la démo sur Google Drive](https://drive.google.com/file/d/1OmyJmg-sysHN-1ZWmsnKRQ6FJ1LZxScJ/view?usp=sharing).

La vidéo n'est pas dans le dépôt pour ne pas l'alourdir. Les captures d'écran sont dans `docs/preuves/`.

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

Le backend doit être démarré d'abord (le frontend lui envoie les requêtes).

1. Installer les dépendances :
   ```bash
   cd frontend
   npm install
   ```
2. Démarrer :
   ```bash
   npm run dev
   ```

L'interface tourne sur http://localhost:5173. Elle appelle l'API sur http://localhost:4000 par défaut ; cette adresse est modifiable avec la variable `VITE_API_URL` (voir `frontend/src/api.js`).

Se connecter avec un des comptes de test ci-dessus.

- Un compte CLIENT voit le catalogue (recherche par nom ou référence, 12 produits par page), son panier et ses commandes avec leur facture.
- Un compte ADMIN voit la page d'administration en trois onglets : produits et stock (ajout dans une fenêtre, modification, suppression, alerte de stock bas à 5 unités ou moins), commandes (recherche, filtre par statut, changement de statut) et journal d'audit (filtre par email et par action).
- Les listes longues sont découpées en pages de 20 lignes.
- Sans connexion, on peut voir le catalogue mais pas commander.

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, liste des routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md) et leurs résultats
- [Journal de travail](journal.md)

## Où j'en suis

Terminé :
- base de données (8 tables, 5 migrations) ;
- API : authentification, produits, panier, commandes, factures, journal d'audit ;
- tests manuels de l'API CT-01 à CT-08, tous conformes ;
- frontend : connexion, catalogue, panier, mes commandes, page d'administration avec alerte de stock bas ;
- parcours client et admin testés dans l'interface (CT-09 et CT-10) et filmés (voir Démo) ;
- preuves d'écran dans `docs/preuves/`.

Reste à faire :
- configuration Docker (Dockerfile backend et frontend + docker-compose) ;
- tests automatisés (Jest + Supertest), si le temps le permet.

## Limites connues

- Une commande annulée ne remet pas les produits en stock.
- Le numéro de facture est calculé à partir du nombre de factures existantes. Si deux commandes sont passées exactement en même temps, la seconde peut échouer (la contrainte d'unicité l'empêche d'avoir le même numéro) et le client doit recommencer.
- Les règles « prix > 0 » et « stock >= 0 » sont vérifiées par l'API mais pas par la base elle-même (voir D9).
- Vulnérabilités signalées par `npm audit` dans une dépendance de Prisma utilisée seulement en développement (voir D8).
