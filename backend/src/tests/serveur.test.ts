import request from 'supertest';
import app from '../serveur';

describe('Vérification du Serveur API v1', () => {
  it('devrait retourner le status opérationnel avec succès', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
  });
});
