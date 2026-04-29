# Documentation de l'API - Commandes

Ce module gère la création de commandes (pour invités et utilisateurs connectés), l'historique et le suivi, ainsi que l'administration complète. Les réponses de l'utilisateur à la personnalisation du produit sont strictement validées ici.

## Base URL
`/api/v1/commandes`

---

## 1. Créer une Commande

Crée une commande. Supporte les invités (génération d'un code de confirmation) et les utilisateurs connectés. Les personnalisations sont validées contre le schéma JSONB du produit.

- **Méthode** : `POST`
- **Route** : `/`
- **Accès** : Public (Authentification optionnelle)

### Corps de la requête (JSON)
```json
{
  "email_client": "client@example.com",
  "nom_client": "Jane Doe",
  "adresse_livraison": {
    "rue": "123 Rue de Paris",
    "ville": "Paris",
    "code_postal": "75000"
  },
  "lignes": [
    {
      "variante_produit_id": "uuid-variante",
      "quantite": 2,
      "personnalisations_utilisateur": {
        "champ_texte_1": "Joyeux Anniversaire"
      }
    }
  ]
}
```

### Réponses
- **201 Created**
```json
{
  "id": "uuid-...",
  "code_confirmation": "A1B2C3D4",
  "statut": "EN_ATTENTE",
  "montant_total": "50.00",
  "lignes": [ ... ]
}
```
- **400 Bad Request** : Quantité invalide, stock insuffisant, personnalisations invalides.

---

## 2. Lister mes Commandes

Récupère l'historique des commandes d'un utilisateur connecté.

- **Méthode** : `GET`
- **Route** : `/mes-commandes`
- **Accès** : Protégé (Authentification requise)

### Réponses
- **200 OK** : Tableau des commandes de l'utilisateur.

---

## 3. Suivre une Commande (Invité)

Permet à un utilisateur sans compte de consulter le statut de sa commande à l'aide de son email et de son code secret.

- **Méthode** : `POST`
- **Route** : `/suivi-invite`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email_client": "client@example.com",
  "code_confirmation": "A1B2C3D4"
}
```

### Réponses
- **200 OK** : Détails de la commande.
- **404 Not Found** : Commande introuvable avec ces identifiants.

---

## 4. Lister Toutes les Commandes (Admin)

Vue globale sur l'ensemble des commandes du système.

- **Méthode** : `GET`
- **Route** : `/admin/toutes`
- **Accès** : Protégé (RBAC `GESTION_COMMANDES`)

### Réponses
- **200 OK** : Tableau complet de toutes les commandes.

---

## 5. Mettre à Jour le Statut (Admin)

Modifie le cycle de vie de la commande (`EN_ATTENTE`, `EN_COURS_DE_TRAITEMENT`, `EXPEDIEE`, `LIVREE`, `ANNULEE`).

- **Méthode** : `PUT`
- **Route** : `/admin/:id/statut`
- **Accès** : Protégé (RBAC `GESTION_COMMANDES`)

### Corps de la requête (JSON)
```json
{
  "statut": "LIVREE"
}
```

### Réponses
- **200 OK** : Commande mise à jour.
- **400 Bad Request** : Statut invalide.
