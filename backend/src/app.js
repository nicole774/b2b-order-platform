const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/orders.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Autorise le frontend (qui tournera sur un autre port) à appeler l'API
app.use(cors());
// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());

// Route de test : vérifie que l'API répond
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Aucune route ne correspond → 404 en JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// Toujours en dernier : il attrape les erreurs de toutes les routes au-dessus
app.use(errorHandler);

module.exports = app;
