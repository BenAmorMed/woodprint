# Référence du Scénario E2E (End-to-End) : E-commerce WoodPrint

Ce document sert de référence technique pour comprendre le fonctionnement global de la plateforme WoodPrint. Il s'appuie sur le test d'intégration massif `system_e2e.test.ts` qui simule un parcours réel et complet impliquant tous les acteurs (SuperAdmin, Admin, Client, Invité) et tous les modules.

## 1. Gouvernance et Sécurité (RBAC)
Le système repose sur un cloisonnement strict des accès :
- **SuperAdmin** : A le pouvoir d'allouer des permissions spécifiques via le module `ModuleSysteme`.
- **Admins Restreints** : Un admin possédant uniquement la permission `GESTION_PRODUITS` recevra un code `403 Forbidden` s'il tente d'accéder ou de modifier l'état des commandes (`GESTION_COMMANDES`). Le test valide ce rejet.

## 2. Architecture Hybride : Catalogue et Personnalisation
Le système ne code pas les attributs de personnalisation "en dur" dans la base de données. 
Lors de la création d'un produit, l'Admin injecte un `schema_personnalisation` (JSONB) :
```json
[
  { "id": "texte_central", "nom": "Texte Central", "type": "texte", "requis": true },
  { "id": "cadre", "nom": "Type de Cadre", "type": "select", "requis": true, "options": ["Noir", "Blanc", "Chêne"] }
]
```
**Règle métier validée par le test** : Si un client tente de commander ce produit en choisissant un cadre "Rouge", le Backend intercepte la requête, la confronte au schéma parent, et la rejette (`400 Bad Request`) avant toute insertion en base.

## 3. Parcours Utilisateur et Commande "Invité"
Afin de maximiser le taux de conversion, la plateforme permet les achats sans compte.
- **Commande Invité** : L'utilisateur fournit un email. Le système génère un `code_confirmation` unique, renvoyé au client. L'utilisateur utilise la combinaison Email + Code pour suivre l'état de sa commande.
- **Réconciliation Asynchrone** : Le test valide que si cet invité décide de créer un compte officiel plus tard avec la même adresse email, le Backend détecte et lie ("merge") automatiquement ses anciennes commandes "Invité" à son nouveau compte.

## 4. Protection des Stocks et Modération
- **Rupture de Stock** : Le test s'assure que si un utilisateur commande une quantité supérieure au stock disponible de la variante, la transaction entière est annulée (Rollback).
- **Modification de Statut** : Seul un Admin avec `GESTION_COMMANDES` peut avancer le cycle de vie de la commande (`EN_ATTENTE` -> `EXPEDIEE` -> `LIVREE`).

## 5. La Règle du "Delivery-Gating" (Avis Clients)
Pour éviter le spam et les faux avis, une porte logique stricte est imposée :
1. **Tentative Prématurée** : Un client commande un produit et essaie de laisser un avis immédiatement. Le test vérifie que le backend rejette cette action (`403 Forbidden`).
2. **Ouverture de la Porte** : L'Admin passe le statut de la commande à `LIVREE`. Le client est alors autorisé à laisser un avis (un seul par produit, validé par le test de "Spam Protection").
3. **Réponse Officielle** : Un Admin Marketing (avec permission `GESTION_AVIS`) peut ajouter une réponse publique `reponse_admin` à cet avis.

## 6. Lecture Finale Publique
Le cycle se termine par une requête GET publique `/api/v1/produits/:id`. 
Le test vérifie que le frontend reçoit un objet JSON exhaustif contenant :
- Les données de base du produit.
- L'arbre des catégories.
- Les variantes physiques disponibles.
- L'historique des avis légitimes (et leurs réponses d'administration).
- Les offres promotionnelles actives appliquées au produit.

---
*Cette documentation reflète fidèlement les assertions testées automatiquement dans `backend/src/tests/system_e2e.test.ts` et sert de preuve du fonctionnement conjoint de l'architecture.*
