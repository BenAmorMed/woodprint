# Documentation de l'API - Paramètres de Boutique

Gère la configuration globale du e-commerce sous forme de Singleton (enregistrement unique ID=1).

## Base URL
`/api/v1/parametres`

---

## 1. Lire les Paramètres

- **Méthode** : `GET`
- **Route** : `/`
- **Accès** : Public

### Réponses
- **200 OK**
```json
{
  "id": 1,
  "frais_livraison": "5.50",
  "seuil_livraison_gratuite": "100.00",
  "banniere_annonce": "Livraison gratuite à partir de 100€"
}
```

---

## 2. Modifier les Paramètres (Admin)

- **Méthode** : `PUT`
- **Route** : `/`
- **Accès** : Protégé (RBAC `GESTION_PARAMETRES`)

### Corps de la requête (JSON)
```json
{
  "frais_livraison": 6.00,
  "seuil_livraison_gratuite": 150.00,
  "banniere_annonce": "Nouvelle collection en ligne !"
}
```

### Réponses
- **200 OK** : Paramètres mis à jour.
