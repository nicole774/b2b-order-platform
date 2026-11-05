const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middlewares/auth');
const router = express.Router();

// Tout ce qui suit est réservé à l'ADMIN
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/audit-logs — journal d'activité (exigence F9, cas de test CT-06)
// Filtres optionnels : ?userId=2&action=CREATE_ORDER&email=client&limit=50&page=2
router.get('/audit-logs', async (req, res) => {
  const where = {};

  if (req.query.userId) {
    const userId = parseInt(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId invalide' });
    }
    where.userId = userId;
  }

  if (req.query.action) {
    where.action = String(req.query.action);
  }

  if (req.query.email) {
    where.user = { email: { contains: String(req.query.email), mode: 'insensitive' } };
  }

  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const page = Math.max(1, parseInt(req.query.page) || 1);

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  res.json(logs);
});

module.exports = router;
