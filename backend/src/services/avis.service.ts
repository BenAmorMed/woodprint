import { prisma } from '../config/db';

/**
 * Créer un nouvel avis pour un produit.
 * RÈGLE MÉTIER (Blueprint) : L'avis est strictement bloqué tant que la commande 
 * contenant ce produit n'a pas le statut "LIVREE".
 */
export const creerAvis = async (
  utilisateurId: string,
  produitId: string,
  note: number,
  commentaire?: string,
  urls_media?: string[]
) => {
  if (note < 1 || note > 5) {
    throw new Error('La note doit être comprise entre 1 et 5.');
  }

  // Vérification de la porte de livraison (Delivery-Gating)
  const commandeLivree = await prisma.commande.findFirst({
    where: {
      utilisateur_id: utilisateurId,
      statut: 'LIVREE',
      lignes: {
        some: {
          variante_produit: {
            produit_id: produitId
          }
        }
      }
    }
  });

  if (!commandeLivree) {
    throw new Error("Vous ne pouvez évaluer ce produit que si vous l'avez acheté et que votre commande a été livrée.");
  }

  // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit (optionnel mais recommandé pour éviter le spam)
  const avisExistant = await prisma.avis.findFirst({
    where: {
      utilisateur_id: utilisateurId,
      produit_id: produitId
    }
  });

  if (avisExistant) {
    throw new Error('Vous avez déjà laissé un avis pour ce produit.');
  }

  return await prisma.avis.create({
    data: {
      utilisateur_id: utilisateurId,
      produit_id: produitId,
      note,
      commentaire,
      urls_media: urls_media || []
    }
  });
};

/**
 * Récupérer tous les avis publics d'un produit.
 */
export const obtenirAvisParProduit = async (produitId: string) => {
  return await prisma.avis.findMany({
    where: { produit_id: produitId },
    orderBy: { date_creation: 'desc' },
    include: {
      utilisateur: {
        select: {
          nom: true
        }
      }
    }
  });
};

/**
 * Permet à un administrateur de répondre à un avis.
 */
export const ajouterReponseAdmin = async (avisId: string, reponseAdmin: string) => {
  const avis = await prisma.avis.findUnique({ where: { id: avisId } });

  if (!avis) {
    throw new Error('Avis non trouvé.');
  }

  return await prisma.avis.update({
    where: { id: avisId },
    data: { reponse_admin: reponseAdmin }
  });
};
