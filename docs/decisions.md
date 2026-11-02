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
