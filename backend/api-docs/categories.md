# Documentation de l'API - Catégories

Ce module gère l'arborescence des catégories de produits. L'architecture permet des sous-catégories infinies (auto-référentielles).

## Base URL
`/api/v1/categories`

---

## 1. Obtenir les Catégories

Récupère l'arborescence complète des catégories.

- **Méthode** : `GET`
- **Route** : `/`
- **Accès** : Public

### Réponses
- **200 OK**
```json
[
  {
    "id": "uuid-...",
    "nom": "Tableaux",
    "categorie_parente_id": null,
    "sous_categories": [
      {
        "id": "uuid-...",
        "nom": "Tableaux Modernes",
        "categorie_parente_id": "uuid-parent"
      }
    ]
  }
]
```

---

## 2. Créer une Catégorie

Crée une nouvelle catégorie. Peut inclure un ID parent pour créer une sous-catégorie.

- **Méthode** : `POST`
- **Route** : `/`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Corps de la requête (JSON)
```json
{
  "nom": "Mugs Personnalisés",
  "categorie_parente_id": null
}
```

### Réponses
- **201 Created** : Catégorie créée.
- **400 Bad Request** : Le nom de la catégorie est requis.
- **403 Forbidden** : Permission `GESTION_PRODUITS` requise.

---

## 3. Modifier une Catégorie

Modifie le nom ou le parent d'une catégorie existante.

- **Méthode** : `PUT`
- **Route** : `/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Corps de la requête (JSON)
```json
{
  "nom": "Mugs en Céramique",
  "categorie_parente_id": "uuid-autre-categorie"
}
```

### Réponses
- **200 OK** : Catégorie modifiée.
- **404 Not Found** : Catégorie introuvable.

---

## 4. Supprimer une Catégorie

Supprime une catégorie. Les produits associés peuvent être affectés.

- **Méthode** : `DELETE`
- **Route** : `/:id`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)

### Réponses
- **204 No Content** : Suppression réussie.
- **404 Not Found** : Catégorie introuvable.
