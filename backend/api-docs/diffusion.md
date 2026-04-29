# Documentation de l'API - Liste de Diffusion (Mailing List)

Module gérant la récolte d'adresses email à des fins de prospection et de newsletters. Il utilise une logique idempotente (sécurité contre les requêtes multiples).

## Base URL
`/api/v1/diffusion`

---

## 1. S'inscrire à la Newsletter

- **Méthode** : `POST`
- **Route** : `/inscription`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email": "client@example.com"
}
```

### Réponses
- **201 Created** : Nouvel abonnement.
- **200 OK** : L'email existait déjà et a été conservé/réactivé.
- **400 Bad Request** : Email malformé.

---

## 2. Se Désinscrire

- **Méthode** : `POST`
- **Route** : `/desinscription`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email": "client@example.com"
}
```

### Réponses
- **200 OK** : Désinscription réussie (soft delete, `actif` = false).
- **404 Not Found** : Cet email n'est pas dans la liste.

---

## 3. Lister les Abonnés (Admin)

- **Méthode** : `GET`
- **Route** : `/abonnes`
- **Accès** : Protégé (RBAC `GESTION_CLIENTS`)

### Réponses
- **200 OK** : Liste des emails actifs.
