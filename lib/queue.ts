import { prisma } from '@/lib/prisma';
import { broadcastMessage } from '@/lib/telemetry';

const globalForQueue = globalThis as unknown as {
  queueActive: boolean | undefined;
};

export function triggerWorker() {
  if (globalForQueue.queueActive) {
    return;
  }
  globalForQueue.queueActive = true;
  processQueue();
}

async function processQueue() {
  try {
    // 1. Fetch pending SMS logs
    const pendingLogs = await prisma.smsLog.findMany({
      where: { status: 'pending' },
      take: 100
    });

    if (pendingLogs.length === 0) {
      globalForQueue.queueActive = false;
      return;
    }

    console.log(`[Queue Worker] Processing ${pendingLogs.length} pending SMS messages...`);

    // Simulate SMS dispatch latency (e.g. 2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update logs (95% success rate)
    await prisma.$transaction(
      pendingLogs.map((log) =>
        prisma.smsLog.update({
          where: { id: log.id },
          data: { status: Math.random() > 0.05 ? 'sent' : 'failed' }
        })
      )
    );

    console.log(`[Queue Worker] Batch updated successfully.`);

    // Broadcast update to telemetry clients
    broadcastMessage({
      type: 'SMS_UPDATED',
      timestamp: Date.now()
    });

    // Continue loop
    setTimeout(processQueue, 500);

  } catch (error) {
    console.error('[Queue Worker] Error processing queue:', error);
    globalForQueue.queueActive = false;
  }
}
