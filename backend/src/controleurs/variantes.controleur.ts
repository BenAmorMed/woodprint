import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const creerVariante = async (req: Request, res: Response) => {
  try {
    const produit_id = req.params.produit_id as string;
    const { sku, attributs, modificateur_prix, stock } = req.body;

    if (!sku || !attributs) {
      return res.status(400).json({ message: 'SKU et attributs sont requis.' });
    }

    const variante = await prisma.varianteProduit.create({
      data: {
        produit_id,
        sku,
        attributs,
        modificateur_prix: modificateur_prix || 0.0,
        stock: stock || 0
      }
    });

    res.status(201).json(variante);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la création de la variante. Vérifiez le SKU unique.' });
  }
};

export const modifierVariante = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { sku, attributs, modificateur_prix, stock } = req.body;

    const variante = await prisma.varianteProduit.update({
      where: { id },
      data: { sku, attributs, modificateur_prix, stock }
    });

    res.status(200).json(variante);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la modification de la variante.' });
  }
};

export const supprimerVariante = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.varianteProduit.delete({ where: { id } });
    res.status(200).json({ message: 'Variante supprimée avec succès.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la variante.' });
  }
};
