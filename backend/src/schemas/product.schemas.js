const { z } = require('zod');

// Règles d'acceptation d'un produit (création ET modification).
// z.coerce.number() convertit "12.5" (chaîne du JSON) en nombre avant de vérifier.
const productSchema = z.object({
  reference: z.string().trim().min(2, 'La référence doit contenir au moins 2 caractères').max(50),
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().positive('Le prix doit être supérieur à 0'),
  stockQuantity: z.coerce
    .number()
    .int('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif')
    .default(0),
});

module.exports = { productSchema };
