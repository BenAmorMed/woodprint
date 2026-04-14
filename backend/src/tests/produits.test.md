# Documentation de Test : Produits (produits.test.ts)

## Cible du Test
Ce fichier de test valide le cycle de vie complet de l'entité `Produit` et l'intégrité de la colonne `schema_personnalisation` (Architecture Jsonb / Générateur d'interface). 

## Cas Passants et Non Passants
1. **Validation du Schéma (400 Bad Request)** : Rejet formel de toute requête HTTP `POST` contenant un type de personnalisation hors du périmètre strict d'énumération TypeScript (`TypeChampPersonnalisation`).
2. **Création d'Entité (201 Created)** : Validation de l'insertion en base d'un produit complexe (contenant une image, un texte libre et un sélecteur à options multiples) avec conservation intégrale du modèle relationnel avec ses catégories parentes.
3. **Distribution du Schéma (200 OK)** : Confirmation que la projection REST globale préserve la hiérarchie et la configuration exacte des noeuds JSONB, nécessaires pour l'interprétation par le client logiciel (Frontend).

## Considérations de Sécurité
- Les tests de création s'exécutent avec un jeton `JWT` d'administration généré lors du `beforeAll`, afin de garantir que les routes bloquent les créations aux acteurs ne possédant pas la permission `GESTION_PRODUITS`.
