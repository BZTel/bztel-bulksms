import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const senderIds = await prisma.senderId.findMany();
  console.log('Sender IDs:', senderIds);
  const virtualNumbers = await prisma.virtualNumber.findMany();
  console.log('Virtual Numbers:', virtualNumbers);
  const pendingLogsCount = await prisma.smsLog.count({ where: { status: 'pending' } });
  console.log('Pending logs count:', pendingLogsCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
