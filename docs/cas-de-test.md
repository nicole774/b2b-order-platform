# Cas de test

CT-01 à CT-08 : tests de l'API faits à la main avec `curl`, sur la base remplie par le seed.
CT-09 et CT-10 : les deux parcours refaits dans l'interface, une fois le frontend terminé.
CT-11 : le projet complet (base, API, interface) démarré et testé dans Docker.

Les captures d'écran sont dans `docs/preuves/`. La vidéo de démonstration des deux parcours est ici : [démo sur Google Drive](https://drive.google.com/file/d/1OmyJmg-sysHN-1ZWmsnKRQ6FJ1LZxScJ/view?usp=sharing).

## CT-01 - Inscription et connexion
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `POST /api/auth/register` avec un email valide, puis `POST /api/auth/login` |
| Attendu | Le compte est créé avec le rôle CLIENT et le login renvoie un JWT |
| Obtenu | Compte créé avec `"role":"CLIENT"`, sans mot de passe dans la réponse. Le login renvoie un token. Une 2e inscription avec le même email renvoie 409. |
| Preuve | [ct-1.png](preuves/ct-1.png) (et [premier essai](preuves/ct-1premier.png)) |

## CT-02 - Protection des rôles
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `POST /api/products` (a) sans token, (b) avec un token CLIENT, (c) avec un token ADMIN |
| Attendu | (a) 401, (b) 403, (c) 201 |
| Obtenu | 401, 403 « Accès refusé », puis 201 avec le produit créé |
| Preuve | [ct-2.png](preuves/ct-2.png) |

## CT-03 - Parcours d'achat complet
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Ajouter des produits au panier, puis `POST /api/orders` |
| Attendu | Commande en PENDING avec le bon total, facture créée, stock baissé, panier vide |
| Obtenu | Commande n°1 de 74,70 €, facture FAC-2026-00001, stock des ramettes passé de 120 à 117, panier vide après la commande |
| Preuve | [ct-3.png](preuves/ct-3.png) |

## CT-04 - Stock insuffisant
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Le client met 15 toners dans son panier (stock 15). L'admin baisse ensuite le stock à 5. Le client commande. |
| Attendu | 400 avec un message clair, stock inchangé, pas de commande ni de facture |
| Obtenu | « Stock insuffisant pour ... », le stock reste à 5, aucune nouvelle commande |
| Remarque | J'ai dû passer par l'admin pour ce test, parce que le panier refuse déjà d'ajouter plus que le stock disponible. Ça montre que la vérification au moment de la commande sert quand le stock change entre-temps. |
| Preuve | [ct-4.png](preuves/ct-4.png) |

## CT-05 - Entrées invalides
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Inscription avec l'email « abc » et le mot de passe « 123 ». Création d'un produit avec un prix de -5. |
| Attendu | 400 avec un message par champ, rien n'est enregistré |
| Obtenu | 400 « Données invalides », avec 2 erreurs listées pour l'inscription et 1 pour le prix |
| Preuve | [ct-5.png](preuves/ct-5.png) |

## CT-06 - Journal d'audit
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Refaire CT-01 à CT-04, puis `GET /api/admin/audit-logs` avec le compte admin |
| Attendu | Chaque action apparaît avec l'utilisateur, l'action, l'entité et la date |
| Obtenu | REGISTER, LOGIN, ADD_TO_CART, CREATE_ORDER et UPDATE_ORDER_STATUS apparaissent. Le filtre `?action=` fonctionne. |
| Preuve | [ct-6.png](preuves/ct-6.png) |

## CT-07 - Changement de statut d'une commande
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `PATCH /api/orders/1/status` de PENDING à CONFIRMED avec le compte admin, puis avec un statut qui n'existe pas |
| Attendu | Statut modifié et enregistré dans l'audit ; statut inconnu refusé |
| Obtenu | Statut CONFIRMED, visible dans l'audit avec l'ancien et le nouveau statut. Un statut inconnu renvoie 400. Une commande SHIPPED ou CANCELLED ne peut plus être modifiée (409). |
| Preuve | [ct-7.png](preuves/ct-7.png) |

## CT-08 - Isolation des données entre clients
Fait le 01/11/2026 - **conforme**

