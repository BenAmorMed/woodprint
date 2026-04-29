import { Request, Response } from 'express';
import * as diffusionService from '../services/diffusion.service';

/**
 * Inscrire un email à la newsletter (Public)
 */
export const inscriptionNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    const abonne = await diffusionService.sInscrire(email.trim().toLowerCase());
    res.status(201).json({ message: 'Inscription réussie', abonne });
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', erreur: erreur.message });
  }
};

/**
 * Désinscrire un email de la newsletter (Public)
 */
export const desinscriptionNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Adresse email requise.' });
    }

    await diffusionService.seDesinscrire(email.trim().toLowerCase());
    res.status(200).json({ message: 'Désinscription effectuée avec succès.' });
  } catch (erreur: any) {
    if (erreur.message.includes('pas inscrit')) {
      return res.status(404).json({ message: erreur.message });
    }
    res.status(500).json({ message: 'Erreur lors de la désinscription', erreur: erreur.message });
  }
};

/**
 * Lister les abonnés actifs (Admin)
 */
export const listerAbonnes = async (req: Request, res: Response) => {
  try {
    const abonnes = await diffusionService.obtenirAbonnesActifs();
    res.status(200).json(abonnes);
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des abonnés', erreur: erreur.message });
  }
};
