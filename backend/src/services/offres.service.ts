import { prisma } from '../config/db';

export interface CreationOffre {
  titre: string;
  description?: string;
  pourcentage_remise: number;
  date_debut: Date;
  date_fin: Date;
  actif?: boolean;
  produits_cibles?: string[];
}

export interface ModificationOffre {
  titre?: string;
  description?: string;
  pourcentage_remise?: number;
  date_debut?: Date;
  date_fin?: Date;
  actif?: boolean;
  produits_cibles?: string[];
}

const validerDatesEtRemise = (remise?: number, debut?: Date, fin?: Date) => {
  if (remise !== undefined && (remise <= 0 || remise > 100)) {
    throw new Error('Le pourcentage de remise doit être strictement supérieur à 0 et inférieur ou égal à 100.');
  }
  if (debut && fin && new Date(debut) >= new Date(fin)) {
    throw new Error('La date de fin doit être strictement postérieure à la date de début.');
  }
};

/**
 * Créer une nouvelle offre promotionnelle
 */
export const creerOffre = async (donnees: CreationOffre) => {
  validerDatesEtRemise(donnees.pourcentage_remise, donnees.date_debut, donnees.date_fin);

  return await prisma.offre.create({
    data: {
      titre: donnees.titre,
      description: donnees.description,
      pourcentage_remise: donnees.pourcentage_remise,
      date_debut: new Date(donnees.date_debut),
      date_fin: new Date(donnees.date_fin),
      actif: donnees.actif !== undefined ? donnees.actif : true,
      produits_cibles: donnees.produits_cibles || []
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
      date_debut: { lte: maintenant },
      date_fin: { gt: maintenant }
    },
    orderBy: { date_fin: 'asc' }
  });
};

/**
 * Obtenir toutes les offres (Route Admin)
 */
export const obtenirToutesOffres = async () => {
  return await prisma.offre.findMany({
    orderBy: { date_debut: 'desc' }
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

  const debutAValider = donnees.date_debut || offreExistante.date_debut;
  const finAValider = donnees.date_fin || offreExistante.date_fin;
  validerDatesEtRemise(donnees.pourcentage_remise, debutAValider, finAValider);

  return await prisma.offre.update({
    where: { id },
    data: {
      titre: donnees.titre,
      description: donnees.description,
      pourcentage_remise: donnees.pourcentage_remise,
      date_debut: donnees.date_debut ? new Date(donnees.date_debut) : undefined,
      date_fin: donnees.date_fin ? new Date(donnees.date_fin) : undefined,
      actif: donnees.actif,
      produits_cibles: donnees.produits_cibles
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
