import request from 'supertest';
import app from '../serveur';
import { prisma } from '../config/db';
import { genererToken } from '../utils/jwt';

describe('Création et validation d\'un produit avec schéma de personnalisation', () => {
  let adminToken: string;
  let categorieId: string;

  beforeAll(async () => {
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Administrateur Produit',
        email: 'admin-produit@woodprint.test',
        mot_de_passe: 'pwd_hash',
        role: 'ADMIN'
      }
    });

    const moduleGestion = await prisma.moduleSysteme.create({
      data: { nom: 'GESTION_PRODUITS' }
    });

    await prisma.permissionAdmin.create({
      data: { utilisateur_id: admin.id, module_id: moduleGestion.id }
    });

    adminToken = genererToken({ id: admin.id, role: admin.role });

    const categorie = await prisma.categorie.create({
      data: { nom: 'Accessoires Bureau' }
    });
    categorieId = categorie.id;
  });

  afterAll(async () => {
    await prisma.produit.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.permissionAdmin.deleteMany();
    await prisma.moduleSysteme.deleteMany();
    await prisma.utilisateur.deleteMany();
  });

  it('Doit rejeter un schema_personnalisation contenant un type non reconnu', async () => {
    const payloadInvalide = {
      titre: 'Pot à Crayons',
      prix_de_base: 15.0,
      categorie_id: categorieId,
      schema_personnalisation: [
        { id: 'champ-1', nom: 'Texte', type: 'format_invalide', requis: true }
      ]
    };

    const res = await request(app)
      .post('/api/v1/produits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payloadInvalide);

    expect(res.statusCode).toEqual(400);
  });

  it('Doit créer un produit avec un générateur de configuration complet', async () => {
    const schemaHybrideUI = [
      { id: 'upload-image', nom: 'Logo entreprise', type: 'image', requis: true },
      { id: 'texte-gravure', nom: 'Slogan', type: 'texte', requis: false },
      { id: 'finition-select', nom: 'Matière', type: 'select', requis: true, options: ['Chêne', 'Noyer'] }
    ];

    const res = await request(app)
      .post('/api/v1/produits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        titre: 'Support PC Portable',
        description: 'Support en bois personnalisable.',
        prix_de_base: 35.0,
        categorie_id: categorieId,
        schema_personnalisation: schemaHybrideUI
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.schema_personnalisation).toHaveLength(3);
  });

  it('Doit exposer publiquement le schéma de personnalisation intact via l\'API', async () => {
    const res = await request(app).get('/api/v1/produits');
    expect(res.statusCode).toEqual(200);

    const produitExpose = res.body.find((p: any) => p.titre === 'Support PC Portable');
    expect(produitExpose).toBeDefined();

    const schemaExpose = produitExpose.schema_personnalisation;
    const finitionSelect = schemaExpose.find((champ: any) => champ.id === 'finition-select');
    
    expect(finitionSelect).toBeDefined();
    expect(finitionSelect.options).toContain('Noyer');
  });
});
