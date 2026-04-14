import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const creerCategorie = async (req: Request, res: Response) => {
  try {
    const { nom, categorie_parente_id } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const categorie = await prisma.categorie.create({
      data: {
        nom,
        categorie_parente_id: categorie_parente_id || null
      }
    });

    res.status(201).json(categorie);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
  }
};

export const obtenirCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categorie.findMany({
      where: { categorie_parente_id: null },
      include: {
        sous_categories: {
          include: {
            sous_categories: true
          }
        }
      }
    });

    res.status(200).json(categories);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
  }
};

export const modifierCategorie = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { nom, categorie_parente_id } = req.body;

    const categorie = await prisma.categorie.update({
      where: { id },
      data: { nom, categorie_parente_id }
    });

    res.status(200).json(categorie);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la modification de la catégorie. Vérifiez l\'ID.' });
  }
};

export const supprimerCategorie = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.categorie.delete({ where: { id } });
    res.status(200).json({ message: 'Catégorie supprimée avec succès.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};
