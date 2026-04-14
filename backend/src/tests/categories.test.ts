import request from 'supertest';
import express from 'express';
import categoriesRoutes from '../routes/categories.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/categories', categoriesRoutes);

describe('Categories E2E', () => {
  it('Devrait récupérer la liste des catégories publiquement (200)', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
