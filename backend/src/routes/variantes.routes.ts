import { Router } from 'express';
import { creerVariante, modifierVariante, supprimerVariante } from '../controleurs/variantes.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

// Par convention, cela devrait s'attacher via le router des produits : /produits/:produit_id/variantes
const routeur = Router({ mergeParams: true });

// Routes protégées
routeur.use(authMiddleware);
routeur.use(rbacMiddleware('GESTION_PRODUITS'));

routeur.post('/', creerVariante);
routeur.put('/:id', modifierVariante);
routeur.delete('/:id', supprimerVariante);

export default routeur;
