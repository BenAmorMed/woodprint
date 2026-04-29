# Documentation de l'API - Produits et Variantes

Ce module gère le catalogue e-commerce. Il implémente une architecture hybride :
- Les données structurelles (prix de base, catégorie) sont relationnelles.
- La structure de personnalisation (UI Builder) est gérée dynamiquement en JSONB (`schema_personnalisation`).

## Base URL (Produits)
`/api/v1/produits`

## Base URL (Variantes)
`/api/v1/produits/:produit_id/variantes`

---

## 1. Obtenir les Produits

Récupère la liste des produits actifs.

- **Méthode** : `GET`
- **Route** : `/`
- **Accès** : Public

### Paramètres de requête (Query)
- `categorie` (optionnel) : ID de la catégorie pour filtrer.
- `recherche` (optionnel) : Terme de recherche sur le titre.

### Réponses
- **200 OK** : Retourne un tableau de produits (incluant les variantes et la catégorie).

---

## 2. Obtenir un Produit par ID

- **Méthode** : `GET`
- **Route** : `/:id`
- **Accès** : Public

### Réponses
- **200 OK** : Retourne l'objet produit détaillé.
- **404 Not Found** : Produit introuvable.

---

## 3. Créer un Produit

- **Méthode** : `POST`
- **Route** : `/`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Corps de la requête (JSON)
```json
{
  "titre": "Tableau sur Toile",
  "prix_de_base": 25.00,
  "description": "Tableau premium",
  "categorie_id": "uuid-categorie",
  "images_produit": ["/uploads/image1.jpg"],
  "schema_personnalisation": [
    {
      "id": "champ_texte_1",
      "nom": "Votre Prénom",
      "type": "texte",
      "requis": true
    },
    {
      "id": "champ_image_1",
      "nom": "Photo de couverture",
      "type": "image",
      "requis": false
    }
  ],
  "actif": true
}
```

### Réponses
- **201 Created** : Produit créé avec succès.
- **400 Bad Request** : Erreur de validation (ex: schéma de personnalisation invalide).

---

## 4. Modifier un Produit

- **Méthode** : `PUT`
- **Route** : `/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Réponses
- **200 OK** : Produit mis à jour.
- **404 Not Found** : Produit introuvable.

---

## 5. Supprimer un Produit

- **Méthode** : `DELETE`
- **Route** : `/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Réponses
- **204 No Content** : Suppression réussie.

---

## 6. Créer une Variante de Produit

Ajoute une variante (ex: Taille XL, Couleur Bleu) liée à un produit spécifique.

- **Méthode** : `POST`
- **Route** : `/api/v1/produits/:produit_id/variantes`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Corps de la requête (JSON)
```json
{
  "sku": "TAB-TOILE-XL",
  "attributs": {
    "taille": "XL",
    "cadre": "Bois"
  },
  "modificateur_prix": 15.00,
  "stock": 50
}
```

### Réponses
- **201 Created** : Variante créée.
- **400 Bad Request** : Données invalides ou SKU déjà utilisé.

---

## 7. Modifier une Variante

- **Méthode** : `PUT`
- **Route** : `/api/v1/produits/:produit_id/variantes/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Réponses
- **200 OK** : Variante mise à jour.

---

## 8. Supprimer une Variante

- **Méthode** : `DELETE`
- **Route** : `/api/v1/produits/:produit_id/variantes/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Réponses
- **204 No Content** : Suppression réussie.
