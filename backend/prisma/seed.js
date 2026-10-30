// Données de démonstration : 1 admin, 1 client, 8 produits
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// [référence, nom, prix, stock]
const products = [
  ['REF-001', 'Ramette papier A4 (carton de 5)', 24.9, 120],
  ['REF-002', 'Stylos bille bleus (boîte de 50)', 12.5, 80],
  ['REF-003', 'Classeurs à levier (lot de 10)', 35.0, 40],
  ['REF-004', 'Cartouche toner noir', 89.99, 15],
  ['REF-005', 'Chaise de bureau ergonomique', 179.0, 8],
  ['REF-006', 'Écran 24 pouces Full HD', 149.0, 12],
  ['REF-007', 'Agrafeuse 25 feuilles', 14.0, 3],  // stock bas : pour tester l'alerte
  ['REF-008', 'Câble HDMI 2 m', 7.5, 0],          // rupture : pour tester le stock insuffisant
];

async function main() {
  // Mots de passe de démonstration uniquement
  const users = [
    { email: 'admin@b2b.test', name: 'Admin Distributeur', password: 'Admin123!', role: 'ADMIN' },
    { email: 'client@b2b.test', name: 'Entreprise Démo', password: 'Client123!', role: 'CLIENT' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    // upsert = « crée s'il n'existe pas » : on peut relancer le seed sans créer de doublons
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash, role: u.role },
    });
  }

  for (const [reference, name, price, stockQuantity] of products) {
    await prisma.product.upsert({
      where: { reference },
      update: {},
      create: { reference, name, price, stockQuantity },
    });
  }

  console.log(`Seed terminé : ${users.length} utilisateurs, ${products.length} produits`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());