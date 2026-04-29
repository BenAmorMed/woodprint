import { prisma } from '../config/db';

export const verifierBaseDeDonneesTest = () => {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes('_test')) {
    throw new Error(
      "DANGER: Vous tentez d'exécuter les tests sur la base de données de développement ou de production. " +
      "Veuillez utiliser 'npm run test' pour exécuter les tests isolés."
    );
  }
};
