import { Request, Response } from 'express';
import * as parametresService from '../services/parametres.service';

/**
 * Lire les paramètres (Route Publique)
 */
export const lireParametres = async (req: Request, res: Response) => {
  try {
    const parametres = await parametresService.obtenirParametres();
    res.status(200).json(parametres);
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des paramètres', erreur: erreur.message });
  }
};

/**
 * Mettre à jour les paramètres (Route RBAC)
 */
export const mettreAJourParametres = async (req: Request, res: Response) => {
  try {
    const { frais_livraison, seuil_livraison_gratuite, banniere_annonce } = req.body;
    
    // We parse and pass the valid fields
    const parametresMisAJour = await parametresService.modifierParametres({
      frais_livraison: frais_livraison !== undefined ? Number(frais_livraison) : undefined,
      seuil_livraison_gratuite: seuil_livraison_gratuite !== undefined ? Number(seuil_livraison_gratuite) : undefined,
      banniere_annonce: banniere_annonce !== undefined ? banniere_annonce : undefined
    });

    res.status(200).json({ message: 'Paramètres mis à jour avec succès', parametres: parametresMisAJour });
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres', erreur: erreur.message });
  }
};
