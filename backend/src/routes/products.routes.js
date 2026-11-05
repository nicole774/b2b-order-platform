const express = require('express');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { productSchema } = require('../schemas/product.schemas');
const router = express.Router();

// GET /api/products — catalogue public, avec recherche par nom ou référence et pagination
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const search = (req.query.search || '').trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  // ?maxStock=5 : seulement les produits dont le stock est bas (alerte de l'admin)
  if (req.query.maxStock !== undefined) {
    const maxStock = parseInt(req.query.maxStock);
    if (!Number.isInteger(maxStock) || maxStock < 0) {
      return res.status(400).json({ error: 'maxStock invalide' });
    }
    where.stockQuantity = { lte: maxStock };
  }

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
// Un produit déjà commandé ne peut pas être supprimé (onDelete: Restrict).
// PostgreSQL renvoie alors l'erreur 23001 que Prisma ne traduit pas en P2003,
// donc on vérifie avant de supprimer et on répond 409 nous-mêmes.
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const ordered = await prisma.orderItem.count({ where: { productId: id } });
  if (ordered > 0) {
    return res.status(409).json({ error: 'Ce produit figure dans des commandes, il ne peut pas être supprimé' });
  }

  const product = await prisma.product.delete({ where: { id } });

  await logActivity(prisma, req.user.id, 'DELETE_PRODUCT', 'product', id, { reference: product.reference });

  res.status(204).send();
});

module.exports = router;
