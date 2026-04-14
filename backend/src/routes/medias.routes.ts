import { Router } from 'express';
import { uploaderMedia, lireMedia } from '../controleurs/medias.controleur';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const routeur = Router();

// L'upload est restreint aux Administrateurs/Gestionnaires de ce module (ou super-admin)
// Dans une plateforme complète, on permettrait aussi aux clients d'uploader, 
// mais ici on suppose que c'est l'Admin qui upload les images du catalogue.
routeur.post('/upload', authMiddleware, rbacMiddleware('GESTION_PRODUITS'), uploadMiddleware.single('fichier'), uploaderMedia);

// La lecture des médias est publique pour que l'interface e-commerce puisse afficher les images
routeur.get('/:fichier', lireMedia);

export default routeur;
