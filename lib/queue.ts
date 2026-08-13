import { prisma } from '@/lib/prisma';
import { broadcastMessage } from '@/lib/telemetry';

const globalForQueue = globalThis as unknown as {
  queueActive: boolean | undefined;
};

export function triggerWorker() {
  if (process.env.SMPP_ENABLED === 'true') {
    return;
  }
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

    await broadcastBatchProgress(pendingLogs);

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
 * Emits a BROADCAST_PROGRESS telemetry event per distinct batchId touched in this chunk,
 * with cumulative counts across the whole batch (not just this chunk) — a batch can span
 * many chunks since the worker only processes 100 rows per pass.
 */
async function broadcastBatchProgress(processedLogs: { batchId: string | null }[]) {
  const batchIds = [...new Set(processedLogs.map((l) => l.batchId).filter((id): id is string => !!id))];
  if (batchIds.length === 0) return;

  for (const batchId of batchIds) {
    const statusCounts = await prisma.smsLog.groupBy({
      by: ['status'],
      where: { batchId },
      _count: { _all: true },
    });

    let sent = 0;
    let failed = 0;
    let pending = 0;
    let total = 0;

    for (const s of statusCounts) {
      const count = s._count._all || 0;
      total += count;
      if (s.status === 'sent' || s.status === 'submitted' || s.status === 'delivered') sent += count;
      else if (s.status === 'failed') failed += count;
      else if (s.status === 'pending') pending += count;
    }

    broadcastMessage({ type: 'BROADCAST_PROGRESS', batchId, sent, failed, pending, total });
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
    const cleanRecipient = log.recipient.replace(/[^0-9]/g, '');
    if (!cleanRecipient.startsWith('234') || cleanRecipient.length !== 13) {
      console.warn(`[Queue Worker] Blocked non-Nigerian recipient: ${cleanRecipient || log.recipient} for log ${log.id}`);
      await prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'failed' }
      });
      return;
    }

    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: 'sent' }
    });
  } catch (err) {
    console.error(`[Queue Worker] Failed to dispatch log ${log.id} to provider:`, err);
  }
}
