import { prisma } from '../config/db';

/**
 * Inscrire un email à la liste de diffusion.
 * Logique idempotente : si l'email existe déjà mais est inactif, on le réactive.
 */
export const sInscrire = async (email: string) => {
  const existant = await prisma.listeDiffusion.findUnique({ where: { email } });

  if (existant) {
    if (existant.actif) {
      return existant;
    }
    return await prisma.listeDiffusion.update({
      where: { email },
      data: { actif: true }
    });
  }

  return await prisma.listeDiffusion.create({
    data: { email }
  });
};

/**
 * Désinscrire un email de la liste de diffusion (soft delete via le drapeau actif).
 */
export const seDesinscrire = async (email: string) => {
  const existant = await prisma.listeDiffusion.findUnique({ where: { email } });

  if (!existant) {
    throw new Error('Cet email n\'est pas inscrit à la liste de diffusion.');
  }

  return await prisma.listeDiffusion.update({
    where: { email },
    data: { actif: false }
  });
};

/**
 * Obtenir la liste de tous les abonnés actifs (Route Admin).
 */
export const obtenirAbonnesActifs = async () => {
  return await prisma.listeDiffusion.findMany({
    where: { actif: true },
    orderBy: { date_inscription: 'desc' }
  });
};
