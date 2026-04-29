import { Router } from 'express';
import { 
  creerNouvelleCommande, 
  listerMesCommandes, 
  suivreCommandeInvite 
} from '../controleurs/commandes.controleur';
import { authMiddleware, authOptionnelMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Créer une commande (invité ou connecté)
router.post('/', authOptionnelMiddleware, creerNouvelleCommande);

// Lister les commandes d'un utilisateur connecté
router.get('/mes-commandes', authMiddleware, listerMesCommandes);

// Suivre une commande en tant qu'invité
router.post('/suivi-invite', suivreCommandeInvite);

export default router;
