import bcrypt from 'bcrypt';

const SEL_ROUNDS = 12;

export const hacherMotDePasse = async (motDePasse: string): Promise<string> => {
  const sel = await bcrypt.genSalt(SEL_ROUNDS);
  return bcrypt.hash(motDePasse, sel);
};

export const verifierMotDePasse = async (motDePasse: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(motDePasse, hash);
};
