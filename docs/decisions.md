# Journal des décisions techniques


## D1 — Choix de la stack (2026-10-25)

**Décision** : React + Vite (frontend), Node.js + Express (backend), Prisma (ORM),
PostgreSQL (base), JWT + bcrypt (auth), Docker Compose (déploiement).

**Contexte** : le cahier des charges recommande React/Next.js, Node.js/NestJS, PostgreSQL, JWT, Docker.

**Raison** : Express est plus simple que NestJS pour un premier projet complet et laisse
voir explicitement la structure de l'API REST (middleware d'authentification, contrôleurs,
validation). Le cahier des charges autorise les alternatives raisonnables lorsqu'elles sont
documentées — c'est le rôle de cette entrée. Next.js a été écarté pour ce projet 1 car il
mélange front et back, ce qui rendrait moins visible la séparation exigée « API REST » /
« interface » ; il sera envisagé pour le projet 3 qui le recommande.

**Conséquence** : deux dossiers (`backend/`, `frontend/`), communication par API REST fetch.

## D2 — PostgreSQL local vs PostgreSQL dans Docker (2026-10-25)

**Décision** : utiliser le service PostgreSQL 18 déjà installé et en cours d'exécution sur
la machine pendant le développement ; garder `docker-compose.yml` pour packager
l'application en semaine 4.

**Raison** : le service local tourne déjà (vérifié via `sc query`), aucune configuration
supplémentaire nécessaire. Docker servira pour la livraison finale « deployment-ready ».

## D3 — Mots de passe hashés avec bcrypt, jamais en clair (2026-10-25)

**Décision** : `bcrypt` avec 10 rounds côté backend ; le mot de passe n'est jamais
retourné par l'API (pas de sélecteur `passwordHash` côté client Prisma).

**Raison** : exigence de sécurité du cahier des charges ; question d'entretien classique.
