import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const log = await prisma.smsLog.findUnique({
    where: { id: 19 }
  });
  console.log('SMS Log 19 database record:', log);
}

main().catch(console.error).finally(() => prisma.$disconnect());
