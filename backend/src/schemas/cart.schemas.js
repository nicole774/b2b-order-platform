const { z } = require('zod');

const addItemSchema = z.object({
  productId: z.coerce.number().int().positive('productId invalide'),
  quantity: z.coerce.number().int('La quantité doit être un nombre entier').min(1, 'La quantité doit être au moins 1').default(1),
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int('La quantité doit être un nombre entier').min(1, 'La quantité doit être au moins 1'),
});

module.exports = { addItemSchema, updateItemSchema };
