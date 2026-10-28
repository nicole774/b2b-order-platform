# Cas de test — Plateforme B2B

## CT-01 — Inscription et connexion

| Élément | Détail |
|---|---|
| Étapes | POST /api/auth/register avec email valide → POST /api/auth/login |
| Attendu | Compte créé (rôle CLIENT) ; le login retourne un JWT valide |
| Preuve | _à compléter_ |

## CT-02 — Protection des rôles

| Élément | Détail |
|---|---|
| Étapes | Appeler POST /api/products avec : (a) pas de token, (b) token CLIENT |
| Attendu | (a) 401 Unauthorized ; (b) 403 Forbidden |
| Preuve | _à compléter_ |

## CT-03 — Parcours d'achat complet

| Élément | Détail |
|---|---|
| Étapes | Ajouter produit A (qté 2) et B (qté 1) au panier → POST /api/orders |
| Attendu | Commande créée (status PENDING), total correct, facture générée, stock décrémenté de 2 et 1, panier vide |
| Preuve | _à compléter_ |

## CT-04 — Stock insuffisant

| Élément | Détail |
|---|---|
| Étapes | Produit avec stock 1 ; ajouter qté 5 au panier ; commander |
| Attendu | Erreur 400 « stock insuffisant » ; stock inchangé ; aucune commande ni facture créée |
| Preuve | _à compléter_ |

## CT-05 — Entrées invalides

| Élément | Détail |
|---|---|
| Étapes | Créer un produit avec prix -10 ; quantité 0 au panier ; email « abc » à l'inscription |
| Attendu | Erreurs 400 avec messages explicites, rien n'est enregistré |
| Preuve | _à compléter_ |

## CT-06 — Journal d'audit

| Élément | Détail |
|---|---|
| Étapes | Effectuer les actions de CT-01 à CT-04 puis GET /api/admin/audit-logs en ADMIN |
| Attendu | Chaque action y apparaît avec utilisateur, action, entité et horodatage |
| Preuve | _à compléter_ |

## CT-07 — Changement de statut de commande (ADMIN)

| Élément | Détail |
|---|---|
| Étapes | PATCH /api/orders/:id/status PENDING → SHIPPED |
| Attendu | Statut mis à jour ; action journalisée ; transition invalide (ex. SHIPPED → PENDING) refusée |
| Preuve | _à compléter_ |

## CT-08 — Isolation des données clients

| Élément | Détail |
|---|---|
| Étapes | Client B tente GET /api/orders/:id d'une commande du client A |
| Attendu | 403 Forbidden (sauf ADMIN) |
| Preuve | _à compléter_ |
