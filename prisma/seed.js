import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bztel.net';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        isAdmin: true,
        role: 'Owner',
        status: 'active',
        balance: 10000,
      },
    });
    console.log(`Admin user created: ${adminEmail}`);

    await prisma.virtualNumber.create({
      data: {
        userId: adminUser.id,
        number: '+1234567890',
        status: 'active',
      },
    });
    console.log(`Admin virtual number created: +1234567890`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
    const adminVn = await prisma.virtualNumber.findFirst({
      where: { userId: existing.id }
    });
    if (!adminVn) {
      await prisma.virtualNumber.create({
        data: {
          userId: existing.id,
          number: '+1234567890',
          status: 'active'
        }
      });
      console.log(`Default virtual number +1234567890 assigned to existing Admin.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
