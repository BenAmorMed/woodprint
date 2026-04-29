# Documentation de Test : Commandes (commandes.test.ts)

## Cible du Test
Ce fichier de test valide le cycle de vie métier (de bout en bout) de l'entité `Commande` et de ses composants (`LigneCommande`), englobant à la fois le flux d'achats pour les utilisateurs invités et pour les clients authentifiés.

## Scénarios Métier (Cas Passants et Non Passants)
1. **Flux 1 : Commande et Suivi Invité (Guest Checkout)** :
   - **Création (201 Created)** : Validation de la création d'une commande sans authentification. Le système doit garantir la génération d'un `code_confirmation` sécurisé.
   - **Suivi (200 OK)** : Un invité doit pouvoir récupérer les détails de sa commande uniquement en fournissant son `code_confirmation` et l'adresse électronique associée.
   - **Échec Suivi (404 Not Found)** : Rejet formel de toute tentative de suivi avec un code invalide ou inexistant.
2. **Flux 2 : Commande et Historique Authentifié** :
   - **Création (201 Created)** : Lorsqu'un utilisateur connecté (jeton JWT valide) effectue une commande, le système doit associer l'identifiant de l'utilisateur (`utilisateur_id`) sans générer de code d'invité.
   - **Historique (200 OK)** : La route `/mes-commandes` doit restituer uniquement les commandes liées à l'utilisateur connecté, garantissant ainsi le cloisonnement des données.
3. **Flux 3 : Protection de l'Inventaire** :
   - **Rejet (400 Bad Request)** : Validation de l'intégrité commerciale. Le système doit rejeter de manière atomique la transaction si la quantité demandée dépasse le stock réel de la `VarianteProduit`.

## Considérations de Sécurité et de Données
- **Isolation des Tests** : Ce fichier inclut une vérification stricte (`verifierBaseDeDonneesTest`) en phase d'initialisation (`beforeAll`). Son exécution est systématiquement avortée si le système détecte une connexion vers l'environnement de développement ou de production, préservant ainsi la base de données principale de toute pollution par des données fictives.
- **Transactions** : La création des commandes repose sur des transactions Prisma (`$transaction`) garantissant qu'en cas d'échec (ex: stock insuffisant), aucune ligne orpheline ne soit insérée.
