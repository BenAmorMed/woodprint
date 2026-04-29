import { prisma } from '../config/db';

export interface CreationOffre {
  titre: string;
  description?: string;
  image_banniere?: string;
  date_debut?: Date;
  date_fin?: Date;
  actif?: boolean;
  produits_cibles?: string[];
}

export interface ModificationOffre {
  titre?: string;
  description?: string;
  image_banniere?: string;
  date_debut?: Date;
  date_fin?: Date;
  actif?: boolean;
  produits_cibles?: string[];
}

const validerDates = (debut?: Date, fin?: Date) => {
  if (debut && fin && new Date(debut) >= new Date(fin)) {
    throw new Error('La date de fin doit être strictement postérieure à la date de début.');
  }
};

/**
 * Créer une nouvelle offre promotionnelle
 */
export const creerOffre = async (donnees: CreationOffre) => {
  validerDates(donnees.date_debut, donnees.date_fin);

  return await prisma.offre.create({
    data: {
      titre: donnees.titre,
      description: donnees.description,
      image_banniere: donnees.image_banniere,
      date_debut: donnees.date_debut ? new Date(donnees.date_debut) : undefined,
      date_fin: donnees.date_fin ? new Date(donnees.date_fin) : undefined,
      actif: donnees.actif !== undefined ? donnees.actif : false,
      produits_cibles: donnees.produits_cibles && donnees.produits_cibles.length > 0 ? {
        connect: donnees.produits_cibles.map(id => ({ id }))
      } : undefined
    }
  });
};

/**
 * Obtenir uniquement les offres actives et non expirées (Route Publique)
 */
export const obtenirOffresActives = async () => {
  const maintenant = new Date();
  
  return await prisma.offre.findMany({
    where: {
      actif: true,
      OR: [
        { date_debut: null, date_fin: null },
        { date_debut: { lte: maintenant }, date_fin: { gt: maintenant } }
      ]
    },
    orderBy: { titre: 'asc' }
  });
};

/**
 * Obtenir toutes les offres (Route Admin)
 */
export const obtenirToutesOffres = async () => {
  return await prisma.offre.findMany({
    orderBy: { titre: 'asc' }
  });
};

/**
 * Modifier une offre
 */
export const modifierOffre = async (id: string, donnees: ModificationOffre) => {
  const offreExistante = await prisma.offre.findUnique({ where: { id } });
  
  if (!offreExistante) {
    throw new Error('Offre non trouvée.');
  }

  const debutAValider = donnees.date_debut || offreExistante.date_debut || undefined;
  const finAValider = donnees.date_fin || offreExistante.date_fin || undefined;
  validerDates(debutAValider, finAValider);

  return await prisma.offre.update({
    where: { id },
    data: {
      titre: donnees.titre,
      description: donnees.description,
      image_banniere: donnees.image_banniere,
      date_debut: donnees.date_debut ? new Date(donnees.date_debut) : undefined,
      date_fin: donnees.date_fin ? new Date(donnees.date_fin) : undefined,
      actif: donnees.actif,
      produits_cibles: donnees.produits_cibles ? {
        set: donnees.produits_cibles.map(pid => ({ id: pid }))
      } : undefined
    }
  });
};

/**
 * Supprimer une offre
 */
export const supprimerOffre = async (id: string) => {
  const offreExistante = await prisma.offre.findUnique({ where: { id } });
  
  if (!offreExistante) {
    throw new Error('Offre non trouvée.');
  }

  return await prisma.offre.delete({ where: { id } });
};
