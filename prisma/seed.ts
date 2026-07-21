import bcrypt from 'bcrypt';
import 'dotenv/config';
import { prisma } from '../src/config/db.js';
import { ensureApplicationDefaults } from '../src/services/bootstrap.service.js';

const main = async () => {
  await ensureApplicationDefaults();
  const passwordHash = await bcrypt.hash('Password123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@etracker.com' },
    update: { role: 'ADMIN', isActive: true },
    create: {
      name: 'Admin User',
      email: 'admin@etracker.com',
      passwordHash,
      role: 'ADMIN',
      currency: 'USD',
    },
  });
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
