import { Request, Response } from 'express';
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

    // Toujours retourner 200 pour éviter l'énumération des emails
    res.status(200).json({ message: 'Si l’email existe, un lien a été envoyé.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la demande.' });
  }
};
