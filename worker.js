import smpp from 'smpp';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Configure connection parameters from environment or fallbacks
const SMPP_HOST = process.env.SMPP_HOST || '185.135.128.114'; // Monty Mobile SMSC IP
const SMPP_PORT = parseInt(process.env.SMPP_PORT || '9001');   // Monty Mobile SMSC Port
const SMPP_SYSTEM_ID = process.env.SMPP_SYSTEM_ID || 'TEMP_SYSTEM_ID';
const SMPP_PASSWORD = process.env.SMPP_PASSWORD || 'TEMP_PASSWORD';
const SMPP_SYSTEM_TYPE = process.env.SMPP_SYSTEM_TYPE || 'SMPP';

let session = null;
let isConnecting = false;
let enquireLinkInterval = null;
let isProcessing = false;

// ── SMPP Connection Management ──────────────────────────────────────────────

function connectSMPP() {
  if (session || isConnecting) return;
  isConnecting = true;
  console.log(`[SMPP] Connecting to host ${SMPP_HOST}:${SMPP_PORT}...`);

  session = smpp.connect({
    host: SMPP_HOST,
    port: SMPP_PORT
  }, () => {
    console.log('[SMPP] Socket connection established. Binding transceiver...');
    
    session.bind_transceiver({
      system_id: SMPP_SYSTEM_ID,
      password: SMPP_PASSWORD,
      system_type: SMPP_SYSTEM_TYPE
    }, (pdu) => {
      isConnecting = false;
      if (pdu.command_status === 0) {
        console.log('[SMPP] Successfully bound as Transceiver!');
        startEnquireLink();
        processQueue(); // Start polling the Supabase queue
      } else {
        console.error(`[SMPP] Bind failed with command_status: ${pdu.command_status}`);
        reconnect();
      }
    });
  });

  session.on('close', () => {
    console.log('[SMPP] Connection closed by remote host.');
    reconnect();
  });

  session.on('error', (err) => {
    console.error('[SMPP] Session connection error:', err);
    reconnect();
  });
  
  // Handle incoming delivery receipts or mobile-originated (MO) SMS
  session.on('deliver_sm', (pdu) => {
    console.log('[SMPP] Incoming deliver_sm PDU received:', pdu);
    
    // Always acknowledge the incoming deliver_sm request back to the SMSC
    session.send(pdu.createResponse());
    
    handleIncomingDeliverSM(pdu);
  });
}

function startEnquireLink() {
  stopEnquireLink();
  // Keep connection alive with heartbeats every 30 seconds
  enquireLinkInterval = setInterval(() => {
    if (session) {
      console.log('[SMPP] Sending enquire_link heartbeat...');
      session.enquire_link({}, (pdu) => {
        if (pdu.command_status !== 0) {
          console.error('[SMPP] Heartbeat enquire_link failed. Reconnecting...');
          reconnect();
        }
      });
    }
  }, 30000);
}

function stopEnquireLink() {
  if (enquireLinkInterval) {
    clearInterval(enquireLinkInterval);
    enquireLinkInterval = null;
  }
}

function reconnect() {
  stopEnquireLink();
  if (session) {
    try {
      session.close();
    } catch (e) {}
    session = null;
  }
  isConnecting = false;
  console.log('[SMPP] Reconnecting in 5 seconds...');
  setTimeout(connectSMPP, 5000);
}

// ── Outgoing SMS Queue Processing (Supabase Database Queue) ───────────────────

