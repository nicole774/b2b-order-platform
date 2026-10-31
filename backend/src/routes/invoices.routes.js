const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

// GET /api/invoices/:id — détail d'une facture (le propriétaire de la commande ou un ADMIN)
router.get('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: { include: { product: true } },
          // Le client qui a commandé : sans le passwordHash (jamais exposé)
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!invoice) {
    return res.status(404).json({ error: 'Facture introuvable' });
  }

  if (req.user.role !== 'ADMIN' && invoice.order.userId !== req.user.id) {
    return res.status(404).json({ error: 'Facture introuvable' });
  }

  res.json(invoice);
});

module.exports = router;
