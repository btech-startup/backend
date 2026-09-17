import { seedDatabase } from '../src/lib/seedData';
import { prisma } from '../src/lib/prisma';

export async function seed() {
  await seedDatabase();
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
