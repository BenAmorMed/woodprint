# WoodPrint : Plateforme E-Commerce Print-on-Demand

**Description du Projet :**  
WoodPrint est une plateforme E-Commerce moderne spécialisée dans l'impression à la demande (Print-on-Demand). Contrairement aux solutions e-commerce classiques limitées par des attributs physiques fixes, WoodPrint intègre une architecture innovante hybride (Relationnelle + PostgreSQL JSONB). Cette technologie permet d'associer un solide système de logistique (gestion des commandes, stocks, authentification) à un module de personnalisation dynamique et illimité de design digital, orchestré directement via le panneau d'administration.

## Structure du Projet
Le projet suit une séparation stricte (architecture découplée) et des standards académiques pointus.
* **Backend :** Node.js, Express.js, TypeScript, PostgreSQL (via Prisma ORM). Logique encapsulée en contrôleurs, services et dépôts.
* **Frontend :** Dossier réservé à l'application cliente qui sera pilotée dynamiquement par le schéma de configuration JSONB dicté par le backend.

## Principes Logiciels
1. **Conception Atomique :** Le code est fragmenté en composants d'une grande maintenabilité.
2. **Versionnement d'API Strict :** Les points d'accès gravitent autour du protocole strict `/api/v1/`.
3. **Tests d'Intégration :** L'intégralité du cycle de vie des requêtes est confirmée via `Jest`.
4. **Sécurité RBAC :** Mappage dynamique des permissions géré par un SuperAdmin.

## Démarrage Rapide (Environnement de Développement)

### Configuration Backend
```bash
cd backend
npm install
npm run dev
```
