const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

const router = express.Router();

// POST /api/auth/register — création d'un compte CLIENT
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password et name sont obligatoires' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  // 10 rounds : bon compromis entre sécurité et rapidité (décision D3)
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    // On choisit les champs renvoyés : passwordHash n'est jamais exposé
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

module.exports = router;