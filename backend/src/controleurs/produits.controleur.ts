import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { SchemaPersonnalisation } from '../types/produit.types';

const validerSchemaPersonnalisation = (schema: any): boolean => {
  if (!Array.isArray(schema)) return false;
  
  const typesAutorises = ['texte', 'image', 'coordonnees', 'select', 'nombre'];
  
  for (const champ of schema) {
    if (!champ.id || typeof champ.id !== 'string') return false;
    if (!champ.nom || typeof champ.nom !== 'string') return false;
    if (!typesAutorises.includes(champ.type)) return false;
    if (typeof champ.requis !== 'boolean') return false;
    
    if (champ.type === 'select') {
      if (!Array.isArray(champ.options) || !champ.options.every((opt: any) => typeof opt === 'string')) {
        return false;
      }
    }
  }
  return true;
};

export const creerProduit = async (req: Request, res: Response) => {
  try {
    const { titre, prix_de_base, description, categorie_id, images_produit, schema_personnalisation } = req.body;

    if (!titre || prix_de_base === undefined || !categorie_id) {
      return res.status(400).json({ message: 'Titre, prix de base, et catégorie sont requis.' });
    }

    const schemaFourni = schema_personnalisation || [];
    if (!validerSchemaPersonnalisation(schemaFourni)) {
      return res.status(400).json({ message: 'Le format du schema_personnalisation fourni est invalide.' });
    }

    const produit = await prisma.produit.create({
      data: {
        titre,
        prix_de_base,
        description,
        categorie_id,
        images_produit: images_produit || [],
        schema_personnalisation: schemaFourni
      }
    });

    res.status(201).json(produit);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la création du produit.' });
  }
};

export const obtenirProduits = async (req: Request, res: Response) => {
  try {
    const { categorie_id } = req.query;
    
    const produits = await prisma.produit.findMany({
      where: categorie_id ? { categorie_id: String(categorie_id), actif: true } : { actif: true },
      include: {
        categorie: { select: { nom: true } }
      }
    });

    res.status(200).json(produits);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération des produits.' });
  }
};

export const obtenirProduitParId = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        variantes: true,
        categorie: { select: { nom: true } },
        avis: { 
          take: 5,
          orderBy: { date_creation: 'desc' },
          include: { utilisateur: { select: { nom: true } } }
        }
      }
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    res.status(200).json(produit);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération du produit.' });
  }
};

export const modifierProduit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { titre, prix_de_base, description, categorie_id, images_produit, schema_personnalisation, actif } = req.body;

    if (schema_personnalisation && !validerSchemaPersonnalisation(schema_personnalisation)) {
      return res.status(400).json({ message: 'Le format du schema_personnalisation fourni est invalide.' });
    }

    const produit = await prisma.produit.update({
      where: { id },
      data: {
        titre,
        prix_de_base,
        description,
        categorie_id,
        images_produit,
        schema_personnalisation,
        actif
      }
    });

    res.status(200).json(produit);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la modification du produit.' });
  }
};

export const supprimerProduit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.produit.delete({ where: { id } });
    res.status(200).json({ message: 'Produit supprimé avec succès.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la suppression du produit.' });
  }
};
