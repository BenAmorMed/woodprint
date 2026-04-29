# Documentation de l'API - Offres et Promotions

Ce module permet de gérer des campagnes publicitaires ciblées.

## Base URL
`/api/v1/offres`

---

## 1. Lire les Offres Actives

Affiche uniquement les offres en cours (date actuelle comprise entre `date_debut` et `date_fin`, et `actif` est à vrai).

- **Méthode** : `GET`
- **Route** : `/`
- **Accès** : Public

### Réponses
- **200 OK** : Tableau d'offres promotionnelles (sans les offres expirées).

---

## 2. Lire Toutes les Offres (Admin)

Affiche tout l'historique des campagnes marketing.

- **Méthode** : `GET`
- **Route** : `/toutes`
- **Accès** : Protégé (RBAC `GESTION_OFFRES`)

### Réponses
- **200 OK** : Historique complet.

---

## 3. Créer une Offre (Admin)

- **Méthode** : `POST`
- **Route** : `/`
- **Accès** : Protégé (RBAC `GESTION_OFFRES`)

### Corps de la requête (JSON)
```json
{
  "titre": "Soldes d'été",
  "description": "-20% sur la gamme bois",
  "image_banniere": "/uploads/banniere_ete.jpg",
  "date_debut": "2026-06-01T00:00:00.000Z",
  "date_fin": "2026-06-30T23:59:59.000Z",
  "actif": true,
  "produits_cibles": ["uuid-produit-1", "uuid-produit-2"]
}
```

### Réponses
- **201 Created** : Offre ajoutée.
- **400 Bad Request** : Date de fin antérieure à la date de début.

---

## 4. Modifier / Supprimer une Offre (Admin)

- **Modification** : `PUT /:id`
- **Suppression** : `DELETE /:id`
- **Accès** : Protégé (RBAC `GESTION_OFFRES`)
