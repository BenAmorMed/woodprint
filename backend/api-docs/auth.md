# Documentation de l'API - Authentification & Profil

Ce module gère l'inscription, la connexion, la récupération de mot de passe, l'accès au profil ainsi que les accès administratifs via RBAC (Role-Based Access Control).

## Base URL
`/api/v1/auth`

---

## 1. Inscription Utilisateur

Permet à un utilisateur (Client) de créer un compte. S'il a effectué des commandes "invité" au préalable avec cet email, elles seront réconciliées avec ce nouveau compte.

- **Méthode** : `POST`
- **Route** : `/inscription`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "nom": "John Doe",
  "email": "john.doe@example.com",
  "mot_de_passe": "MotDePasseSecurise123!"
}
```

### Réponses
- **201 Created**
```json
{
  "jeton": "eyJhbGciOiJIUzI...",
  "utilisateur": {
    "id": "uuid-...",
    "nom": "John Doe",
    "email": "john.doe@example.com",
    "role": "CLIENT"
  }
}
```
- **400 Bad Request** : Cet email est déjà utilisé.
- **500 Internal Server Error** : Erreur lors de l'inscription.

---

## 2. Connexion

Permet de s'authentifier et de récupérer un jeton JWT.

- **Méthode** : `POST`
- **Route** : `/connexion`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email": "john.doe@example.com",
  "mot_de_passe": "MotDePasseSecurise123!"
}
```

### Réponses
- **200 OK** : Retourne le jeton JWT.
- **400 Bad Request** : Identifiants invalides.

---

## 3. Demande de Réinitialisation de Mot de Passe

Génère un jeton sécurisé et envoie un email avec un lien de réinitialisation.

- **Méthode** : `POST`
- **Route** : `/reinitialisation-pwd`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email": "john.doe@example.com"
}
```

### Réponses
- **200 OK** : Si l'email existe, un lien a été envoyé. (Ne confirme jamais publiquement si l'email existe en base pour des raisons de sécurité).

---

## 4. Réinitialisation de Mot de Passe

Consomme le jeton de réinitialisation pour définir un nouveau mot de passe.

- **Méthode** : `POST`
- **Route** : `/reinitialiser-pwd`
- **Accès** : Public

### Corps de la requête (JSON)
```json
{
  "email": "john.doe@example.com",
  "jeton": "token_fourni_par_email",
  "nouveauMotDePasse": "NouveauMotDePasse456!"
}
```

### Réponses
- **200 OK** : Mot de passe réinitialisé avec succès.
- **400 Bad Request** : Jeton invalide ou expiré, ou paramètres manquants.

---

## 5. Obtenir Profil Utilisateur

Récupère les informations du compte de l'utilisateur connecté.

- **Méthode** : `GET`
- **Route** : `/profil`
- **Accès** : Protégé (Authentification `Bearer Token` requise)

### Réponses
- **200 OK**
```json
{
  "id": "uuid-...",
  "nom": "John Doe",
  "email": "john.doe@example.com",
  "role": "CLIENT",
  "date_creation": "2026-04-29T10:00:00.000Z"
}
```
- **401 Unauthorized** : Jeton manquant ou expiré.

---

## 6. Réinitialisation Mot de Passe Administrateur

Permet à un administrateur de changer son propre mot de passe, ou à un Super Administrateur de changer le mot de passe d'un autre utilisateur.

- **Méthode** : `POST`
- **Route** : `/admin/reset-pwd`
- **Accès** : Protégé (Authentification requise)

### Corps de la requête (JSON)
```json
{
  "cibleUtilisateurId": "uuid-de-la-cible",
  "nouveauMotDePasse": "NouveauAdminPass1!"
}
```

### Réponses
- **200 OK** : Mot de passe mis à jour avec succès.
- **403 Forbidden** : Vous ne pouvez réinitialiser que votre propre mot de passe (si non SuperAdmin).

---

## 7. Accorder une Permission (SuperAdmin)

Permet d'attribuer une permission système (ex: `GESTION_PRODUITS`) à un administrateur.

- **Méthode** : `POST`
- **Route** : `/admin/permissions`
- **Accès** : Protégé (RBAC `GESTION_SYSTEME`)

### Corps de la requête (JSON)
```json
{
  "cibleUtilisateurId": "uuid-de-ladministrateur",
  "nomModule": "GESTION_COMMANDES"
}
```

### Réponses
- **200 OK** : Permission accordée avec succès.
- **403 Forbidden** : Accès refusé (non SuperAdmin).
- **404 Not Found** : Module système introuvable.
