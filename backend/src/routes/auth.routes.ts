import { Router } from 'express';
import { inscription, connexion, demandeReinitialisationPwd, reinitialiserMotDePasse, obtenirProfil } from '../controleurs/auth.controleur';
import { authMiddleware } from '../middlewares/auth.middleware';
import { resetMotDePasseAdmin, accorderPermission } from '../controleurs/admin.controleur';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

const routeur = Router();

// Routes publiques
routeur.post('/inscription', inscription);
routeur.post('/connexion', connexion);
routeur.post('/reinitialisation-pwd', demandeReinitialisationPwd);
routeur.post('/reinitialiser-pwd', reinitialiserMotDePasse);

// Routes protégées CLIENT/ADMIN
routeur.get('/profil', authMiddleware, obtenirProfil);

// Routes protégées SUPER_ADMIN
routeur.post('/admin/reset-pwd', authMiddleware, resetMotDePasseAdmin);
routeur.post('/admin/permissions', authMiddleware, rbacMiddleware('GESTION_SYSTEME'), accorderPermission);

export default routeur;
