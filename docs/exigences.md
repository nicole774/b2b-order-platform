# Document d'exigences — Plateforme de gestion de commandes B2B

## 1. Contexte et scénario
Un distributeur B2B (Business-to-Business) vend des produits à des entreprises clientes.
Aujourd'hui, les commandes passent par des emails et des appels, ce qui entraîne une perte de temps, des erreurs sur les stocks, des clients qui attendent en vain leur commande et, parfois, une commande reçue qui ne correspond pas à ce qui avait été demandé. L'administrateur n'a aucune visibilité et il n'existe pas d'historique des achats. C'est dans ce cadre que nous développons une plateforme web multi-rôles qui centralise : catalogue produits, panier, commandes, factures,
suivi du stock et contrôles administrateur.


## 2. Parties prenantes et rôles
| Rôle | Description | Peut faire |
|---|---|---|
| **VISITEUR** | Non connecté | Voir le catalogue, créer un compte, se connecter |
| **CLIENT** | Entreprise acheteuse (compte individuel) | Gérer son panier, passer des commandes, voir ses commandes et factures |
| **ADMIN** | Gestionnaire du distributeur | Gérer les produits et le stock, voir toutes les commandes, changer leur statut, émettre des factures, consulter le journal d'audit |

**Partie prenante principale** : le gestionnaire du distributeur (ADMIN), qui gagne en
visibilité opérationnelle ; bénéficiaire secondaire : les clients, qui commandent plus
vite et sans erreur.
## 3. Problème métier et bénéfice attendu
- **Problème** : commandes manuelles → erreurs de stock, commandes perdues, pas d'historique.
- **Décision permise par l'outil** : l'admin voit en temps réel les commandes en attente,
  les niveaux de stock et peut prioriser les expéditions.
- **Bénéfice mesurable** : une commande complète passe en moins de 2 minutes ; le stock
  est toujours exact ; chaque action est traçable dans l'historique.
## 4. Périmètre (scope)
**Dans le périmètre :**
- Authentification JWT avec 2 rôles (CLIENT, ADMIN)
- Catalogue produits avec stock
- Panier, commande, facture
- Décrément automatique du stock
- Alerte de stock bas dans le tableau de bord admin
- Journal d'activité (historique)
- API REST documentée, prête pour Docker

**Hors périmètre (explicitement exclu) :**
- Paiement en ligne réel (simulation uniquement)
- Envoi d'emails (confirmation, etc.)
- Application mobile, multi-devises, multi-langues
- Gestion multi-sociétés avec plusieurs utilisateurs par compte client
## 5. Exigences fonctionnelles
| # | Exigence | Priorité |
|---|---|---|
| Fonction1 | Inscription/connexion avec JWT, mots de passe hashés (bcrypt) | Haute |
| Fonction2 | Rôles CLIENT/ADMIN, routes protégées par rôle | Haute |
| Fonction3 | CRUD produits (ADMIN) ; consultation du catalogue (tous) | Haute |
| Fonction4 | Panier par client : ajout, modification de quantité, suppression | Haute |
| Fonction5 | Passer commande depuis le panier : crée la commande + ses lignes + la facture, décrémente le stock, vide le panier — le tout dans une transaction | Haute |
| Fonction6 | Refuser une commande si le stock est insuffisant (message clair) | Haute |
| Fonction7 | Statuts de commande : PENDING → CONFIRMED → SHIPPED, ou CANCELLED (ADMIN) | Moyenne |
| Fonction8 | Facture avec numéro unique, associée à la commande | Moyenne |
| Fonction9 | Journal d'audit : chaque action significative est enregistrée (qui, quoi, quand) | Haute |
| Fonction10 | Validation de toutes les entrées (prix > 0, quantité entière ≥ 1, email valide…) avec messages d'erreur clairs | Haute |
## 6. Exigences non fonctionnelles

