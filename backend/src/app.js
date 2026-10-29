const express = require('express');

const app = express();

// Permet de lire le JSON envoyé dans le corps des requêtes (ex. : email + mot de passe)
app.use(express.json());

// Route de test : vérifie que l'API répond
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;