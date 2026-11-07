# Journal des décisions techniques

## D1 - Choix de la stack (25/10/2026)

Le sujet recommande React/Next.js, Node.js/NestJS, PostgreSQL, JWT et Docker, en acceptant d'autres choix s'ils sont justifiés.

J'ai choisi React + Vite pour le frontend, Express pour le backend, Prisma pour l'accès à la base, PostgreSQL, JWT avec bcrypt pour l'authentification, et Docker Compose pour le déploiement.

Pourquoi Express et pas NestJS : c'est mon premier projet complet, et avec Express je vois et j'écris moi-même chaque morceau (middlewares, routes, validation). NestJS fait beaucoup de choses automatiquement et j'aurais passé du temps à apprendre le framework plutôt qu'à construire l'application.

Pourquoi pas Next.js : il mélange le frontend et le backend dans le même projet. Ici je voulais une séparation claire entre l'API REST et l'interface. Je le garde pour le projet 3, où il est recommandé.

Conséquence : deux dossiers séparés, `backend/` et `frontend/`, qui communiquent par l'API.

## D2 - PostgreSQL installé en local pendant le développement (25/10/2026)

PostgreSQL 18 était déjà installé et lancé sur ma machine. Je l'utilise pendant le développement, et Docker sert pour la version finale à rendre. Ça m'évite de configurer Docker dès le début, et le mentor pourra quand même tout lancer avec `docker compose`.

## D3 - Mots de passe hashés avec bcrypt (25/10/2026)

Les mots de passe sont hashés avec bcrypt (10 rounds) avant d'être enregistrés. On ne peut pas retrouver le mot de passe à partir du hash, donc même si la base fuit, les mots de passe ne sont pas lisibles. L'API ne renvoie jamais le champ `passwordHash` : chaque requête précise les champs à renvoyer avec `select`.

## D4 - Colonne `reference` au lieu de `sku` (25/10/2026)

Dans le guide que je suivais, la colonne s'appelait `sku` (Stock Keeping Unit). Je l'ai appelée `reference` parce que c'est le mot utilisé en français pour un code article. Le sens ne change pas : c'est un code unique par produit (contrainte `@unique`).

## D5 - Stock décrémenté dans une transaction, avec une condition (31/10/2026)

Quand un client passe commande, tout est fait dans une seule transaction Prisma : création de la commande et de ses lignes, création de la facture, baisse du stock, panier vidé, ligne dans le journal d'audit. Si une étape échoue, rien n'est enregistré.

Pour le stock, je ne fais pas « lire le stock, vérifier, puis écrire », parce que deux commandes qui arrivent en même temps pourraient lire le même stock et le faire passer en négatif. J'utilise un seul `updateMany` qui ne modifie le produit que si `stockQuantity >= quantité`. Si aucune ligne n'est modifiée, je lève une erreur et la transaction est annulée.

## D6 - 404 plutôt que 403 sur les données d'un autre client (31/10/2026)

Si un client demande une commande ou une facture qui appartient à quelqu'un d'autre, l'API répond 404 (introuvable) et pas 403 (interdit). Avec un 403, on confirmerait que la commande existe. L'admin, lui, a accès à toutes les commandes.

## D7 - Le log de la commande est écrit dans la même transaction (31/10/2026)

La fonction `logActivity` prend en paramètre le client Prisma à utiliser : `prisma` en temps normal, ou `tx` quand on est dans une transaction. Pour la création de commande, le log est écrit dans la transaction. Si la commande est annulée, le log l'est aussi, et le journal ne contient pas de commande qui n'a jamais existé.

## D8 - Rester sur Prisma 6 (28/10/2026)

`npx prisma init` a créé des fichiers pour Prisma 7 (`prisma.config.ts` et le nouveau générateur `prisma-client`, qui produit du TypeScript). Mon backend est en JavaScript CommonJS et le guide que je suivais utilise Prisma 6, donc j'ai gardé la version 6 avec le générateur `prisma-client-js`.

