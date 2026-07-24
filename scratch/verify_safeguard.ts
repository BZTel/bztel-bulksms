import { checkContent, suspendUser } from '../lib/safeguard';
import { prisma } from '../lib/prisma';

async function testSafeguard() {
  console.log('--- STARTING SAFEGUARD VALIDATION ---');

  // 1. Test Content Filtering
  const testCases = [
    { sender: 'GTBANK', msg: 'Dear customer, your credit is low.', expected: true }, // Blocked: GTBANK
    { sender: 'GLO-SMS', msg: 'Sub to our plan.', expected: true }, // Blocked: GLO-SMS starts with GLO
    { sender: 'GLOBAL', msg: 'Hello world.', expected: false }, // Allowed: GLOBAL whitelisted
    { sender: 'BZTEL', msg: 'Get your loan from firstbank now.', expected: true }, // Blocked: firstbank
    { sender: 'BZTEL', msg: 'This is a message from MTN.', expected: true }, // Blocked: MTN
    { sender: 'BZTEL', msg: 'I will meet you at the court tomorrow.', expected: true }, // Blocked: court (whole word)
    { sender: 'BZTEL', msg: 'courtesy of Bztel.', expected: false }, // Allowed: courtesy (court is part of it)
    { sender: 'BZTEL', msg: 'Please check your credit balance. Amt: N5,000.00 Cr', expected: true }, // Blocked: Cr (whole word)
    { sender: 'BZTEL', msg: 'I am crying.', expected: false }, // Allowed: crying (cr is part of it)
    { sender: 'BZTEL', msg: 'Call 08031234567.', expected: false }, // Allowed: 0803 inside number
    { sender: 'BZTEL', msg: 'Your code is 777.', expected: true }, // Blocked: 777 (whole word)
  ];

  let passed = true;
  for (const tc of testCases) {
    const res = checkContent(tc.sender, tc.msg);
    if (res.blocked !== tc.expected) {
      console.error(`❌ Test failed for Sender: [${tc.sender}], Msg: [${tc.msg}]. Expected blocked: ${tc.expected}, Got: ${res.blocked}. Reason: ${res.reason}`);
      passed = false;
    } else {
      console.log(`✅ OK: [${tc.sender.padEnd(8)}] | [${tc.msg.padEnd(55)}] -> Blocked: ${res.blocked}`);
    }
  }

  if (!passed) {
    throw new Error('Content filtering tests failed!');
  }
  console.log('✅ All content filtering checks passed successfully.\n');

  // 2. Test User Account Suspension and Audit Logging
  console.log('--- TESTING ACCOUNT SUSPENSION AND AUDIT LOGS ---');
  
  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@bztel.net' }
  });

  if (!adminUser) {
    console.warn('⚠️ Admin user (admin@bztel.net) not found in database. Skipping DB suspension checks.');
    return;
  }

  console.log(`Found user: ${adminUser.email} (Current Status: ${adminUser.status})`);
  
  // Ensure starting status is active
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { status: 'active' }
  });

  // Trigger suspension
  console.log('Triggering suspendUser...');
  await suspendUser(adminUser.id, 'FAKE_MTN', 'Get your MTN promo code now!');

  // Verify status is suspended
  const updatedUser = await prisma.user.findUnique({
    where: { id: adminUser.id }
  });

  if (!updatedUser || updatedUser.status !== 'suspended') {
    throw new Error(`❌ User status did not update to 'suspended'. Got: ${updatedUser?.status}`);
  }
  console.log('✅ User status successfully updated to suspended.');

  // Verify Audit Log entry
  const lastLog = await prisma.auditLog.findFirst({
    where: { userId: adminUser.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastLog || lastLog.action !== 'USER_SUSPENDED') {
    throw new Error(`❌ Audit log not created or incorrect action. Got: ${JSON.stringify(lastLog)}`);
  }
  console.log('✅ Audit log successfully created with action USER_SUSPENDED.');
  console.log(`Log details: "${lastLog.details}"`);

  // Restore admin status back to active
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { status: 'active' }
  });
  console.log('✅ Restored admin user status back to active.');
  console.log('--- ALL SAFEGUARD TESTS COMPLETED SUCCESSFULLY ---');
}

testSafeguard()
  .catch((err) => {
    console.error('❌ Safeguard test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
