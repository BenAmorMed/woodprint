# Documentation de Test : Validation Métier (validation.test.ts)

## Cible du Test
Ce fichier de test unitaire garantit la robustesse du moteur de validation (`validation.service.ts`), composant névralgique de l'architecture hybride du projet WoodPrint. Il assure que les données entrantes (les réponses du client) correspondent mathématiquement et logiquement au `schema_personnalisation` défini par l'administrateur.

## Scénarios Métier (Cas Passants et Non Passants)
1. **Scénario 1 : Configuration Valide** :
   - Validation complète d'un objet contenant de multiples types (image, texte, select, coordonnées) respectant scrupuleusement les contraintes du schéma d'origine. Renvoie `true`.
2. **Scénario 2 : Contrainte d'Énumération (Select)** :
   - Rejet formel (`false`) lorsqu'une valeur fournie pour un champ de type `select` ne figure pas dans le tableau d'options strictes dicté par le schéma.
3. **Scénario 3 : Injection ou Falsification de Type** :
   - Rejet formel (`false`) si l'intégrité du type est compromise. Par exemple, l'injection d'une chaîne de caractères simple dans un champ devant impérativement recevoir un objet de coordonnées (`{x, y}`).
4. **Scénario 4 : Gestion des Champs Optionnels** :
   - Acceptation (`true`) lorsqu'un utilisateur omet volontairement une personnalisation dont le flag `requis` est positionné sur `false`.

## Considérations Conceptuelles
- Ce module est volontairement isolé des contrôleurs afin de permettre des tests unitaires purs et synchrones, sans aucune dépendance à Express.js, Prisma ou à la base de données. Il garantit que l'entrée des données JSONB respecte les standards avant toute interaction avec la couche de persistance.
