import { Request, Response } from 'express';
import { RequeteAuthentifiee } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import { hacherMotDePasse, verifierMotDePasse } from '../utils/cryptage';
import { genererToken } from '../utils/jwt';
import { emailReinitialisationPwd } from '../utils/mail';
import crypto from 'crypto';

export const inscription = async (req: Request, res: Response) => {
  try {
    const { nom, email, mot_de_passe } = req.body;

    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const motDePasseHache = await hacherMotDePasse(mot_de_passe);
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: motDePasseHache,
        role: 'CLIENT' // Un SuperAdmin ne peut pas être créé via cette route
      }
    });

    const token = genererToken({ id: utilisateur.id, role: utilisateur.role });
    res.status(201).json({ jeton: token, utilisateur: { id: utilisateur.id, nom, email, role: utilisateur.role } });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de l’inscription.' });
  }
};

export const connexion = async (req: Request, res: Response) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur || !utilisateur.mot_de_passe) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const valide = await verifierMotDePasse(mot_de_passe, utilisateur.mot_de_passe);
    if (!valide) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const token = genererToken({ id: utilisateur.id, role: utilisateur.role });
    res.status(200).json({ jeton: token, utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email, role: utilisateur.role } });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

export const demandeReinitialisationPwd = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    
    if (utilisateur) {
      const jetonBrut = crypto.randomBytes(32).toString('hex');
      const jetonHache = await hacherMotDePasse(jetonBrut); // On stocke une version hachée du token
      
      await prisma.utilisateur.update({
        where: { email },
        data: { jeton_reinitialisation: jetonHache }
      });
      
      await emailReinitialisationPwd(email, jetonBrut);
    }

    res.status(200).json({ message: 'Si l’email existe, un lien a été envoyé.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la demande.' });
  }
};

export const obtenirProfil = async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const id = req.utilisateur?.id;
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: { id: true, nom: true, email: true, role: true, date_creation: true }
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json(utilisateur);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
  }
};

export const reinitialiserMotDePasse = async (req: Request, res: Response) => {
  try {
    const { email, jeton, nouveauMotDePasse } = req.body;

    if (!email || !jeton || !nouveauMotDePasse) {
      return res.status(400).json({ message: 'Email, jeton et nouveau mot de passe requis.' });
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

    if (!utilisateur || !utilisateur.jeton_reinitialisation) {
      return res.status(400).json({ message: 'Jeton invalide ou expiré.' });
    }

    const valide = await verifierMotDePasse(jeton, utilisateur.jeton_reinitialisation);
    if (!valide) {
      return res.status(400).json({ message: 'Jeton invalide ou expiré.' });
    }

    const motDePasseHache = await hacherMotDePasse(nouveauMotDePasse);
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        mot_de_passe: motDePasseHache,
        jeton_reinitialisation: null
      }
    });

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la réinitialisation.' });
  }
};
