import { Router } from 'express';
import { soumettreAvis, listerAvisProduit, repondreAvis } from '../controleurs/avis.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const router = Router();

// Route publique : Consulter les avis d'un produit (montée de façon globale ou avec un paramètre explicit, mais ici on attend un produit_id dans le body ou via params selon le design. Dans le contrôleur, listerAvisProduit attend `req.params.produitId`)
router.get('/produits/:produitId/avis', listerAvisProduit);

// Route protégée : Soumettre un avis (doit être connecté)
router.post('/', authMiddleware, soumettreAvis);

// Route RBAC Admin : Répondre à un avis
router.put('/admin/:avisId/reponse', authMiddleware, rbacMiddleware('GESTION_AVIS'), repondreAvis);

export default router;
