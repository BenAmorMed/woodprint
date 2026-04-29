import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { hacherMotDePasse } from '../utils/cryptage';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Authentification & Profil', () => {
  let clientToken: string;
  let clientId: string;

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.utilisateur.deleteMany();

    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Auth Client',
        email: 'authclient@woodprint.test',
        mot_de_passe: 'hash_test',
        role: 'CLIENT'
      }
    });

    clientId = client.id;
    clientToken = genererToken({ id: client.id, role: client.role });
  });

  afterAll(async () => {
    await prisma.utilisateur.deleteMany();
  });

  describe('Gestion du Profil', () => {
    it('Doit récupérer le profil de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profil')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toEqual('authclient@woodprint.test');
      expect(res.body.nom).toEqual('Auth Client');
    });

    it('Doit rejeter une requête de profil non authentifiée', async () => {
      const res = await request(app).get('/api/v1/auth/profil');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Réinitialisation du Mot de Passe', () => {
    it('Doit générer un token de réinitialisation lors de la demande', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reinitialisation-pwd')
        .send({ email: 'authclient@woodprint.test' });

      expect(res.statusCode).toEqual(200);
      
      const userUpdated = await prisma.utilisateur.findUnique({ where: { email: 'authclient@woodprint.test' } });
      expect(userUpdated?.jeton_reinitialisation).not.toBeNull();
    });

    it('Doit consommer le jeton et modifier le mot de passe avec succès', async () => {
      // 1. Simulation d'un jeton brut (comme reçu par email)
      const jetonBrut = 'jeton_de_test_123';
      const jetonHache = await hacherMotDePasse(jetonBrut);
      
      await prisma.utilisateur.update({
        where: { email: 'authclient@woodprint.test' },
        data: { jeton_reinitialisation: jetonHache }
      });

      // 2. Consommation du jeton via l'API
      const res = await request(app)
        .post('/api/v1/auth/reinitialiser-pwd')
        .send({ 
          email: 'authclient@woodprint.test', 
          jeton: jetonBrut, 
          nouveauMotDePasse: 'nouveau_mot_de_passe_robuste' 
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('succès');

      // 3. Vérification que le jeton a été supprimé après usage
      const userFinal = await prisma.utilisateur.findUnique({ where: { email: 'authclient@woodprint.test' } });
      expect(userFinal?.jeton_reinitialisation).toBeNull();
    });

    it('Doit rejeter une réinitialisation avec un jeton invalide', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reinitialiser-pwd')
        .send({ 
          email: 'authclient@woodprint.test', 
          jeton: 'jeton_falsifie', 
          nouveauMotDePasse: 'hacked' 
        });

      expect(res.statusCode).toEqual(400);
    });
  });
});
