# Couverture des exigences du cahier des charges Arrowstack

> Correspondance entre chaque exigence du document « 1-Month Internship — Full Stack
> Development » (Projet 1 : B2B Order Management Platform) et l'endroit du dépôt où
> elle est réalisée et prouvée. Chaque ligne pointe vers le fichier ou le cas de test
> qui en est la preuve.

## Required Features / Activities (section 5 du cahier des charges)

| Exigence | Réalisation | Preuve |
|---|---|---|
| Role-based access | JWT + middlewares `authenticate` et `requireRole` ; rôles CLIENT/ADMIN dans le schéma Prisma | `backend/src/middlewares/auth.js` ; [CT-02](cas-de-test.md) |
| REST API integration | 20 routes REST documentées et consommées par le frontend React via `api()` | `docs/exigences.md` §8 ; `frontend/src/api.js` |
| Relational database with migrations | PostgreSQL + Prisma, 5 migrations versionnées | `backend/prisma/schema.prisma` ; `backend/prisma/migrations/` |
| Validation and error handling | Schémas zod + middleware `validate` + `errorHandler` central (codes Prisma traduits en 400/404/409) | `backend/src/schemas/` ; `backend/src/middlewares/` ; [CT-05](cas-de-test.md) |
| Audit-friendly activity records | Table `activity_logs`, helper `logActivity` appelé sur chaque action significative, écrit dans la transaction de commande | `backend/src/lib/logActivity.js` ; [CT-06](cas-de-test.md) |
| Deployment-ready configuration | Dockerfiles backend/frontend, `docker-compose.yml` (3 services, migrations et seed automatiques), `nginx.conf`, README | `docker-compose.yml` ; `backend/Dockerfile` ; `frontend/Dockerfile` ; [CT-11](cas-de-test.md) |

## Functional / Professional Requirements (section 6)

| Exigence | Réalisation | Preuve |
|---|---|---|
| Définir l'utilisateur cible, le périmètre et les métriques de succès avant d'exécuter | Rédigés le 25/10, avant le premier commit de code (vérifiable dans l'historique Git) | `docs/exigences.md` §2, §4, §10 |
| Workflow répétable, décisions traçables, artefacts organisés | Journal des décisions D1 à D14, journal de travail daté, commits réguliers | `docs/decisions.md` ; `journal.md` |
| Gérer des cas limites réalistes | Stock devenu insuffisant entre le panier et la commande, produit déjà commandé non supprimable, panier/commande d'un autre client, commande expédiée non modifiable | [CT-04](cas-de-test.md), [CT-07](cas-de-test.md), [CT-08](cas-de-test.md) ; décision D11 |
| Étape de validation/revue et conservation des preuves | 11 cas de test exécutés et conformes, captures d'écran, vidéo de démonstration | `docs/cas-de-test.md` ; `docs/preuves/` |
| Documenter les limites et recommander des améliorations | 7 limites connues, prochaines améliorations listées | `README.md` « Limites connues » ; `docs/decisions.md` |

## Deliverables (section 11)

| Livrable demandé | Où le trouver |
|---|---|
| Project source files | `backend/` et `frontend/` |
| Requirements and implementation documentation | `docs/exigences.md`, `docs/decisions.md` |
| Test/validation evidence | `docs/cas-de-test.md`, `docs/preuves/`, vidéo de démo (lien dans le README) |
| README / handoff document | `README.md` (lancement local et Docker en quelques commandes) |
| Final presentation or demo | Vidéo des parcours client et admin (lien dans le README) |
| Version-controlled repository | Ce dépôt Git : historique narratif de 30+ commits |

## Ce qui n'est pas fait, en toute transparence

- **Tests automatisés (Jest/Supertest)** : tous les tests sont manuels. Le cahier des
  charges demande des preuves de validation — les 11 cas manuels avec captures les
  fournissent. Les tests automatisés restent la première amélioration à ajouter
  (commencer par l'isolation du panier, non couverte à la main dans CT-08).
- **Mise en ligne (URL publique)** : le projet est « deployment-ready » (CT-11 prouve
  qu'il démarre partout avec Docker), mais pas hébergé — ce qui n'était pas demandé.
  Héberger le frontend, l'API et la base serait la suite logique.
