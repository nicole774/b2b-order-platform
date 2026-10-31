const express = require('express');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addItemSchema, updateItemSchema } = require('../schemas/cart.schemas');
const router = express.Router();

// Toutes les routes du panier sont réservées aux clients (voir exigences, section 2)
router.use(authenticate, requireRole('CLIENT'));

// Recherche le panier de l'utilisateur, le crée s'il n'existe pas encore.
// `userId @unique` dans le schéma garantit un seul panier par utilisateur.
async function findOrCreateCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

// Reconstruit le panier avec les produits et le total, prêt à afficher
async function getCartDetails(cartId) {
  const cart = await prisma.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: { items: { include: { product: true }, orderBy: { id: 'asc' } } },
  });

  const total = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  return { ...cart, total };
}

// GET /api/cart — voir son panier
router.get('/', async (req, res) => {
  const cart = await findOrCreateCart(req.user.id);
  res.json(await getCartDetails(cart.id));
});

// POST /api/cart/items — ajouter un produit
router.post('/items', validate(addItemSchema), async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }
  if (product.stockQuantity === 0) {
    return res.status(400).json({ error: 'Ce produit est en rupture de stock' });
  }

  const cart = await findOrCreateCart(req.user.id);

  // Une seule ligne par produit dans le panier : si le produit y est déjà,
  // upsert incrémente la quantité au lieu de créer un doublon
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const newQuantity = (existing ? existing.quantity : 0) + quantity;

  if (newQuantity > product.stockQuantity) {
    return res.status(400).json({
      error: `Stock insuffisant : ${product.stockQuantity} disponible(s), vous demandez ${newQuantity}`,
    });
  }

  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: newQuantity },
    create: { cartId: cart.id, productId, quantity: newQuantity },
  });

  await logActivity(prisma, req.user.id, 'ADD_TO_CART', 'product', productId, { quantity: newQuantity });

  res.status(201).json(await getCartDetails(cart.id));
});

// PATCH /api/cart/items/:itemId — changer la quantité d'une ligne
router.patch('/items/:itemId', validate(updateItemSchema), async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // La ligne doit exister ET appartenir au panier de l'utilisateur connecté
  // (sinon un client pourrait modifier le panier d'un autre — cas CT-08)
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ error: 'Ligne de panier introuvable' });
  }

  if (req.body.quantity > item.product.stockQuantity) {
    return res.status(400).json({
      error: `Stock insuffisant : ${item.product.stockQuantity} disponible(s)`,
    });
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: req.body.quantity } });

  res.json(await getCartDetails(item.cartId));
});

// DELETE /api/cart/items/:itemId — retirer une ligne du panier
router.delete('/items/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ error: 'Ligne de panier introuvable' });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  res.json(await getCartDetails(item.cartId));
});

module.exports = router;