| | |
|---|---|
| Étapes | Je crée un 2e client avec l'inscription, je me connecte avec lui, puis je demande la commande n°1, qui appartient à client@b2b.test |
| Attendu | 404 (voir D6) : l'API ne doit pas confirmer que la commande existe |
| Commande | `curl http://localhost:4000/api/orders/1 -H "Authorization: Bearer TOKEN_DU_2E_CLIENT"` |
| Obtenu | `{"error":"Commande introuvable"}` |
| Remarque | Je n'ai pas refait le même test à la main sur le panier (modifier la ligne de panier d'un autre client). Le code fait la même vérification, je le couvrirai dans les tests automatisés. |
| Preuve | [ct-8.png](preuves/ct-8.png) |

## CT-09 - Parcours client dans l'interface
Fait le 05/11/2026 - **conforme**

| | |
|---|---|
| Étapes | Connexion avec client@b2b.test, recherche dans le catalogue, ajout de 2 produits au panier, modification d'une quantité, « Passer la commande », puis ouverture de « Mes commandes » |
| Attendu | Message de confirmation à chaque ajout, total du panier juste, commande créée avec sa facture, visible dans « Mes commandes » ; parcours en moins de 2 minutes (métrique de succès 1) |
| Obtenu | Commande n°8 de 358,00 €, facture FAC-2026-00008, statut « En attente » dans « Mes commandes ». De la connexion à la confirmation de la commande : environ 1 min 25 s, mesuré sur la vidéo. |
| Preuve | [catalogue et ajout au panier](preuves/client-ajout-produit-panier.png), [panier](preuves/client-mon-panier.png), [mes commandes](preuves/client-mes-commandes.png), [vidéo](https://drive.google.com/file/d/1OmyJmg-sysHN-1ZWmsnKRQ6FJ1LZxScJ/view?usp=sharing) |

## CT-10 - Parcours admin dans l'interface
Fait le 05/11/2026 - **conforme**

| | |
|---|---|
| Étapes | Connexion avec admin@b2b.test, ajout d'un produit avec la fenêtre « Ajouter un produit », vérification du stock après la commande de CT-09, changement de statut d'une commande, consultation du journal d'audit |
| Attendu | Produit créé et visible dans la liste, stock baissé après la commande, statut modifié, actions du client et de l'admin présentes dans le journal |
| Obtenu | Produit ajouté, stock mis à jour, commande n°7 passée à « Expédiée » (elle ne peut plus être modifiée ensuite, la liste est grisée). Le journal affiche les ajouts au panier, la commande et le changement de statut. |
| Preuve | [ajout d'un produit](preuves/admin-ajout-produit.png), [produits en stock](preuves/admin-produit-en-stock.png), [commandes](preuves/admin-commande.png), [journal d'audit](preuves/admin-journal-audit.png), [vidéo](https://drive.google.com/file/d/1OmyJmg-sysHN-1ZWmsnKRQ6FJ1LZxScJ/view?usp=sharing) |

## CT-11 - Lancement du projet complet avec Docker
Fait le 07/11/2026 - **conforme**

| | |
|---|---|
| Étapes | Fermer les serveurs locaux, puis `docker compose up -d --build` à la racine : la base, l'API et l'interface démarrent dans 3 conteneurs, avec les migrations et le seed exécutés automatiquement par le backend |
| Attendu | Les 3 conteneurs sont « Up » (db en « healthy »), `/api/health` répond, et les parcours client et admin passent sur la version Dockerisée (base neuve remplie par le seed) |
| Obtenu | Les 3 conteneurs tournent, l'API répond `{"status":"ok"}`, le login fonctionne et les parcours client et admin ont été refaits dans le navigateur sur la base Docker, qui est indépendante de la base locale. Recharger une page (`/commandes`, `/panier`, `/admin`) fonctionne aussi. |
| Remarque | Problèmes corrigés : l'image `postgres:18` attend le volume sur `/var/lib/postgresql` et non plus `/var/lib/postgresql/data`, et le client Prisma devait être généré explicitement dans le Dockerfile. Puis, en relisant, recharger `/commandes` donnait une erreur 404 de nginx, corrigée avec `frontend/nginx.conf` (voir journal du 07/11 et D14) |
| Preuve | [docker compose ps](preuves/docker-compose-ps.png), [Docker Desktop avec les 3 conteneurs](preuves/docker-3-conteneurs.png), [construction des images](preuves/docker-compose-build.png), [réponse de l'API](preuves/api-reponse.png), [/api/health](preuves/api-health-ok.png) |
