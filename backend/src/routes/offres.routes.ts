import { Router } from 'express';
import { 
  creerOffre, 
  lireOffresActives, 
  lireToutesOffres, 
  modifierOffre, 
  supprimerOffre 
} from '../controleurs/offres.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const router = Router();

// Route publique : Lire les offres actives
router.get('/', lireOffresActives);

// Routes RBAC Admin : Gestion des offres
router.use(authMiddleware);
router.use(rbacMiddleware('GESTION_OFFRES'));

router.post('/', creerOffre);
router.get('/toutes', lireToutesOffres);
router.put('/:id', modifierOffre);
router.delete('/:id', supprimerOffre);

export default router;
