import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { RequeteAuthentifiee } from './auth.middleware';

export const rbacMiddleware = (nomModuleRequis: string) => {
  return async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const utilisateur = req.utilisateur;

      if (!utilisateur) {
        return res.status(401).json({ message: 'Authentification requise.' });
      }

      // Le SUPER_ADMIN l'emporte toujours
      if (utilisateur.role === 'SUPER_ADMIN') {
        return next();
      }

      // Les clients n'ont jamais accès aux modules d'administration
      if (utilisateur.role === 'CLIENT') {
        return res.status(403).json({ message: 'Accès interdit.' });
      }

      // Si c'est un ADMIN, on vérifie dynamiquement ses permissions
      const possedePermission = await prisma.permissionAdmin.findFirst({
        where: {
          utilisateur_id: utilisateur.id,
          module: {
            nom: nomModuleRequis
          }
        }
      });

      if (!possedePermission) {
        return res.status(403).json({ message: `Accès interdit. Permission système '${nomModuleRequis}' requise.` });
      }

      next();
    } catch (erreur) {
      console.error('Erreur RBAC:', erreur);
      res.status(500).json({ message: 'Erreur interne de validation des permissions.' });
    }
  };
};
