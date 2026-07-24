import { prisma } from '../lib/prisma';
import crypto from 'crypto';

async function testApiKeyLifecycle() {
  console.log('--- STARTING DEVELOPER API KEYS VALIDATION ---');

  try {
    // 1. Retrieve the test admin user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@bztel.net' }
    });

    if (!user) {
      console.error('❌ Test aborted: Admin user not found');
      return;
    }

    const testUserId = user.id;
    const keyName = 'Test Verification Key';

    // 2. Generate a secure random key
    const secureKey = 'bztel_live_' + crypto.randomBytes(20).toString('hex');
    console.log(`Generated mock secure key: ${secureKey}`);

    // 3. Create the API Key in the database
    const createdKey = await prisma.apiKey.create({
      data: {
        userId: testUserId,
        key: secureKey,
        name: keyName
      }
    });
    console.log(`✅ API Key successfully stored in database. ID: ${createdKey.id}`);

    // 4. Authenticate lookup check
    const lookupKey = await prisma.apiKey.findUnique({
      where: { key: secureKey },
      select: { userId: true, name: true }
    });

    if (lookupKey && lookupKey.userId === testUserId) {
      console.log(`✅ Bearer Auth Token lookup check: PASSED (Owner match: ${lookupKey.name})`);
    } else {
      console.error('❌ Bearer Auth Token lookup check: FAILED');
    }

    // 5. Query lists and verify masking logic matching route.ts
    const keysList = await prisma.apiKey.findMany({
      where: { userId: testUserId }
    });

    const maskedKeys = keysList.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: k.key.substring(0, 11) + '...' + k.key.substring(k.key.length - 4),
    }));

    const foundMasked = maskedKeys.find(k => k.id === createdKey.id);
    if (foundMasked && foundMasked.maskedKey.startsWith('bztel_live_') && foundMasked.maskedKey.includes('...')) {
      console.log(`✅ Key masking layout validation: PASSED (Masked Key: ${foundMasked.maskedKey})`);
    } else {
      console.error('❌ Key masking layout validation: FAILED');
    }

    // 6. Delete/Revoke API key
    await prisma.apiKey.delete({
      where: { id: createdKey.id }
    });
    console.log('✅ API Key revoked and deleted from database.');

    // Confirm it's gone
    const finalLookup = await prisma.apiKey.findUnique({
      where: { key: secureKey }
    });

    if (!finalLookup) {
      console.log('✅ Revocation verification check: PASSED (Key no longer exists)');
    } else {
      console.error('❌ Revocation verification check: FAILED');
    }

  } catch (err) {
    console.error('❌ API Key verification test failed with error:', err);
  }

  console.log('--- DEVELOPER API KEYS VALIDATION COMPLETE ---');
}

testApiKeyLifecycle();
