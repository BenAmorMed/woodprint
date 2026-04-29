import { prisma } from '../config/db';

export interface ParametresDonnees {
  frais_livraison?: number;
  seuil_livraison_gratuite?: number;
  banniere_annonce?: string | null;
}

/**
 * Récupérer les paramètres de la boutique (Singleton - ID toujours égal à 1)
 * Si la ligne n'existe pas, elle est créée avec des valeurs par défaut.
 */
export const obtenirParametres = async () => {
  return await prisma.parametresBoutique.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      frais_livraison: 0.0,
      seuil_livraison_gratuite: 0.0,
      banniere_annonce: null
    }
  });
};

/**
 * Mettre à jour les paramètres de la boutique
 */
export const modifierParametres = async (donnees: ParametresDonnees) => {
  return await prisma.parametresBoutique.upsert({
    where: { id: 1 },
    update: donnees,
    create: {
      id: 1,
      frais_livraison: donnees.frais_livraison || 0.0,
      seuil_livraison_gratuite: donnees.seuil_livraison_gratuite || 0.0,
      banniere_annonce: donnees.banniere_annonce || null
    }
  });
};
