import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Offres Promotionnelles', () => {
  let clientToken: string;
  let adminToken: string;
  let adminId: string;
  let offreId: string;

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.offre.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();

    // Client
    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Client Offres',
        email: 'client.offres@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });
    clientToken = genererToken({ id: client.id, role: client.role });

    // Admin
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Admin Offres',
        email: 'admin.offres@woodprint.test',
        mot_de_passe: 'hash',
        role: 'ADMIN'
      }
    });
    adminId = admin.id;
    adminToken = genererToken({ id: admin.id, role: admin.role });

    const moduleOffres = await prisma.moduleSysteme.create({
      data: { nom: 'GESTION_OFFRES', description: 'Gestion des offres' }
    });
    await prisma.permissionAdmin.create({
      data: { utilisateur_id: adminId, module_id: moduleOffres.id }
    });
  });

  afterAll(async () => {
    await prisma.offre.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  describe('Validation Métier lors de la création', () => {
    it('Doit interdire la création si date_fin est avant date_debut', async () => {
      const res = await request(app)
        .post('/api/v1/offres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Dates Inversées',
          date_debut: new Date(Date.now() + 86400000).toISOString(),
          date_fin: new Date().toISOString()
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('date de fin');
    });
  });

  describe('Création et RBAC', () => {
    it('Doit interdire à un client de créer une offre', async () => {
      const res = await request(app)
        .post('/api/v1/offres')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          titre: 'Fausse Offre',
          date_debut: new Date().toISOString(),
          date_fin: new Date(Date.now() + 86400000).toISOString()
        });

      expect(res.statusCode).toEqual(403);
    });

    it('Doit permettre à un admin de créer une offre valide', async () => {
      const res = await request(app)
        .post('/api/v1/offres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Promo Été',
          description: '-15% sur tous les tableaux',
          date_debut: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h (active)
          date_fin: new Date(Date.now() + 86400000).toISOString(), // Dans 24h
          actif: true
        });

      expect(res.statusCode).toEqual(201);
      offreId = res.body.offre.id;
    });

    it('Ne doit pas exposer les offres expirées publiquement', async () => {
      // Créer une offre expirée
      await request(app)
        .post('/api/v1/offres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Promo Expirée',
          date_debut: new Date(Date.now() - 172800000).toISOString(), // Il y a 48h
          date_fin: new Date(Date.now() - 86400000).toISOString(), // Terminée il y a 24h
          actif: true
        });

      // Fetch public
      const res = await request(app).get('/api/v1/offres');
      expect(res.statusCode).toEqual(200);
      
      // Doit contenir uniquement la Promo Été
      expect(res.body.length).toEqual(1);
      expect(res.body[0].titre).toEqual('Promo Été');
    });
  });
});
