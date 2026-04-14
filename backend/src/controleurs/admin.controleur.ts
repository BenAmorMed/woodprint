import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { hacherMotDePasse } from '../utils/cryptage';
import { RequeteAuthentifiee } from '../middlewares/auth.middleware';

export const resetMotDePasseAdmin = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const demandeurId = req.utilisateur?.id;
    const roleDemandeur = req.utilisateur?.role;
    
    const { cibleUtilisateurId, nouveauMotDePasse } = req.body;

    // Seul le SUPER_ADMIN peut modifier le mot de passe d'un *autre* admin
    // L'ADMIN classique ne peut modifier que le sien
    if (roleDemandeur === 'ADMIN' && demandeurId !== cibleUtilisateurId) {
      return res.status(403).json({ message: 'Vous ne pouvez réinitialiser que votre propre mot de passe.' });
    }

    const motDePasseHache = await hacherMotDePasse(nouveauMotDePasse);

    await prisma.utilisateur.update({
      where: { id: cibleUtilisateurId },
      data: { mot_de_passe: motDePasseHache }
    });

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation.' });
  }
};

export const accorderPermission = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { cibleUtilisateurId, nomModule } = req.body;

    const moduleExistant = await prisma.moduleSysteme.findUnique({
      where: { nom: nomModule }
    });

    if (!moduleExistant) {
      return res.status(404).json({ message: 'Module système introuvable.' });
    }

    await prisma.permissionAdmin.create({
      data: {
        utilisateur_id: cibleUtilisateurId,
        module_id: moduleExistant.id
      }
    });

    res.status(200).json({ message: `Permission pour ${nomModule} accordée avec succès.` });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de l’allocation de la permission.' });
  }
};
