import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import categoriesRoutes from './routes/categories.routes';
import produitsRoutes from './routes/produits.routes';
import variantesRoutes from './routes/variantes.routes';
import mediasRoutes from './routes/medias.routes';
import commandesRoutes from './routes/commandes.routes';
import avisRoutes from './routes/avis.routes';
import parametresRoutes from './routes/parametres.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/produits', produitsRoutes);
app.use('/api/v1/produits/:produit_id/variantes', variantesRoutes);
app.use('/api/v1/medias', mediasRoutes);
app.use('/api/v1/commandes', commandesRoutes);
app.use('/api/v1/avis', avisRoutes);
app.use('/api/v1/parametres', parametresRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API WoodPrint v1 opérationnelle.' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}

export default app;
