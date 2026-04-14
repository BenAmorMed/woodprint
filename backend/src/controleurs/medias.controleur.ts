import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const DOSSIER_UPLOADS = path.join(process.cwd(), 'uploads');

export const uploaderMedia = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni ou format incorrect.' });
    }

    const nomFichier = req.file.filename;
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:50002';
    const urlMedia = `${baseUrl}/api/v1/medias/${nomFichier}`;

    res.status(201).json({
      message: 'Média téléversé avec succès.',
      url: urlMedia,
      nomFichier: nomFichier
    });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors du traitement du fichier.' });
  }
};

export const lireMedia = async (req: Request, res: Response) => {
  try {
    const nomFichier = req.params.fichier as string;

    if (!/^[0-9a-fA-F-]+(\.png|\.jpg|\.jpeg|\.webp)$/.test(nomFichier)) {
      return res.status(404).send('Cannot GET /api/v1/medias/' + nomFichier);
    }

    const cheminAbsolu = path.join(DOSSIER_UPLOADS, nomFichier);

    if (!cheminAbsolu.startsWith(DOSSIER_UPLOADS)) {
      return res.status(404).send('Cannot GET /api/v1/medias/' + nomFichier);
    }

    if (!fs.existsSync(cheminAbsolu)) {
      return res.status(404).send('Cannot GET /api/v1/medias/' + nomFichier);
    }

    res.sendFile(cheminAbsolu);
  } catch (erreur) {
    return res.status(404).send('Cannot GET /api/v1/medias/' + req.params.fichier);
  }
};
