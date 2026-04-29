import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Module ListeDiffusion (Mailing List)', () => {
  let clientToken: string;
  let adminToken: string;
  let adminId: string;

  const emailTest = 'abonne.test@woodprint.test';

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.listeDiffusion.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();

    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Client Diffusion',
        email: 'client.diffusion@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });
    clientToken = genererToken({ id: client.id, role: client.role });

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
      data: { nom: 'GESTION_CLIENTS', description: 'Gestion des clients et abonnés' }
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

  describe('Flux 1 : Inscription publique', () => {
    it('Doit inscrire un nouvel email avec le code 201', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: emailTest });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Inscription réussie');
      expect(res.body.abonne.email).toEqual(emailTest);
      expect(res.body.abonne.actif).toBe(true);
    });

    it('Doit retourner 200 sans erreur lors d\'une inscription redondante', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: emailTest });

      expect(res.statusCode).toEqual(200);
      expect(res.body.abonne.actif).toBe(true);
    });

    it('Doit refuser une inscription sans email valide', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: 'pas-un-email' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('invalide');
    });
  });

  describe('Flux 2 : Désinscription publique', () => {
    it('Doit désinscrire un email existant avec le code 200', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/desinscription')
        .send({ email: emailTest });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('Désinscription');
    });

    it('Doit retourner 404 pour un email non inscrit', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/desinscription')
        .send({ email: 'inconnu@woodprint.test' });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Flux 3 : Réinscription après désinscription', () => {
    it('Doit réactiver un email précédemment désinscrit avec le code 200', async () => {
      const res = await request(app)
        .post('/api/v1/diffusion/inscription')
        .send({ email: emailTest });

      expect(res.statusCode).toEqual(200);
      expect(res.body.abonne.actif).toBe(true);
    });
  });

  describe('Flux 4 : RBAC - Consultation des abonnés', () => {
    it('Doit interdire à un CLIENT de consulter la liste des abonnés (403)', async () => {
      const res = await request(app)
        .get('/api/v1/diffusion/abonnes')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('Doit interdire un accès non authentifié (401)', async () => {
      const res = await request(app)
        .get('/api/v1/diffusion/abonnes');

      expect(res.statusCode).toEqual(401);
    });

    it('Doit permettre à un ADMIN avec GESTION_CLIENTS de lister les abonnés (200)', async () => {
      const res = await request(app)
        .get('/api/v1/diffusion/abonnes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const abonneActif = res.body.find((a: any) => a.email === emailTest);
      expect(abonneActif).toBeDefined();
      expect(abonneActif.actif).toBe(true);
    });
  });
});
