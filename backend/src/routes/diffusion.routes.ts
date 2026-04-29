import { Router } from 'express';
import { inscriptionNewsletter, desinscriptionNewsletter, listerAbonnes } from '../controleurs/diffusion.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const router = Router();

// Routes publiques : Inscription / Désinscription
router.post('/inscription', inscriptionNewsletter);
router.post('/desinscription', desinscriptionNewsletter);

// Route RBAC Admin : Lister les abonnés actifs
router.get('/abonnes', authMiddleware, rbacMiddleware('GESTION_CLIENTS'), listerAbonnes);

export default router;
