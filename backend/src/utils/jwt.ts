import jwt from 'jsonwebtoken';

interface PayloadToken {
  id: string;
  role: string;
}

export const genererToken = (payload: PayloadToken): string => {
  const secret = process.env.JWT_SECRET || 'secret_par_defaut';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const verifierToken = (token: string): PayloadToken | null => {
  try {
    const secret = process.env.JWT_SECRET || 'secret_par_defaut';
    return jwt.verify(token, secret) as PayloadToken;
  } catch (erreur) {
    return null;
  }
};
