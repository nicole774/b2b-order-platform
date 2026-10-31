const { z } = require('zod');

// Règles d'acceptation pour l'inscription et la connexion.
// z.email() vérifie le format ; .min() la longueur ; .trim() retire les espaces autour.
const registerSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe obligatoire'),
});

module.exports = { registerSchema, loginSchema };
