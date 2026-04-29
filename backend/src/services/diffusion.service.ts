import { prisma } from '../config/db';

/**
 * Inscrire un email à la liste de diffusion.
 * Logique idempotente : si l'email existe déjà mais est inactif, on le réactive.
 * Retourne un objet avec un drapeau `estNouveau` pour distinguer les créations des réactivations.
 */
export const sInscrire = async (email: string) => {
  const existant = await prisma.listeDiffusion.findUnique({ where: { email } });

  if (existant) {
    if (existant.actif) {
      return { abonne: existant, estNouveau: false };
    }
    const reactive = await prisma.listeDiffusion.update({
      where: { email },
      data: { actif: true }
    });
    return { abonne: reactive, estNouveau: false };
  }

  const nouveau = await prisma.listeDiffusion.create({
    data: { email }
  });
  return { abonne: nouveau, estNouveau: true };
};


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


export const obtenirAbonnesActifs = async () => {
  return await prisma.listeDiffusion.findMany({
    where: { actif: true },
    orderBy: { date_inscription: 'desc' }
  });
};
