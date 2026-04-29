# Documentation de l'API - Avis

Ce module gère les retours clients concernant les produits. Le système implémente une porte logique (Delivery-Gating) : un utilisateur ne peut laisser un avis que s'il a commandé le produit et que sa commande est marquée comme `LIVREE`.

## Base URL
`/api/v1/avis`

---

## 1. Consulter les Avis d'un Produit

Récupère publiquement les avis associés à un produit.

- **Méthode** : `GET`
- **Route** : `/produits/:produitId`
- **Accès** : Public

### Réponses
- **200 OK**
```json
[
  {
    "id": "uuid-...",
    "note": 5,
    "commentaire": "Super qualité !",
    "reponse_admin": "Merci beaucoup !",
    "utilisateur": {
      "nom": "Jane Doe"
    }
  }
]
```

---

## 2. Soumettre un Avis

Permet de noter un produit (1 à 5). L'utilisateur doit être connecté.

- **Méthode** : `POST`
- **Route** : `/`
- **Accès** : Protégé (Authentification requise)

### Corps de la requête (JSON)
```json
{
  "produit_id": "uuid-produit",
  "note": 4,
  "commentaire": "Joli rendu, mais livraison un peu longue.",
  "urls_media": ["/uploads/review_img1.jpg"]
}
```

### Réponses
- **201 Created** : Avis enregistré.
- **400 Bad Request** : Note invalide, ou l'utilisateur a déjà laissé un avis.
- **403 Forbidden** : L'utilisateur n'a pas de commande `LIVREE` pour ce produit.

---

## 3. Répondre à un Avis (Admin)

Permet à l'équipe de la boutique d'ajouter une réponse officielle (service client).

- **Méthode** : `PUT`
- **Route** : `/admin/:avisId/reponse`
- **Accès** : Protégé (RBAC `GESTION_AVIS`)

### Corps de la requête (JSON)
```json
{
  "reponse_admin": "Nous sommes ravis que cela vous plaise ! À très bientôt."
}
```

### Réponses
- **200 OK** : Avis mis à jour.
- **404 Not Found** : Avis introuvable.
