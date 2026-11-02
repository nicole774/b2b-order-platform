# Cas de test

Tests faits à la main avec `curl`, sur la base remplie par le seed. Les captures d'écran vont dans `docs/preuves/`.

## CT-01 - Inscription et connexion
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `POST /api/auth/register` avec un email valide, puis `POST /api/auth/login` |
| Attendu | Le compte est créé avec le rôle CLIENT et le login renvoie un JWT |
| Obtenu | Compte créé avec `"role":"CLIENT"`, sans mot de passe dans la réponse. Le login renvoie un token. Une 2e inscription avec le même email renvoie 409. |
| Preuve | à ajouter |

## CT-02 - Protection des rôles
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `POST /api/products` (a) sans token, (b) avec un token CLIENT, (c) avec un token ADMIN |
| Attendu | (a) 401, (b) 403, (c) 201 |
| Obtenu | 401, 403 « Accès refusé », puis 201 avec le produit créé |
| Preuve | à ajouter |

## CT-03 - Parcours d'achat complet
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Ajouter des produits au panier, puis `POST /api/orders` |
| Attendu | Commande en PENDING avec le bon total, facture créée, stock baissé, panier vide |
| Obtenu | Commande n°1 de 74,70 €, facture FAC-2026-00001, stock des ramettes passé de 120 à 117, panier vide après la commande |
| Preuve | à ajouter |

## CT-04 - Stock insuffisant
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Le client met 15 toners dans son panier (stock 15). L'admin baisse ensuite le stock à 5. Le client commande. |
| Attendu | 400 avec un message clair, stock inchangé, pas de commande ni de facture |
| Obtenu | « Stock insuffisant pour ... », le stock reste à 5, aucune nouvelle commande |
| Remarque | J'ai dû passer par l'admin pour ce test, parce que le panier refuse déjà d'ajouter plus que le stock disponible. Ça montre que la vérification au moment de la commande sert quand le stock change entre-temps. |
| Preuve | à ajouter |

## CT-05 - Entrées invalides
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Inscription avec l'email « abc » et le mot de passe « 123 ». Création d'un produit avec un prix de -5. |
| Attendu | 400 avec un message par champ, rien n'est enregistré |
| Obtenu | 400 « Données invalides », avec 2 erreurs listées pour l'inscription et 1 pour le prix |
| Preuve | à ajouter |

## CT-06 - Journal d'audit
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | Refaire CT-01 à CT-04, puis `GET /api/admin/audit-logs` avec le compte admin |
| Attendu | Chaque action apparaît avec l'utilisateur, l'action, l'entité et la date |
| Obtenu | REGISTER, LOGIN, ADD_TO_CART, CREATE_ORDER et UPDATE_ORDER_STATUS apparaissent. Le filtre `?action=` fonctionne. |
| Preuve | à ajouter |

## CT-07 - Changement de statut d'une commande
Fait le 31/10/2026 - **conforme**

| | |
|---|---|
| Étapes | `PATCH /api/orders/1/status` de PENDING à CONFIRMED avec le compte admin, puis avec un statut qui n'existe pas |
| Attendu | Statut modifié et enregistré dans l'audit ; statut inconnu refusé |
| Obtenu | Statut CONFIRMED, visible dans l'audit avec l'ancien et le nouveau statut. Un statut inconnu renvoie 400. Une commande SHIPPED ou CANCELLED ne peut plus être modifiée (409). |
| Preuve | à ajouter |

## CT-08 - Isolation des données entre clients
Fait le 01/11/2026 - **conforme**

| | |
|---|---|
| Étapes | Je crée un 2e client avec l'inscription, je me connecte avec lui, puis je demande la commande n°1, qui appartient à client@b2b.test |
| Attendu | 404 (voir D6) : l'API ne doit pas confirmer que la commande existe |
| Commande | `curl http://localhost:4000/api/orders/1 -H "Authorization: Bearer TOKEN_DU_2E_CLIENT"` |
| Obtenu | `{"error":"Commande introuvable"}` |
| Remarque | Je n'ai pas refait le même test à la main sur le panier (modifier la ligne de panier d'un autre client). Le code fait la même vérification, je le couvrirai dans les tests automatisés. |
| Preuve | à ajouter |
