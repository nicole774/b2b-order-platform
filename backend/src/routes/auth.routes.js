const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middlewares/auth');
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

// POST /api/auth/login — vérifie les identifiants et renvoie un JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email et password sont obligatoires' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Même message que l'email soit inconnu ou le mot de passe faux :
  // on ne révèle pas quels emails ont un compte
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ token });
});

// GET /api/auth/me — renvoie l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  res.json(user);
});

module.exports = router;