Limite connue : `npm audit` signale 3 vulnérabilités « high » dans `deepmerge-ts`, une dépendance de l'outil en ligne de commande de Prisma. Elle ne sert qu'en développement, pas quand l'API tourne. La correction proposée (`npm audit fix --force`) installerait Prisma 7, ce que je ne veux pas pour l'instant.

## D9 - Règles « prix > 0 » et « stock >= 0 » vérifiées dans l'API (31/10/2026)

Prisma ne permet pas d'écrire ces règles directement dans le schéma. Je les vérifie avec zod avant d'écrire en base (schémas dans `backend/src/schemas/`). Pour le stock, la condition de D5 empêche aussi qu'il devienne négatif lors d'une commande. Amélioration possible : ajouter des contraintes `CHECK` en SQL dans une migration, pour que la base les garantisse aussi.

## D10 - CORS pour autoriser le frontend à appeler l'API (03/11/2026)

Le frontend (Vite, port 5173) et l'API (port 4000) sont sur des origines différentes : sans autorisation, le navigateur bloque les appels entre les deux. J'ai ajouté le middleware `cors` dans `app.js`. Pour l'instant il est appelé sans option (`app.use(cors())`), donc il accepte toutes les origines : c'est pratique en développement, mais trop ouvert pour une vraie mise en ligne.

Amélioration prévue : restreindre `cors` à l'adresse du frontend, lue dans le `.env` (par exemple `CORS_ORIGIN=http://localhost:5173`).

## D11 - Vérifier les commandes avant de supprimer un produit (05/11/2026)

En testant la page admin, la suppression d'un produit déjà commandé affichait « Erreur interne du serveur ». La base refuse bien la suppression (la clé étrangère des lignes de commande est en `Restrict`), mais elle renvoie le code PostgreSQL 23001 que Prisma ne traduit pas, donc mon `errorHandler` le traitait comme une erreur inconnue (500).

Plutôt que de dépendre de ce code, je compte les lignes de commande du produit avant de le supprimer. S'il y en a, l'API renvoie 409 avec un message clair. Je n'ai pas choisi la suppression en cascade : on perdrait l'historique des commandes et des factures. Amélioration possible : un champ « archivé » pour retirer un produit du catalogue sans le supprimer.

## D12 - Pagination et recherche côté serveur (05/11/2026)

En testant, je me suis demandé ce qui se passerait avec des centaines de produits ou de lignes dans le journal : une seule page très longue à faire défiler. J'ai donc ajouté une pagination de 20 lignes (12 produits dans le catalogue) et une recherche.

- Produits : `?search=` cherche dans le nom et la référence, et la réponse donne le nombre total de pages.
- Journal d'audit : ajout de `?page=` et `?email=`. La route renvoie toujours un simple tableau (je n'ai pas voulu changer son format), donc le frontend ne connaît pas le nombre total de pages : il affiche « Suivante » tant que la page est pleine.
- Commandes : le filtre se fait dans le navigateur, sur la liste déjà chargée. C'est suffisant pour la quantité de données du projet, mais il faudrait le faire côté serveur s'il y avait beaucoup de commandes.

## D13 - Messages flottants et fenêtre d'ajout de produit (05/11/2026)

Au début, les messages de succès ou d'erreur s'affichaient en haut de la page. Quand je supprimais un produit en bas de la liste, je ne voyais pas le message et je recliquais en pensant que rien ne s'était passé. Les messages s'affichent maintenant en bas à droite de l'écran (composant `Toast`) et disparaissent après quelques secondes.

Pour la même raison, le formulaire d'ajout de produit est dans une fenêtre (balise `<dialog>`) qui s'ouvre au-dessus de la liste. Les champs obligatoires ont un astérisque rouge, la description est marquée « facultatif », et le bouton reste gris tant que les champs ne sont pas tous remplis correctement. Les erreurs renvoyées par l'API s'affichent dans la fenêtre, sinon elles seraient cachées derrière.

