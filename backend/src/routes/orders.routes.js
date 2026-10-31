const express = require('express');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { statusSchema } = require('../schemas/order.schemas');
const router = express.Router();

// Fabrique le prochain numéro de facture, ex. FAC-2026-00042
async function nextInvoiceNumber(tx) {
  const count = await tx.invoice.count();
  const year = new Date().getFullYear();
  return `FAC-${year}-${String(count + 1).padStart(5, '0')}`;
}

// POST /api/orders — transforme le panier en commande (CLIENT uniquement)
router.post('/', authenticate, requireRole('CLIENT'), async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Votre panier est vide' });
  }

  try {
    // TOUT ou RIEN : si une étape échoue, aucune modification n'est conservée.
    // C'est l'exigence F5 du document (commande + facture + stock dans une transaction).
    const order = await prisma.$transaction(async (tx) => {
      let total = 0;

      for (const item of cart.items) {
        // Décrémente le stock SEULEMENT s'il reste assez — en une seule opération
        // atomique, pas un "lire puis vérifier puis écrire" qui laisse une fenêtre
        // à deux commandes simultanées.
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          // Erreur volontaire avec statusCode → annule toute la transaction (rollback)
          throw Object.assign(
            new Error(`Stock insuffisant pour "${item.product.name}" (il reste ${item.product.stockQuantity})`),
            { statusCode: 400 }
          );
        }

        total += Number(item.product.price) * item.quantity;
      }

      const created = await tx.order.create({
        data: {
          userId: req.user.id,
          total,
          // Le prix unitaire est figé dans la commande : si le prix du produit
          // change plus tard, les anciennes commandes restent justes
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          },
          invoice: {
            create: { number: await nextInvoiceNumber(tx), total },
          },
        },
        include: { items: { include: { product: true } }, invoice: true },
      });

      // Le panier a été transformé : on le vide
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Log dans la même transaction : si la commande est annulée, pas de log fantôme
      await logActivity(tx, req.user.id, 'CREATE_ORDER', 'order', created.id, { total });

      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    // Erreur métier (stock insuffisant) → message clair ; le reste part à l'errorHandler
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    throw err;
  }
});

// GET /api/orders — les siennes (CLIENT) ou toutes (ADMIN)
router.get('/', authenticate, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, invoice: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
});

// GET /api/orders/:id — détail d'une commande (le propriétaire ou un ADMIN)
router.get('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, invoice: true },
  });

  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  res.json(order);
});

// PATCH /api/orders/:id/status — changer le statut (ADMIN uniquement)
router.patch('/:id/status', authenticate, requireRole('ADMIN'), validate(statusSchema), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  // Une commande annulée ou déjà expédiée ne repart pas en arrière
  if (existing.status === 'CANCELLED' || existing.status === 'SHIPPED') {
    return res.status(409).json({ error: `Impossible de modifier une commande ${existing.status}` });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: req.body.status },
    include: { items: { include: { product: true } }, invoice: true },
  });

  await logActivity(prisma, req.user.id, 'UPDATE_ORDER_STATUS', 'order', id, {
    from: existing.status,
    to: req.body.status,
  });

  res.json(order);
});

module.exports = router;
