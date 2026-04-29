import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';
import { verifierBaseDeDonneesTest } from './test-utils';
import path from 'path';
import fs from 'fs';

describe('Système Complet - Mega Scénario End-to-End (E2E)', () => {
  let superAdminToken: string;
  let adminCatalogueToken: string;
  let adminMarketingToken: string;
  let clientToken: string;
  let guestOrderCode: string;
  
  let adminCatalogueId: string;
  let adminMarketingId: string;

  let categorieParenteId: string;
  let categorieEnfantId: string;
  let produitId: string;
  let varianteId: string;
  
  let offreId: string;
  let commandeClientId: string;
  let avisId: string;

  const clientEmail = 'client.fidele@woodprint.test';
  const guestEmail = 'guest.shopper@woodprint.test';

  beforeAll(async () => {
    verifierBaseDeDonneesTest();
    // Nettoyage complet
    await prisma.avis.deleteMany();
    await prisma.ligneCommande.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.varianteProduit.deleteMany();
    await prisma.offre.deleteMany();
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.listeDiffusion.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
    await prisma.parametresBoutique.deleteMany();

    // Création des modules système
    await prisma.moduleSysteme.createMany({
      data: [
        { nom: 'GESTION_PRODUITS' },
        { nom: 'GESTION_COMMANDES' },
        { nom: 'GESTION_PARAMETRES' },
        { nom: 'GESTION_CLIENTS' },
        { nom: 'GESTION_OFFRES' },
        { nom: 'GESTION_AVIS' }
      ]
    });

    // SuperAdmin
    const superAdmin = await prisma.utilisateur.create({
      data: { nom: 'Super', email: 'super@test.com', mot_de_passe: 'hash', role: 'SUPER_ADMIN' }
    });
    superAdminToken = genererToken({ id: superAdmin.id, role: superAdmin.role });

    // Admins
    const adminCat = await prisma.utilisateur.create({
      data: { nom: 'Admin Catalogue', email: 'cat@test.com', mot_de_passe: 'hash', role: 'ADMIN' }
    });
    adminCatalogueId = adminCat.id;
    adminCatalogueToken = genererToken({ id: adminCat.id, role: adminCat.role });

    const adminMkt = await prisma.utilisateur.create({
      data: { nom: 'Admin Marketing', email: 'mkt@test.com', mot_de_passe: 'hash', role: 'ADMIN' }
    });
    adminMarketingId = adminMkt.id;
    adminMarketingToken = genererToken({ id: adminMkt.id, role: adminMkt.role });
  });

  describe('Étape 1 : Gouvernance et RBAC (Super Admin)', () => {
    it('Le SuperAdmin alloue les permissions aux Admins', async () => {
      // Admin Catalogue reçoit GESTION_PRODUITS
      let res = await request(app).post('/api/v1/auth/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ cibleUtilisateurId: adminCatalogueId, nomModule: 'GESTION_PRODUITS' });
      expect(res.statusCode).toEqual(200);

      // Admin Marketing reçoit COMMANDES, OFFRES, AVIS, PARAMETRES
      for (const mod of ['GESTION_COMMANDES', 'GESTION_OFFRES', 'GESTION_AVIS', 'GESTION_PARAMETRES']) {
        await request(app).post('/api/v1/auth/admin/permissions')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ cibleUtilisateurId: adminMarketingId, nomModule: mod });
      }
    });

    it('L\'Admin Catalogue ne doit pas pouvoir accéder aux Commandes (RBAC strict)', async () => {
      const res = await request(app).get('/api/v1/commandes/admin/toutes')
        .set('Authorization', `Bearer ${adminCatalogueToken}`);
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Étape 2 : Configuration du Catalogue & Upload Médias (Admin Catalogue)', () => {
    it('Doit créer une hiérarchie de catégories', async () => {
      // Parent
      const resParent = await request(app).post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminCatalogueToken}`)
        .send({ nom: 'Maison' });
      categorieParenteId = resParent.body.id;

      // Enfant
      const resEnfant = await request(app).post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminCatalogueToken}`)
        .send({ nom: 'Tableaux', categorie_parente_id: categorieParenteId });
      categorieEnfantId = resEnfant.body.id;
      expect(resEnfant.statusCode).toEqual(201);
    });

    it('Doit télécharger une image factice pour le produit', async () => {
      // Simulation d'un upload de fichier
      const buffer = Buffer.from('fake image content');
      const res = await request(app).post('/api/v1/medias/upload')
        .set('Authorization', `Bearer ${adminCatalogueToken}`)
        .attach('fichier', buffer, 'test.jpg');
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.url).toContain('/api/v1/medias/');
    });

    it('Doit créer un produit hautement personnalisable (JSONB Complexe)', async () => {
      const res = await request(app).post('/api/v1/produits')
        .set('Authorization', `Bearer ${adminCatalogueToken}`)
        .send({
          titre: 'Tableau Multi-Photos',
          prix_de_base: 50.0,
          categorie_id: categorieEnfantId,
          schema_personnalisation: [
            { id: 'texte_central', nom: 'Texte Central', type: 'texte', requis: true },
            { id: 'cadre', nom: 'Type de Cadre', type: 'select', requis: true, options: ['Noir', 'Blanc', 'Chêne'] },
            { id: 'position_logo', nom: 'Position du Logo', type: 'coordonnees', requis: false }
          ],
          actif: true
        });
      expect(res.statusCode).toEqual(201);
      produitId = res.body.id;
    });

    it('Doit ajouter une variante et modifier ses stocks', async () => {
      const res = await request(app).post(`/api/v1/produits/${produitId}/variantes`)
        .set('Authorization', `Bearer ${adminCatalogueToken}`)
        .send({ sku: 'TAB-100', attributs: { taille: '100x100' }, modificateur_prix: 20.0, stock: 5 });
      expect(res.statusCode).toEqual(201);
      varianteId = res.body.id;
    });
  });

  describe('Étape 3 : Marketing & Configuration de la Boutique (Admin Marketing)', () => {
    it('Doit configurer les paramètres (Frais de livraison)', async () => {
      const res = await request(app).put('/api/v1/parametres')
        .set('Authorization', `Bearer ${adminMarketingToken}`)
        .send({ frais_livraison: 7.00, seuil_livraison_gratuite: 150.0, banniere_annonce: 'Promo Hiver !' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.parametres.banniere_annonce).toEqual('Promo Hiver !');
    });

    it('Doit créer une Offre Promotionnelle ciblée sur le produit', async () => {
      const res = await request(app).post('/api/v1/offres')
        .set('Authorization', `Bearer ${adminMarketingToken}`)
        .send({
          titre: 'Soldes sur Tableaux',
          description: '-10% exceptionnels',
          actif: true,
          produits_cibles: [produitId]
        });
      expect(res.statusCode).toEqual(201);
      offreId = res.body.id;
    });
  });

  describe('Étape 4 : Parcours Utilisateur (Authentification & Mailing)', () => {
    it('Le client s\'inscrit à la newsletter', async () => {
      const res = await request(app).post('/api/v1/diffusion/inscription').send({ email: clientEmail });
      expect(res.statusCode).toEqual(201);
    });

    it('Le client crée un compte officiel', async () => {
      const res = await request(app).post('/api/v1/auth/inscription')
        .send({ nom: 'Client Fidele', email: clientEmail, mot_de_passe: 'MotDePasse1!' });
      expect(res.statusCode).toEqual(201);
      clientToken = res.body.jeton;
    });

    it('Le client tente de se connecter avec un mauvais mot de passe (sécurité)', async () => {
      const res = await request(app).post('/api/v1/auth/connexion')
        .send({ email: clientEmail, mot_de_passe: 'FauxPass' });
      expect(res.statusCode).toEqual(400);
    });

    it('Le client demande une réinitialisation de mot de passe', async () => {
      const res = await request(app).post('/api/v1/auth/reinitialisation-pwd')
        .send({ email: clientEmail });
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('Étape 5 : Shopping et Validation Complexe JSONB', () => {
    it('Le client consulte les offres actives publiquement', async () => {
      const res = await request(app).get('/api/v1/offres');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].titre).toEqual('Soldes sur Tableaux');
    });

    it('Le client tente une commande qui échoue (Rupture de Stock)', async () => {
      const res = await request(app).post('/api/v1/commandes')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email_client: clientEmail, nom_client: 'Client', adresse_livraison: { ville: 'Paris' },
          lignes: [{ variante_produit_id: varianteId, quantite: 10, personnalisations_utilisateur: { texte_central: 'A', cadre: 'Noir' } }]
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Stock insuffisant');
    });

    it('Le client tente une commande qui échoue (Violation du schéma JSONB : Cadre Rouge)', async () => {
      const res = await request(app).post('/api/v1/commandes')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email_client: clientEmail, nom_client: 'Client', adresse_livraison: { ville: 'Paris' },
          lignes: [{ variante_produit_id: varianteId, quantite: 1, personnalisations_utilisateur: { texte_central: 'A', cadre: 'Rouge' } }]
        });
      expect(res.statusCode).toEqual(400);
    });

    it('Le client passe une commande valide avec Coordonnées optionnelles', async () => {
      const res = await request(app).post('/api/v1/commandes')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email_client: clientEmail, nom_client: 'Client Fidele', adresse_livraison: { ville: 'Paris' },
          lignes: [{ 
            variante_produit_id: varianteId, 
            quantite: 1, 
            personnalisations_utilisateur: { texte_central: 'Mon Mariage', cadre: 'Chêne', position_logo: { x: 100, y: 200 } } 
          }]
        });
      expect(res.statusCode).toEqual(201);
      commandeClientId = res.body.id;
    });

    it('Un invité (Guest) passe une commande', async () => {
      const res = await request(app).post('/api/v1/commandes')
        .send({
          email_client: guestEmail, nom_client: 'Guest', adresse_livraison: { ville: 'Nice' },
          lignes: [{ variante_produit_id: varianteId, quantite: 1, personnalisations_utilisateur: { texte_central: 'Vacances', cadre: 'Blanc' } }]
        });
      expect(res.statusCode).toEqual(201);
      guestOrderCode = res.body.code_confirmation;
    });
  });

  describe('Étape 6 : Suivi Invité & Réconciliation Asynchrone', () => {
    it('L\'invité peut suivre sa commande avec son code secret', async () => {
      const res = await request(app).post('/api/v1/commandes/suivi-invite')
        .send({ email_client: guestEmail, code_confirmation: guestOrderCode });
      expect(res.statusCode).toEqual(200);
      expect(res.body.code_confirmation).toEqual(guestOrderCode);
    });

    it('L\'invité décide de s\'inscrire. Ses anciennes commandes lui sont automatiquement réconciliées', async () => {
      const resInscription = await request(app).post('/api/v1/auth/inscription')
        .send({ nom: 'Guest Devenu Client', email: guestEmail, mot_de_passe: 'Securite123!' });
      
      expect(resInscription.statusCode).toEqual(201);
      const newGuestToken = resInscription.body.jeton;

      // Vérifier que la commande invité apparaît maintenant dans son historique protégé
      const resHistorique = await request(app).get('/api/v1/commandes/mes-commandes')
        .set('Authorization', `Bearer ${newGuestToken}`);
      
      expect(resHistorique.statusCode).toEqual(200);
      expect(resHistorique.body.length).toEqual(1);
      expect(resHistorique.body[0].email_client).toEqual(guestEmail);
    });
  });

  describe('Étape 7 : Modération des Commandes et Delivery-Gated Reviews', () => {
    it('Le Client ne peut pas évaluer un produit tant que la commande est EN_ATTENTE', async () => {
      const res = await request(app).post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ produit_id: produitId, note: 5, commentaire: 'Génial' });
      expect(res.statusCode).toEqual(403);
    });

    it('L\'Admin Marketing avance le statut de la commande à EXPEDIEE puis LIVREE', async () => {
      await request(app).put(`/api/v1/commandes/admin/${commandeClientId}/statut`)
        .set('Authorization', `Bearer ${adminMarketingToken}`)
        .send({ statut: 'EXPEDIEE' });
      
      const res = await request(app).put(`/api/v1/commandes/admin/${commandeClientId}/statut`)
        .set('Authorization', `Bearer ${adminMarketingToken}`)
        .send({ statut: 'LIVREE' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.statut).toEqual('LIVREE');
    });

    it('La Porte Logique (Delivery-Gating) s\'ouvre : Le client laisse un avis', async () => {
      const res = await request(app).post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ produit_id: produitId, note: 5, commentaire: 'Reçu en parfait état.' });
      expect(res.statusCode).toEqual(201);
      avisId = res.body.avis.id;
    });

    it('Le client ne peut pas spammer un second avis sur le même produit', async () => {
      const res = await request(app).post('/api/v1/avis')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ produit_id: produitId, note: 4, commentaire: 'Finalement...' });
      expect(res.statusCode).toEqual(400); // Règle: un seul avis par produit
    });

    it('L\'Admin Marketing répond officiellement à l\'avis du client', async () => {
      const res = await request(app).put(`/api/v1/avis/admin/${avisId}/reponse`)
        .set('Authorization', `Bearer ${adminMarketingToken}`)
        .send({ reponse_admin: 'Merci pour votre confiance !' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.avis.reponse_admin).toEqual('Merci pour votre confiance !');
    });
  });

  describe('Étape 8 : Lecture Finale par le Public', () => {
    it('Un visiteur public voit le produit, ses variantes, et son avis avec réponse de l\'admin', async () => {
      const res = await request(app).get(`/api/v1/produits/${produitId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.variantes.length).toBeGreaterThan(0);
      expect(res.body.avis.length).toEqual(1);
      expect(res.body.avis[0].commentaire).toEqual('Reçu en parfait état.');
      expect(res.body.avis[0].reponse_admin).toEqual('Merci pour votre confiance !');
    });
  });
});