async function processQueue() {
  if (isProcessing) return;
  
  // Ensure we are fully bound before sending
  if (!session || isConnecting) {
    return;
  }
  
  isProcessing = true;

  try {
    // Pull pending messages from the Supabase database
    const pendingLogs = await prisma.smsLog.findMany({
      where: { status: 'pending' },
      take: 20 // Pull batch size corresponding to the 20 SMS/sec limit
    });

    if (pendingLogs.length === 0) {
      isProcessing = false;
      // Re-poll the database in 1 second
      setTimeout(processQueue, 1000);
      return;
    }

    console.log(`[Worker] Found ${pendingLogs.length} pending messages to dispatch.`);

    for (const log of pendingLogs) {
      await sendSMS(log);
      
      // Enforce pacing delay (approx. 50ms per message to respect the 20 SMS/sec limit)
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('[Worker] Error in queue processing loop:', error);
  } finally {
    isProcessing = false;
    // Immediately check queue again for any new pending tasks
    setTimeout(processQueue, 100);
  }
}

// Submit a single message via SMPP
async function sendSMS(log) {
  return new Promise((resolve) => {
    if (!session) {
      console.error(`[Worker] Cannot send message ${log.id}: No active SMPP session.`);
      resolve();
      return;
    }

    // Clean phone number from non-digits (remove +, spaces, etc.) for destination address
    const cleanRecipient = log.recipient.replace(/[^0-9]/g, '');

    // Check if Sender ID is alphanumeric
    const isAlphanumeric = /[a-zA-Z]/.test(log.senderId);
    
    // Clean Sender ID if it's a numeric phone number (remove +, spaces, etc.)
    const cleanSenderId = (log.senderId.startsWith('+') || /^\d+$/.test(log.senderId))
      ? log.senderId.replace(/[^0-9]/g, '')
      : log.senderId;

    const source_addr_ton = isAlphanumeric ? 5 : 1; // 5 = Alphanumeric, 1 = International
    const source_addr_npi = isAlphanumeric ? 0 : 1; // 0 = Unknown, 1 = ISDN

    const pduParams = {
      destination_addr: cleanRecipient,
      dest_addr_ton: 1,      // 1 = International
      dest_addr_npi: 1,      // 1 = ISDN
      source_addr: cleanSenderId,
      source_addr_ton: source_addr_ton,
      source_addr_npi: source_addr_npi,
      registered_delivery: 1 // Request delivery receipt (DLR)
    };

    if (log.message.length > 160) {
      pduParams.short_message = ''; // empty string as we use payload
      pduParams.message_payload = log.message;
    } else {
      pduParams.short_message = log.message;
    }

    console.log(`[Worker] Submitting SMS log ${log.id} to recipient ${cleanRecipient} via ${cleanSenderId}...`);

    session.submit_sm(pduParams, async (pdu) => {
      try {
        if (pdu.command_status === 0) {
          console.log(`[Worker] SMS ${log.id} successfully submitted. Message ID: ${pdu.message_id}`);
          await prisma.smsLog.update({
            where: { id: log.id },
            data: { 
              status: 'submitted',
              providerId: pdu.message_id ? pdu.message_id.toString() : null
            }
          });
        } else {
          console.error(`[Worker] SMS ${log.id} submission failed. SMPP Error code: ${pdu.command_status}`);
          await prisma.smsLog.update({
            where: { id: log.id },
            data: { status: 'failed' }
          });
        }
      } catch (err) {
        console.error(`[Worker] Failed to update SMS status in DB for log ${log.id}:`, err);
      }
      resolve();
    });
  });
}

// ── Inbound Mobile-Originated (MO) SMS Delivery ──────────────────────────────

async function handleIncomingDeliverSM(pdu) {
  try {
    const from = pdu.source_addr ? pdu.source_addr.toString() : '';
    const to = pdu.destination_addr ? pdu.destination_addr.toString() : '';
    
    // Check if it is a delivery receipt (DLR) instead of a text message
    if (pdu.esm_class & 0x04) {
      console.log('[Worker] Incoming message is a Delivery Receipt (DLR). Parsing status...');
      
      const msgText = pdu.short_message 
        ? (pdu.short_message.message || pdu.short_message).toString() 
        : '';
        
      console.log(`[Worker DLR] DLR Text: "${msgText}"`);
      
      const idMatch = msgText.match(/id:([^\s]+)/i);
      const statMatch = msgText.match(/stat:([A-Z]+)/i);
      
      if (!idMatch || !statMatch) {
        console.warn('[Worker DLR] Could not parse Message ID or Status from DLR text');
        return;
      }
      
      const dlrMsgId = idMatch[1];
      const statusStr = statMatch[1];
      
      let status = 'failed';
      if (statusStr === 'DELIVRD') {
        status = 'delivered';
      } else if (statusStr === 'ACCEPTD') {
        status = 'submitted';
      } else {
        status = 'failed';
      }
      
      // DLR message ID might be in decimal or hex. Look for both formats in the DB.
      let hexMsgId = '';
      let decMsgId = '';

      if (/^\d+$/.test(dlrMsgId)) {
        decMsgId = dlrMsgId;
        hexMsgId = parseInt(dlrMsgId, 10).toString(16);
      } else {
        hexMsgId = dlrMsgId.toLowerCase();
        try {
          decMsgId = parseInt(dlrMsgId, 16).toString(10);
        } catch (e) {}
      }

      console.log(`[Worker DLR] Searching for SMS log with providerId matching: '${dlrMsgId}' or hex: '${hexMsgId}' or dec: '${decMsgId}'`);

      const smsLog = await prisma.smsLog.findFirst({
        where: {
          OR: [
            { providerId: dlrMsgId },
            ...(hexMsgId ? [{ providerId: hexMsgId }] : []),
            ...(hexMsgId ? [{ providerId: hexMsgId.toUpperCase() }] : []),
            ...(hexMsgId ? [{ providerId: hexMsgId.padStart(8, '0') }] : []),
            ...(hexMsgId ? [{ providerId: hexMsgId.toUpperCase().padStart(8, '0') }] : []),
            ...(decMsgId ? [{ providerId: decMsgId }] : [])
          ]
        }
      });

      if (smsLog) {
        await prisma.smsLog.update({
          where: { id: smsLog.id },
          data: { status }
        });
        console.log(`[Worker DLR] Successfully updated SMS Log ${smsLog.id} status to: ${status}`);
      } else {
        console.warn(`[Worker DLR] No SMS log found for DLR message ID: ${dlrMsgId}`);
      }
      return;
    }

    const message = pdu.short_message && pdu.short_message.message ? pdu.short_message.message.toString() : '';
    
    if (!from || !to || !message) {
      console.warn('[Worker] Received incomplete deliver_sm message payload. Skipping DB save.');
      return;
    }

    console.log(`[Worker] Inbound message received from: ${from} | to: ${to} | content: "${message}"`);

    // Find the virtual number mapping in Supabase database
    let virtualNumRecord = await prisma.virtualNumber.findFirst({
      where: { number: to }
    });

    // Fallback suffix match (handles formatting discrepancies like leading '+' or country codes)
    if (!virtualNumRecord) {
      const sanitizedTo = to.replace(/[^0-9]/g, '');
      const allNumbers = await prisma.virtualNumber.findMany();
      virtualNumRecord = allNumbers.find(vn => {
        const sanitizedVn = vn.number.replace(/[^0-9]/g, '');
        return sanitizedTo.endsWith(sanitizedVn) || sanitizedVn.endsWith(sanitizedTo);
      }) || null;
    }

    if (virtualNumRecord) {
      const incomingMsg = await prisma.incomingMessage.create({
        data: {
          userId: virtualNumRecord.userId,
          from,
          to,
          message,
          providerId: pdu.message_id || 'smpp_delivered'
        }
      });
      console.log(`[Worker] Saved incoming message in database. Log ID: ${incomingMsg.id}`);
    } else {
      console.warn(`[Worker] Received message for an unmapped virtual number: ${to}`);
    }
  } catch (err) {
    console.error('[Worker] Error processing incoming deliver_sm:', err);
  }
}

// ── Startup ──────────────────────────────────────────────────────────────────

// Start the worker process
connectSMPP();
console.log('[Worker] Standalone Background Worker started.');
