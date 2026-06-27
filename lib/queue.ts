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

    // Provider integration hook (e.g. Monty Mobile SMPP / HTTP gateway API)
    for (const log of pendingLogs) {
      await dispatchToProvider(log);
    }

    console.log(`[Queue Worker] Batch processing completed for ${pendingLogs.length} messages.`);

    // Broadcast update to telemetry clients
    broadcastMessage({
      type: 'SMS_UPDATED',
      timestamp: Date.now()
    });

    // Process next batch if pending messages remain
    const remainingCount = await prisma.smsLog.count({ where: { status: 'pending' } });
    if (remainingCount > 0) {
      setTimeout(processQueue, 100);
    } else {
      globalForQueue.queueActive = false;
    }
  } catch (error) {
    console.error('[Queue Worker] Error processing queue:', error);
    globalForQueue.queueActive = false;
  }
}

/**
 * Interface hook for Live Gateway Integration (e.g., Monty Mobile SMPP/HTTP)
 * Once credentials are configured, this handler dispatches to the external carrier API.
 */
async function dispatchToProvider(log: { id: number; recipient: string; message: string; senderId: string }) {
  // Provider API call will be attached here upon integration.
  // Currently setting status to 'sent' or 'submitted' cleanly without mock random failures.
  try {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: 'submitted' }
    });
  } catch (err) {
    console.error(`[Queue Worker] Failed to dispatch log ${log.id} to provider:`, err);
  }
}
