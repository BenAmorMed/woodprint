import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Module Avis (Delivery-Gating)', () => {
  let clientToken: string;
  let clientId: string;
  let adminToken: string;
  let adminId: string;
  let produitId: string;
  let varianteId: string;
  let commandeId: string;
  let avisId: string;

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    await prisma.avis.deleteMany();
    await prisma.ligneCommande.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.varianteProduit.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();

    // 1. Créer Client
    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Client Avis',
        email: 'client.avis@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });
    clientId = client.id;
    clientToken = genererToken({ id: client.id, role: client.role });

    // 2. Créer Admin avec permission GESTION_AVIS
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Admin Avis',
        email: 'admin.avis@woodprint.test',
        mot_de_passe: 'hash',
        role: 'ADMIN'
      }
    });
    adminId = admin.id;
    adminToken = genererToken({ id: admin.id, role: admin.role });

    const moduleAvis = await prisma.moduleSysteme.create({
      data: { nom: 'GESTION_AVIS', description: 'Gestion des avis' }
    });
    await prisma.permissionAdmin.create({
      data: { utilisateur_id: adminId, module_id: moduleAvis.id }
    });

    // 3. Créer Produit et Variante
    const categorie = await prisma.categorie.create({
      data: { nom: 'Tableaux' }
    });

    const produit = await prisma.produit.create({
      data: {
        titre: 'Tableau Test Avis',
        prix_de_base: 50.0,
        categorie_id: categorie.id
      }
    });
    produitId = produit.id;

    const variante = await prisma.varianteProduit.create({
      data: {
        sku: 'TEST-AVIS-1',
        produit_id: produitId,
        attributs: {},
        stock: 10
      }
    });
    varianteId = variante.id;
  });

  afterAll(async () => {
    await prisma.avis.deleteMany();
    await prisma.ligneCommande.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.varianteProduit.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  describe('Flux 1 : Tentative de fraude (Gating)', () => {
    it('Doit interdire un avis si le client n\'a pas acheté le produit', async () => {
      const res = await request(app)
        .post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          produit_id: produitId,
          note: 5,
          commentaire: 'Excellent produit !'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('livrée');
    });

    it('Doit interdire un avis si la commande n\'est pas encore LIVREE', async () => {
      // Le client achète le produit (Statut: EN_ATTENTE par défaut)
      const commande = await prisma.commande.create({
        data: {
          utilisateur_id: clientId,
          email_client: 'client.avis@woodprint.test',
          nom_client: 'Client Avis',
          montant_total: 50.0,
          adresse_livraison: { ville: 'Paris' },
          lignes: {
            create: {
              variante_produit_id: varianteId,
              quantite: 1,
              personnalisations_utilisateur: {}
            }
          }
        }
      });
      commandeId = commande.id;

      const res = await request(app)
        .post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          produit_id: produitId,
          note: 5,
          commentaire: 'Super, j\'ai hâte de le recevoir !'
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Flux 2 : Soumission légitime', () => {
    it('Doit permettre un avis si la commande est LIVREE', async () => {
      // L'admin met à jour le statut
      await prisma.commande.update({
        where: { id: commandeId },
        data: { statut: 'LIVREE' }
      });

      const res = await request(app)
        .post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          produit_id: produitId,
          note: 4,
          commentaire: 'Très beau tableau, reçu rapidement.'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.avis.note).toEqual(4);
      avisId = res.body.avis.id;
    });

    it('Doit empêcher le client de laisser un deuxième avis pour le même produit', async () => {
      const res = await request(app)
        .post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          produit_id: produitId,
          note: 5,
          commentaire: 'Je change ma note.'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('déjà laissé un avis');
    });
  });

  describe('Flux 3 : Consultation et Modération', () => {
    it('Doit lister les avis publiquement pour un produit', async () => {
      const res = await request(app)
        .get(`/api/v1/avis/produits/${produitId}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1);
      expect(res.body[0].commentaire).toContain('Très beau');
      expect(res.body[0].utilisateur.nom).toEqual('Client Avis'); // test du include
    });

    it('Doit interdire à un client normal de répondre à un avis', async () => {
      const res = await request(app)
        .put(`/api/v1/avis/admin/${avisId}/reponse`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reponse_admin: 'Merci !' });

      expect(res.statusCode).toEqual(403);
    });

    it('Doit permettre à un admin (avec permission) de répondre à un avis', async () => {
      const res = await request(app)
        .put(`/api/v1/avis/admin/${avisId}/reponse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reponse_admin: 'Merci pour votre retour ! L\'équipe WoodPrint.' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.avis.reponse_admin).toContain('WoodPrint');
    });
  });
});
