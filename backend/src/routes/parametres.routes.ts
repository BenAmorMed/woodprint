import { Router } from 'express';
import { lireParametres, mettreAJourParametres } from '../controleurs/parametres.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const router = Router();

// Route publique : Lire les paramètres
router.get('/', lireParametres);

// Route RBAC Admin : Modifier les paramètres
router.put('/', authMiddleware, rbacMiddleware('GESTION_PARAMETRES'), mettreAJourParametres);

export default router;
