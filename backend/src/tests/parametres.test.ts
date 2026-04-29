import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Paramètres Boutique (Singleton)', () => {
  let clientToken: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.parametresBoutique.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();

    // 1. Créer Client
    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Client Test',
        email: 'client.param@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });
    clientToken = genererToken({ id: client.id, role: client.role });

    // 2. Créer Admin avec permission GESTION_PARAMETRES
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Admin Param',
        email: 'admin.param@woodprint.test',
        mot_de_passe: 'hash',
        role: 'ADMIN'
      }
    });
    adminId = admin.id;
    adminToken = genererToken({ id: admin.id, role: admin.role });

    const moduleParam = await prisma.moduleSysteme.create({
      data: { nom: 'GESTION_PARAMETRES', description: 'Gestion des paramètres' }
    });
    await prisma.permissionAdmin.create({
      data: { utilisateur_id: adminId, module_id: moduleParam.id }
    });
  });

  afterAll(async () => {
    await prisma.parametresBoutique.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  it('Doit initialiser (upsert) et récupérer les paramètres publiquement', async () => {
    const res = await request(app).get('/api/v1/parametres');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(1);
    expect(res.body.frais_livraison).toEqual('0');
    expect(res.body.seuil_livraison_gratuite).toEqual('0');
    expect(res.body.banniere_annonce).toBeNull();
  });

  it('Doit interdire à un client de modifier les paramètres', async () => {
    const res = await request(app)
      .put('/api/v1/parametres')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ frais_livraison: 15.5 });

    expect(res.statusCode).toEqual(403);
  });

  it('Doit permettre à un admin (avec permission) de modifier les paramètres', async () => {
    const res = await request(app)
      .put('/api/v1/parametres')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        frais_livraison: 15.5,
        seuil_livraison_gratuite: 150.0,
        banniere_annonce: 'Soldes d\'hiver !'
      });

    expect(res.statusCode).toEqual(200);
    
    // Décimal est souvent retourné sous forme de string par Prisma dans la réponse JSON
    expect(Number(res.body.parametres.frais_livraison)).toEqual(15.5);
    expect(Number(res.body.parametres.seuil_livraison_gratuite)).toEqual(150.0);
    expect(res.body.parametres.banniere_annonce).toEqual('Soldes d\'hiver !');
  });

  it('Doit conserver le Singleton (id=1) et refléter les changements', async () => {
    const res = await request(app).get('/api/v1/parametres');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(1);
    expect(Number(res.body.frais_livraison)).toEqual(15.5);
    
    // Vérifier la BDD directement pour garantir l'unicité
    const compte = await prisma.parametresBoutique.count();
    expect(compte).toEqual(1);
  });
});
