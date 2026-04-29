import { Request, Response } from 'express';
import { RequeteAuthentifiee } from '../middlewares/auth.middleware';
import * as avisService from '../services/avis.service';

/**
 * Soumettre un nouvel avis pour un produit
 */
export const soumettreAvis = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { produit_id, note, commentaire, urls_media } = req.body;
    const utilisateur_id = req.utilisateur?.id;

    if (!utilisateur_id) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    if (!produit_id || !note) {
      return res.status(400).json({ message: 'L\'ID du produit et la note sont requis.' });
    }

    const nouvelAvis = await avisService.creerAvis(
      utilisateur_id,
      produit_id,
      note,
      commentaire,
      urls_media
    );

    res.status(201).json({ message: 'Avis soumis avec succès', avis: nouvelAvis });
  } catch (erreur: any) {
    if (erreur.message === 'Vous avez déjà laissé un avis pour ce produit.') {
        return res.status(400).json({ message: erreur.message });
    }
    if (erreur.message === 'La note doit être comprise entre 1 et 5.') {
        return res.status(400).json({ message: erreur.message });
    }
    // Gating rule enforcement returns 403 Forbidden
    if (erreur.message === "Vous ne pouvez évaluer ce produit que si vous l'avez acheté et que votre commande a été livrée.") {
        return res.status(403).json({ message: erreur.message });
    }
    
    res.status(500).json({ message: 'Erreur lors de la soumission de l\'avis', erreur: erreur.message });
  }
};

/**
 * Récupérer les avis publics pour un produit spécifique
 */
export const listerAvisProduit = async (req: Request, res: Response) => {
  try {
    const { produitId } = req.params;
    
    if (!produitId) {
      return res.status(400).json({ message: 'L\'ID du produit est requis.' });
    }

    const avis = await avisService.obtenirAvisParProduit(produitId);
    res.status(200).json(avis);
  } catch (erreur: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des avis', erreur: erreur.message });
  }
};

/**
 * Permettre à un administrateur de répondre à un avis
 */
export const repondreAvis = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { avisId } = req.params;
    const { reponse_admin } = req.body;

    if (!avisId || !reponse_admin) {
      return res.status(400).json({ message: 'L\'ID de l\'avis et la réponse sont requis.' });
    }

    const avisMisAJour = await avisService.ajouterReponseAdmin(avisId, reponse_admin);
    res.status(200).json({ message: 'Réponse ajoutée avec succès', avis: avisMisAJour });
  } catch (erreur: any) {
    if (erreur.message === 'Avis non trouvé.') {
        return res.status(404).json({ message: erreur.message });
    }
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la réponse', erreur: erreur.message });
  }
};
