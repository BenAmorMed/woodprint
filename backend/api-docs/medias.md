# Documentation de l'API - Médias

Module responsable du téléchargement sécurisé des fichiers image sur le serveur et de leur exposition statique.

## Base URL
`/api/v1/medias`

---

## 1. Télécharger un Média (Upload)

Stocke l'image localement via `multer`. Filtre les extensions (JPG, PNG, WEBP). Limite de taille à 5MB.

- **Méthode** : `POST`
- **Route** : `/upload`
- **Accès** : Protégé (RBAC `GESTION_PRODUITS`)
- **Content-Type** : `multipart/form-data`

### Corps de la requête (Form-Data)
- `fichier` : Fichier binaire de l'image.

### Réponses
- **200 OK**
```json
{
  "message": "Fichier téléchargé avec succès.",
  "url": "/api/v1/medias/1715693021943-photo.jpg"
}
```
- **400 Bad Request** : Fichier manquant ou type non supporté.

---

## 2. Lire un Média

Route proxy permettant au frontend d'accéder aux images avec prévention de la faille de Path Traversal.

- **Méthode** : `GET`
- **Route** : `/:fichier`
- **Accès** : Public

### Réponses
- **200 OK** : Renvoie le flux de données de l'image.
- **400 Bad Request** : Nom de fichier invalide (tentative de traversal `../`).
- **404 Not Found** : L'image n'existe pas.
