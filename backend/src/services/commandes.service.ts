import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { CreerCommandeDTO } from '../types/commande.types';
import { validerPersonnalisationsUtilisateur } from './validation.service';
import crypto from 'crypto';

export class ErreurValidationCommande extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurValidationCommande';
  }
}

export const creerCommande = async (data: CreerCommandeDTO) => {
  const { utilisateur_id, email_client, nom_client, adresse_livraison, lignes } = data;

  if (!lignes || lignes.length === 0) {
    throw new ErreurValidationCommande('La commande doit contenir au moins une ligne.');
  }

  let montant_total = new Prisma.Decimal(0);
  const lignesAcreer: { variante_produit_id: string; quantite: number; personnalisations_utilisateur: any }[] = [];

  for (const ligne of lignes) {
    if (ligne.quantite <= 0) {
      throw new ErreurValidationCommande(`La quantité pour la variante ${ligne.variante_produit_id} doit être supérieure à 0.`);
    }

    const variante = await prisma.varianteProduit.findUnique({
      where: { id: ligne.variante_produit_id },
      include: { produit: true },
    });

    if (!variante) {
      throw new ErreurValidationCommande(`Variante produit non trouvée (ID: ${ligne.variante_produit_id}).`);
    }

    if (variante.stock < ligne.quantite) {
      throw new ErreurValidationCommande(`Stock insuffisant pour la variante ${variante.sku}.`);
    }

    const schema = variante.produit.schema_personnalisation as any[];
    const personnalisationsValides = validerPersonnalisationsUtilisateur(
      ligne.personnalisations_utilisateur || {},
      schema
    );

    if (!personnalisationsValides) {
      throw new ErreurValidationCommande(`Personnalisations invalides pour le produit ${variante.produit.titre}.`);
    }

    const prixLigne = (Number(variante.produit.prix_de_base) + Number(variante.modificateur_prix)) * ligne.quantite;
    montant_total = montant_total.add(new Prisma.Decimal(prixLigne));

    lignesAcreer.push({
      variante_produit_id: variante.id,
      quantite: ligne.quantite,
      personnalisations_utilisateur: ligne.personnalisations_utilisateur || {},
    });
  }

  let code_confirmation: string | null = null;
  if (!utilisateur_id) {
    code_confirmation = crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  const commande = await prisma.$transaction(async (tx) => {
    const nouvelleCommande = await tx.commande.create({
      data: {
        utilisateur_id,
        email_client,
        nom_client,
        adresse_livraison,
        code_confirmation,
        montant_total,
        statut: 'EN_ATTENTE',
        lignes: {
          create: lignesAcreer,
        },
      },
      include: {
        lignes: true,
      },
    });

    for (const ligne of lignesAcreer) {
      await tx.varianteProduit.update({
        where: { id: ligne.variante_produit_id },
        data: {
          stock: {
            decrement: ligne.quantite,
          },
        },
      });
    }

    return nouvelleCommande;
  });

  return commande;
};

export const obtenirCommandesUtilisateur = async (utilisateur_id: string) => {
  return await prisma.commande.findMany({
    where: { utilisateur_id },
    include: {
      lignes: {
        include: {
          variante_produit: {
            include: {
              produit: true
            }
          }
        }
      }
    },
    orderBy: { date_creation: 'desc' }
  });
};

export const obtenirCommandeParCode = async (code_confirmation: string, email_client: string) => {
  return await prisma.commande.findFirst({
    where: { code_confirmation, email_client },
    include: {
      lignes: {
        include: {
          variante_produit: {
            include: {
              produit: true
            }
          }
        }
      }
    }
  });
};
