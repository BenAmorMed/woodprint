import { Router } from 'express';
import { creerProduit, obtenirProduits, obtenirProduitParId, modifierProduit, supprimerProduit } from '../controleurs/produits.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const routeur = Router();

// Routes publiques
routeur.get('/', obtenirProduits);
routeur.get('/:id', obtenirProduitParId);

// Routes protégées
routeur.use(authMiddleware);
routeur.use(rbacMiddleware('GESTION_PRODUITS'));

routeur.post('/', creerProduit);
routeur.put('/:id', modifierProduit);
routeur.delete('/:id', supprimerProduit);

export default routeur;
