import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Inserting test SMS log into outbox queue...');
  
  const log = await prisma.smsLog.create({
    data: {
      userId: 1, // Existent user
      senderId: 'VERIFYID', // Approved Sender ID
      recipient: '+2348123456789', // Example recipient phone
      message: 'Hello, this is a test SMS from BZTel system. Code: 7392.',
      credits: 1,
      status: 'pending'
    }
  });

  console.log('Successfully queued SMS log:', log);
  console.log('Waiting 5 seconds for EC2 worker to process...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const updatedLog = await prisma.smsLog.findUnique({
    where: { id: log.id }
  });

  console.log('\n--- VERIFICATION RESULT ---');
  console.log('Status:', updatedLog.status);
  console.log('Provider Message ID:', updatedLog.providerId);
  console.log('---------------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
