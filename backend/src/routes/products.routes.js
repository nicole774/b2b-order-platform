const express = require('express');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { productSchema } = require('../schemas/product.schemas');
const router = express.Router();

// GET /api/products — catalogue public, avec recherche par nom et pagination
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const search = (req.query.search || '').trim();

  const where = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};

  // Les 2 requêtes partagent la même condition : elles partent en même temps
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/products/:id — détail d'un produit (public)
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  res.json(product);
});

// POST /api/products — création (ADMIN uniquement)
router.post('/', authenticate, requireRole('ADMIN'), validate(productSchema), async (req, res) => {
  const { reference, name, description, price, stockQuantity } = req.body;

  const product = await prisma.product.create({
    data: { reference, name, description, price, stockQuantity },
  });

  await logActivity(prisma, req.user.id, 'CREATE_PRODUCT', 'product', product.id, { reference });

  res.status(201).json(product);
});

// PUT /api/products/:id — modification (ADMIN uniquement)
router.put('/:id', authenticate, requireRole('ADMIN'), validate(productSchema), async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const { reference, name, description, price, stockQuantity } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: { reference, name, description, price, stockQuantity },
  });

  await logActivity(prisma, req.user.id, 'UPDATE_PRODUCT', 'product', product.id, { reference });

  res.json(product);
});

// DELETE /api/products/:id — suppression (ADMIN uniquement)
// Si le produit appartient à une commande, Prisma lève P2003 (onDelete: Restrict)
// et l'errorHandler répond 409.
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const product = await prisma.product.delete({ where: { id } });

  await logActivity(prisma, req.user.id, 'DELETE_PRODUCT', 'product', id, { reference: product.reference });

  res.status(204).send();
});

module.exports = router;
