import { Request, Response } from 'express';
import { RequeteAuthentifiee } from '../middlewares/auth.middleware';
import { CreerCommandeDTO } from '../types/commande.types';
import { StatutCommande } from '@prisma/client';
import { 
  creerCommande, 
  obtenirCommandesUtilisateur, 
  obtenirCommandeParCode,
  obtenirToutesLesCommandes,
  mettreAJourStatutCommande,
  ErreurValidationCommande
} from '../services/commandes.service';

export const creerNouvelleCommande = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const data: CreerCommandeDTO = req.body;

    if (req.utilisateur && req.utilisateur.id) {
      data.utilisateur_id = req.utilisateur.id;
    }

    if (!data.email_client || !data.nom_client || !data.adresse_livraison) {
      return res.status(400).json({ message: 'Email, nom et adresse de livraison sont requis.' });
    }

    const commande = await creerCommande(data);
    res.status(201).json(commande);
  } catch (error: any) {
    if (error instanceof ErreurValidationCommande) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

export const listerMesCommandes = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const utilisateur_id = req.utilisateur?.id;
    if (!utilisateur_id) {
      return res.status(401).json({ message: 'Non autorisé.' });
    }

    const commandes = await obtenirCommandesUtilisateur(utilisateur_id);
    res.status(200).json(commandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

export const suivreCommandeInvite = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { code_confirmation, email_client } = req.body;

    if (!code_confirmation || !email_client) {
      return res.status(400).json({ message: 'Code de confirmation et email requis.' });
    }

    const commande = await obtenirCommandeParCode(code_confirmation, email_client);
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable avec ces identifiants.' });
    }

    res.status(200).json(commande);
  } catch (error) {
    console.error('Erreur lors du suivi de commande:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

export const listerToutesLesCommandes = async (req: Request, res: Response) => {
  try {
    const commandes = await obtenirToutesLesCommandes();
    res.status(200).json(commandes);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
  }
};

export const mettreAJourStatut = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { statut } = req.body;

    if (!statut || !Object.values(StatutCommande).includes(statut as StatutCommande)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const commande = await mettreAJourStatutCommande(id, statut as StatutCommande);
    res.status(200).json(commande);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.' });
  }
};
