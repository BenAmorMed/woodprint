import { Router } from 'express';
import { creerCategorie, obtenirCategories, modifierCategorie, supprimerCategorie } from '../controleurs/categories.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const routeur = Router();

// Routes publiques
routeur.get('/', obtenirCategories);

// Routes protégées GESTION_PRODUITS
routeur.use(authMiddleware);
routeur.use(rbacMiddleware('GESTION_PRODUITS'));

routeur.post('/', creerCategorie);
routeur.put('/:id', modifierCategorie);
routeur.delete('/:id', supprimerCategorie);

export default routeur;
