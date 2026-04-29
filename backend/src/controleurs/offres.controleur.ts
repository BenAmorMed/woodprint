import { Request, Response } from 'express';
import * as offresService from '../services/offres.service';

/**
 * Créer une offre (Admin)
 */
export const creerOffre = async (req: Request, res: Response) => {
  try {
    const offre = await offresService.creerOffre(req.body);
    res.status(201).json({ message: 'Offre créée avec succès', offre });
  } catch (erreur: any) {
    if (erreur.message.includes('pourcentage de remise') || erreur.message.includes('date de fin')) {
      return res.status(400).json({ message: erreur.message });
    }
    res.status(500).json({ message: 'Erreur lors de la création de l\'offre', erreur: erreur.message });
  }
};

/**
 * Lire les offres actives (Public)
 */
export const lireOffresActives = async (req: Request, res: Response) => {
  try {
    const offres = await offresService.obtenirOffresActives();
    res.status(200).json(offres);
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des offres', erreur: erreur.message });
  }
};

/**
 * Lire toutes les offres (Admin)
 */
export const lireToutesOffres = async (req: Request, res: Response) => {
  try {
    const offres = await offresService.obtenirToutesOffres();
    res.status(200).json(offres);
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des offres', erreur: erreur.message });
  }
};

/**
 * Modifier une offre (Admin)
 */
export const modifierOffre = async (req: Request, res: Response) => {
  try {
    const offreId = req.params.id as string;
    const offre = await offresService.modifierOffre(offreId, req.body);
    res.status(200).json({ message: 'Offre modifiée avec succès', offre });
  } catch (erreur: any) {
    if (erreur.message === 'Offre non trouvée.') {
      return res.status(404).json({ message: erreur.message });
    }
    if (erreur.message.includes('pourcentage de remise') || erreur.message.includes('date de fin')) {
      return res.status(400).json({ message: erreur.message });
    }
    res.status(500).json({ message: 'Erreur lors de la modification de l\'offre', erreur: erreur.message });
  }
};

/**
 * Supprimer une offre (Admin)
 */
export const supprimerOffre = async (req: Request, res: Response) => {
  try {
    const offreId = req.params.id as string;
    await offresService.supprimerOffre(offreId);
    res.status(200).json({ message: 'Offre supprimée avec succès' });
  } catch (erreur: any) {
    if (erreur.message === 'Offre non trouvée.') {
      return res.status(404).json({ message: erreur.message });
    }
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'offre', erreur: erreur.message });
  }
};
