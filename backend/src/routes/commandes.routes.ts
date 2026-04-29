import { Router } from 'express';
import { 
  creerNouvelleCommande, 
  listerMesCommandes, 
  suivreCommandeInvite,
  listerToutesLesCommandes,
  mettreAJourStatut
} from '../controleurs/commandes.controleur';
import { authMiddleware, authOptionnelMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const router = Router();

// Créer une commande (invité ou connecté)
router.post('/', authOptionnelMiddleware, creerNouvelleCommande);

// Lister les commandes d'un utilisateur connecté
router.get('/mes-commandes', authMiddleware, listerMesCommandes);

// Suivre une commande en tant qu'invité
router.post('/suivi-invite', suivreCommandeInvite);

// Routes protégées ADMIN/SUPER_ADMIN
router.get('/admin/toutes', authMiddleware, rbacMiddleware('GESTION_COMMANDES'), listerToutesLesCommandes);
router.put('/admin/:id/statut', authMiddleware, rbacMiddleware('GESTION_COMMANDES'), mettreAJourStatut);

export default router;
