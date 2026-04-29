import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Liste de Diffusion', () => {
  let clientToken: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.listeDiffusion.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();

    // Client
    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Client Diffusion',
        email: 'client.diffusion@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });
    clientToken = genererToken({ id: client.id, role: client.role });

    // Admin avec permission GESTION_CLIENTS
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Admin Diffusion',
        email: 'admin.diffusion@woodprint.test',
        mot_de_passe: 'hash',
        role: 'ADMIN'
      }
    });
    adminId = admin.id;
    adminToken = genererToken({ id: admin.id, role: admin.role });

    const moduleClients = await prisma.moduleSysteme.create({
      data: { nom: 'GESTION_CLIENTS', description: 'Gestion des clients' }
    });
    await prisma.permissionAdmin.create({
      data: { utilisateur_id: adminId, module_id: moduleClients.id }
    });
  });

  afterAll(async () => {
    await prisma.listeDiffusion.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  describe('Flux d\'inscription', () => {
    it('Doit rejeter une inscription avec un email invalide', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: 'pas-un-email' });

      expect(res.statusCode).toEqual(400);
    });

    it('Doit inscrire un nouvel email avec succès', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: 'newsletter@woodprint.test' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.abonne.email).toEqual('newsletter@woodprint.test');
      expect(res.body.abonne.actif).toEqual(true);
    });

    it('Doit gérer une inscription redondante sans erreur (idempotence)', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: 'newsletter@woodprint.test' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.abonne.actif).toEqual(true);
    });
  });

  describe('Flux de désinscription', () => {
    it('Doit désinscrire un email existant', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/desinscription')
        .send({ email: 'newsletter@woodprint.test' });

      expect(res.statusCode).toEqual(200);

      const enBase = await prisma.listeDiffusion.findUnique({
        where: { email: 'newsletter@woodprint.test' }
      });
      expect(enBase?.actif).toEqual(false);
    });

    it('Doit réactiver un abonné inactif lors d\'une réinscription', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: 'newsletter@woodprint.test' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.abonne.actif).toEqual(true);
    });

    it('Doit retourner 404 pour un email non inscrit', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/desinscription')
        .send({ email: 'inconnu@woodprint.test' });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Accès Admin aux abonnés', () => {
    it('Doit interdire à un client de lister les abonnés', async () => {
      const res = await request(app)
        .get('/api/v1/diffusion/abonnes')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('Doit permettre à un admin de lister les abonnés actifs', async () => {
      const res = await request(app)
        .get('/api/v1/diffusion/abonnes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1);
      expect(res.body[0].email).toEqual('newsletter@woodprint.test');
    });
  });
});
