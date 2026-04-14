import { Request, Response, NextFunction } from 'express';
import { verifierToken } from '../utils/jwt';

export interface RequeteAuthentifiee extends Request {
  utilisateur?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
  const headerAuth = req.headers.authorization;

  if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé. Jeton manquant.' });
  }

  const token = headerAuth.split(' ')[1];
  const payload = verifierToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Non autorisé. Jeton invalide ou expiré.' });
  }

  req.utilisateur = payload;
  next();
};
