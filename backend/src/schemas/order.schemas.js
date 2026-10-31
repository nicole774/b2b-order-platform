const { z } = require('zod');

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED'], {
    message: 'Statut invalide (valeurs possibles : PENDING, CONFIRMED, SHIPPED, CANCELLED)',
  }),
});

module.exports = { statusSchema };
