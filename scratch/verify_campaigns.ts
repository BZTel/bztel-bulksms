import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

async function testCampaignGrouping() {
  console.log('--- STARTING CAMPAIGN GROUPING VALIDATION ---');

  try {
    // 1. Create a dummy test user or find existing admin user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@bztel.net' }
    });

    if (!user) {
      console.error('❌ Test aborted: Admin user not found in DB');
      return;
    }

    const testUserId = user.id;
    console.log(`Found test user ID: ${testUserId} (Email: ${user.email})`);

    // 2. Generate a test batchId
    const batchId = `test_campaign_${randomUUID().slice(0, 8)}`;
    console.log(`Generated campaign batch ID: ${batchId}`);

    // 3. Create test enqueued logs under this campaign
    console.log('Inserting mock campaign SMS logs...');
    const mockLogs = [
      {
        userId: testUserId,
        senderId: 'BZTEL',
        recipient: '+2348000000001',
        message: 'Hello, this is a test campaign message.',
        credits: 1,
        status: 'sent', // Delivered
        batchId,
      },
      {
        userId: testUserId,
        senderId: 'BZTEL',
        recipient: '+2348000000002',
        message: 'Hello, this is a test campaign message.',
        credits: 1,
        status: 'sent', // Delivered
        batchId,
      },
      {
        userId: testUserId,
        senderId: 'BZTEL',
        recipient: '+2348000000003',
        message: 'Hello, this is a test campaign message.',
        credits: 1,
        status: 'failed', // Failed
        batchId,
      },
      {
        userId: testUserId,
        senderId: 'BZTEL',
        recipient: '+2348000000004',
        message: 'Hello, this is a test campaign message.',
        credits: 1,
        status: 'pending', // Pending
        batchId,
      }
    ];

    await prisma.smsLog.createMany({
      data: mockLogs
    });
    console.log('✅ Mock logs inserted successfully.');

    // 4. Retrieve logs and verify in-memory campaign grouping matching the frontend algorithm
    const logs = await prisma.smsLog.findMany({
      where: { userId: testUserId, batchId },
      orderBy: { sentAt: 'desc' }
    });

    console.log(`Retrieved ${logs.length} logs for campaign ${batchId}.`);

    const campaignGroup = {
      batch_id: batchId,
      sender_id: '',
      message: '',
      total: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      recipients: [] as { recipient: string; status: string }[]
    };

    for (const log of logs) {
      if (!campaignGroup.sender_id) {
        campaignGroup.sender_id = log.senderId;
        campaignGroup.message = log.message;
      }
      campaignGroup.total++;
      if (log.status === 'sent' || log.status === 'delivered') {
        campaignGroup.delivered++;
      } else if (log.status === 'failed') {
        campaignGroup.failed++;
      } else {
        campaignGroup.pending++;
      }
      campaignGroup.recipients.push({
        recipient: log.recipient,
        status: log.status
      });
    }

    // Assert status counts
    console.log('Validating grouped metrics...');
    console.log(`Total: ${campaignGroup.total} (Expected: 4)`);
    console.log(`Delivered: ${campaignGroup.delivered} (Expected: 2)`);
    console.log(`Failed: ${campaignGroup.failed} (Expected: 1)`);
    console.log(`Pending: ${campaignGroup.pending} (Expected: 1)`);

    if (
      campaignGroup.total === 4 &&
      campaignGroup.delivered === 2 &&
      campaignGroup.failed === 1 &&
      campaignGroup.pending === 1
    ) {
      console.log('✅ Grouping logic validation: PASSED');
    } else {
      console.error('❌ Grouping logic validation: FAILED');
    }

    // Clean up test logs
    console.log('Cleaning up mock database logs...');
    await prisma.smsLog.deleteMany({
      where: { batchId }
    });
    console.log('✅ Cleanup complete.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('--- CAMPAIGN GROUPING VALIDATION COMPLETE ---');
}

testCampaignGrouping();
