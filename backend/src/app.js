const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Permet de lire le JSON envoyé dans le corps des requêtes (ex. : email + mot de passe)
app.use(express.json());

// Route de test : vérifie que l'API répond
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

module.exports = app;