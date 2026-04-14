import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Authentification et RBAC E2E', () => {
  it('Devrait rejeter une connexion sans identifiants', async () => {
    const res = await request(app).post('/api/v1/auth/connexion').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Identifiants invalides.');
  });

  // Notes: Les tests complexes avec Base de Données Mock (jest-prisma)
  // nécessitent le remplissage (seeding) de la Fabrique dans les setUp().
});
