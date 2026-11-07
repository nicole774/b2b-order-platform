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
- Déploiement : Docker Compose (PostgreSQL, API Node, interface servie par nginx)

Les raisons de ces choix sont dans [docs/decisions.md](docs/decisions.md).

## Organisation du dépôt

```
backend/            API REST
  prisma/           schéma, migrations, seed
  src/              routes, middlewares, schémas de validation
frontend/           interface React (et sa config nginx pour Docker)
docs/               exigences, décisions, cas de test, captures d'écran
docker-compose.yml  lancement des 3 services avec Docker
journal.md          journal de travail
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

## Lancer le projet avec Docker

C'est la façon la plus simple : une seule commande démarre la base de données, l'API et l'interface, sans rien installer à part Docker. Pas besoin de suivre les deux sections précédentes.

Il faut Docker Desktop lancé. À la racine du dépôt :

```bash
docker compose up -d --build
```

Le premier lancement prend quelques minutes (téléchargement des images et installation des dépendances). Au démarrage, l'API applique les migrations et le seed toute seule, donc les comptes de test ci-dessus fonctionnent directement.

- Interface : http://localhost:5173
- API : http://localhost:4000/api/health doit afficher `{"status":"ok"}`

Si l'API ou l'interface tournent déjà en local avec `npm run dev`, il faut les arrêter avant : les ports 4000 et 5173 seraient déjà pris. La base Docker n'est pas exposée sur le port 5432, donc elle ne gêne pas un PostgreSQL installé en local.

La base Docker est séparée de la base locale : elle démarre vide et le seed la remplit. Pour arrêter :

```bash
docker compose down
```

Les données sont gardées dans un volume. Pour tout effacer et repartir de zéro, ajouter `-v` à la commande.

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, liste des routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md) et leurs résultats
- [Journal de travail](journal.md)

## Où j'en suis

Le projet est terminé et se lance avec Docker.

Fait :
- base de données (8 tables, 5 migrations) ;
- API : authentification, produits, panier, commandes, factures, journal d'audit ;
- tests manuels de l'API, CT-01 à CT-08, tous conformes ;
- frontend : connexion, catalogue, panier, mes commandes, page d'administration avec alerte de stock bas ;
- parcours client et admin testés dans l'interface (CT-09 et CT-10) et filmés (voir Démo) ;
- Docker : base, API et interface dans 3 conteneurs, migrations et seed lancés au démarrage, parcours refaits sur cette version (CT-11).

Pas fait :
- les tests automatisés avec Jest et Supertest. Je n'ai pas eu le temps, tous les tests sont manuels. C'est la première chose que j'ajouterais, en commençant par la vérification du panier d'un autre client que je n'ai pas testée dans CT-08.

## Limites connues

- Une commande annulée ne remet pas les produits en stock.
- Le numéro de facture est calculé à partir du nombre de factures existantes. Si deux commandes sont passées exactement en même temps, la seconde peut échouer (la contrainte d'unicité l'empêche d'avoir le même numéro) et le client doit recommencer.
- Les règles « prix > 0 » et « stock >= 0 » sont vérifiées par l'API mais pas par la base elle-même (voir D9).
- `cors` accepte toutes les origines (voir D10).
- Dans `docker-compose.yml`, le mot de passe de la base et le secret JWT sont écrits en clair. C'est acceptable pour une démo en local, pas pour une vraie mise en ligne (voir D14).
- La recherche dans l'onglet Commandes de l'admin se fait dans le navigateur, sur toutes les commandes chargées d'un coup (voir D12).
- Vulnérabilités signalées par `npm audit` dans une dépendance de Prisma utilisée seulement en développement (voir D8).
