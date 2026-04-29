import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';

describe('Intégration Métier - Module Commandes (v0.3)', () => {
  let clientToken: string;
  let produitId: string;
  let varianteId: string;
  let guestCodeConfirmation: string;

  beforeAll(async () => {
    // FAIL-SAFE: Empêcher de remplir la base de production/développement avec de fausses données
    verifierBaseDeDonneesTest();

    // Nettoyage agressif avant les tests pour garantir une base vierge
    await prisma.ligneCommande.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.varianteProduit.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.utilisateur.deleteMany();

    const client = await prisma.utilisateur.create({
      data: {
        nom: 'Acheteur Légal',
        email: 'acheteur@woodprint.test',
        mot_de_passe: 'hash',
        role: 'CLIENT'
      }
    });

    clientToken = genererToken({ id: client.id, role: client.role });

    const categorie = await prisma.categorie.create({
      data: { nom: 'Accessoires Premium' }
    });

    const produit = await prisma.produit.create({
      data: {
        titre: 'Tableau en Bois Gravé',
        prix_de_base: 50.0,
        categorie_id: categorie.id,
        schema_personnalisation: [
          { id: 'texte_central', nom: 'Texte Central', type: 'texte', requis: true }
        ]
      }
    });
    produitId = produit.id;

    const variante = await prisma.varianteProduit.create({
      data: {
        produit_id: produit.id,
        sku: 'TAB-BOIS-01',
        attributs: { format: 'A4' },
        modificateur_prix: 0.0,
        stock: 5 // Stock limité pour le test d'inventaire
      }
    });
    varianteId = variante.id;
  });

  afterAll(async () => {
    // Nettoyage après la suite (bien que db push le fera à chaque démarrage de npm run test)
    await prisma.ligneCommande.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.varianteProduit.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  describe('Flux 1 : Commande et Suivi Invité', () => {
    it('Doit permettre à un invité de commander et de recevoir un code de suivi', async () => {
      const res = await request(app)
        .post('/api/v1/commandes')
        .send({
          email_client: 'invite_business@test.com',
          nom_client: 'Monsieur Invité',
          adresse_livraison: { rue: '1 Voie Lactée', ville: 'Paris' },
          lignes: [
            {
              variante_produit_id: varianteId,
              quantite: 1,
              personnalisations_utilisateur: { texte_central: 'Cadeau' }
            }
          ]
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.code_confirmation).toBeDefined();
      expect(res.body.utilisateur_id).toBeNull();
      
      guestCodeConfirmation = res.body.code_confirmation;
    });

    it('Doit permettre à l\'invité de retrouver sa commande avec son code', async () => {
      const res = await request(app)
        .post('/api/v1/commandes/suivi-invite')
        .send({
          code_confirmation: guestCodeConfirmation,
          email_client: 'invite_business@test.com'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.nom_client).toEqual('Monsieur Invité');
      expect(res.body.lignes[0].personnalisations_utilisateur.texte_central).toEqual('Cadeau');
    });

    it('Doit rejeter une demande de suivi avec un code invalide', async () => {
      const res = await request(app)
        .post('/api/v1/commandes/suivi-invite')
        .send({
          code_confirmation: 'FAUXCODE123',
          email_client: 'invite_business@test.com'
        });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Flux 2 : Commande et Historique Authentifié', () => {
    it('Doit lier une commande à un utilisateur connecté', async () => {
      const res = await request(app)
        .post('/api/v1/commandes')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email_client: 'acheteur@woodprint.test',
          nom_client: 'Acheteur Légal',
          adresse_livraison: { rue: '2 Rue Connectée', ville: 'Lyon' },
          lignes: [
            {
              variante_produit_id: varianteId,
              quantite: 2,
              personnalisations_utilisateur: { texte_central: 'Pour Moi' }
            }
          ]
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.utilisateur_id).toBeDefined();
      expect(res.body.code_confirmation).toBeNull();
    });

    it('Doit lister uniquement les commandes de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/v1/commandes/mes-commandes')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1); // Seulement sa commande, pas celle de l'invité
      expect(res.body[0].lignes[0].quantite).toEqual(2);
    });
  });

  describe('Flux 3 : Protection de l\'Inventaire', () => {
    it('Doit rejeter une commande si la quantité demandée dépasse le stock (stock=2 restant)', async () => {
      // 1 pris par invité, 2 pris par l'authentifié. Reste 2 en stock.
      const res = await request(app)
        .post('/api/v1/commandes')
        .send({
          email_client: 'gourmand@test.com',
          nom_client: 'Gourmand',
          adresse_livraison: { rue: '...', ville: '...' },
          lignes: [
            {
              variante_produit_id: varianteId,
              quantite: 5, // Demande 5, mais il n'en reste que 2
              personnalisations_utilisateur: { texte_central: 'Trop' }
            }
          ]
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Stock insuffisant');
    });
  });
});