- **Sécurité** : mots de passe hashés bcrypt, JWT signé avec expiration, secrets hors du code (fichier `.env` exclu de Git).
- **Intégrité des données** : clés étrangères, contraintes d'unicité, transactions Prisma pour commande + stock.
- **Reproductibilité** : `docker-compose.yml` + README permettant de tout lancer en 3 commandes.
- **Traçabilité** : historique Git propre avec des commits réguliers et nommés.

## 7. Modèle de données (8 tables)

| Table | Colonnes principales | Contraintes clés |
|---|---|---|
| `users` | id, email, passwordHash, name, role | email unique ; role ∈ {CLIENT, ADMIN} |
| `products` | id, name, description, price, stockQuantity, reference| reference unique ; price > 0 ; stockQuantity ≥ 0 |
| `carts` | id, userId | userId unique (1 panier par utilisateur) |
| `cart_items` | id, cartId, productId, quantity | quantity ≥ 1 ; paire (cartId, productId) unique |
| `orders` | id, userId, status, total, createdAt | status ∈ {PENDING, CONFIRMED, SHIPPED, CANCELLED} |
| `order_items` | id, orderId, productId, quantity, unitPrice | quantity ≥ 1 ; unitPrice figé à la commande |
| `invoices` | id, orderId, number, total, issuedAt | number unique ; 1 facture par commande |
| `activity_logs` | id, userId, action, entity, entityId, createdAt | index sur createdAt et userId |

## 8. Endpoints de l'API REST

### Authentification (public)
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte (rôle CLIENT automatique) |
| POST | `/api/auth/login` | Retourne un JWT |

### Produits
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/products` | Public (avec recherche et pagination) |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | ADMIN |
| PUT | `/api/products/:id` | ADMIN |
| DELETE | `/api/products/:id` | ADMIN (refusé si le produit est dans une commande) |

### Panier
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/cart` | CLIENT |
| POST | `/api/cart/items` | CLIENT (body : productId, quantity) |
| PATCH | `/api/cart/items/:itemId` | CLIENT (changer la quantité) |
| DELETE | `/api/cart/items/:itemId` | CLIENT |

### Commandes et factures
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/orders` | CLIENT (transforme le panier en commande) |
| GET | `/api/orders` | CLIENT (les siennes) / ADMIN (toutes) |
| GET | `/api/orders/:id` | CLIENT (propriétaire) / ADMIN |
| PATCH | `/api/orders/:id/status` | ADMIN |
| GET | `/api/invoices/:id` | CLIENT (propriétaire) / ADMIN |

### Audit ou historique
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/admin/audit-logs` | ADMIN (filtre par utilisateur, date, action) |

## 9. Critères d'acceptation
- Un visiteur peut créer un compte et se connecter ; il reçoit un rôle CLIENT.
- Un CLIENT ne peut PAS accéder aux routes ADMIN (testé, exemple : 403 sur POST /api/products).
- Le parcours complet fonctionne : ajouter 2 produits au panier → commander → stock décrémenté → facture générée → panier vidé.
- Commander plus que le stock disponible échoue avec un message clair, et **rien n'est modifié** (transaction annulée).
- Toute entrée invalide (prix négatif, quantité 0, email invalide) renvoie une erreur 400.
- Toutes les actions ci-dessus apparaissent dans `activity_logs`.
- Le mentor peut cloner le dépôt et lancer le projet en suivant uniquement le README.
## 10. Métriques de succès
1. Un client passe une commande complète (connexion → panier → commande) en moins de 2 minutes, mesuré lors des tests manuels.
2. 100 % des routes protégées renvoient 401 sans token et 403 sans le bon rôle (vérifié par les tests automatisés).
3. 100 % des produits dont le stock passe sous le seuil (par défaut 5 unités) apparaissent dans l'alerte de stock bas du tableau de bord admin ; le stock n'est jamais négatif.
4. 100 % des actions significatives (inscription, connexion, CRUD produit, commande, changement de statut) sont enregistrées dans `activity_logs`.
