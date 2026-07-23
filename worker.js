import smpp from 'smpp';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Configure connection parameters from environment or fallbacks
const SMPP_HOST = process.env.SMPP_HOST || '185.135.128.114'; // Monty Mobile SMSC IP
const SMPP_PORT = parseInt(process.env.SMPP_PORT || '9001');   // Monty Mobile SMSC Port
const SMPP_SYSTEM_TYPE = process.env.SMPP_SYSTEM_TYPE || 'SMPP';

const connections = {
  tx: {
    name: 'Transactional',
    systemId: process.env.SMPP_TX_SYSTEM_ID || process.env.SMPP_SYSTEM_ID || 'BZTItms',
    password: process.env.SMPP_TX_PASSWORD || process.env.SMPP_PASSWORD || 'TheBztel@#1',
    session: null,
    isConnecting: false,
    enquireLinkInterval: null
  },
  promo: {
    name: 'Promotional',
    systemId: process.env.SMPP_PROMO_SYSTEM_ID || 'BZTIPrmo',
    password: process.env.SMPP_PROMO_PASSWORD || 'TheBztel@#1',
    session: null,
    isConnecting: false,
    enquireLinkInterval: null
  }
};

let isProcessing = false;

// ── SMPP Connection Management ──────────────────────────────────────────────

function connectSMPP(key) {
  const conn = connections[key];
  if (conn.session || conn.isConnecting) return;
  conn.isConnecting = true;
  console.log(`[SMPP - ${conn.name}] Connecting to host ${SMPP_HOST}:${SMPP_PORT}...`);

  conn.session = smpp.connect({
    host: SMPP_HOST,
    port: SMPP_PORT
  }, () => {
    console.log(`[SMPP - ${conn.name}] Socket connection established. Binding transceiver...`);
    
    conn.session.bind_transceiver({
      system_id: conn.systemId,
      password: conn.password,
      system_type: SMPP_SYSTEM_TYPE
    }, (pdu) => {
      conn.isConnecting = false;
      if (pdu.command_status === 0) {
        console.log(`[SMPP - ${conn.name}] Successfully bound as Transceiver!`);
        startEnquireLink(key);
        processQueue(); // Start polling the Supabase queue
      } else {
        console.error(`[SMPP - ${conn.name}] Bind failed with command_status: ${pdu.command_status}`);
        reconnect(key);
      }
    });
  });

  conn.session.on('close', () => {
    console.log(`[SMPP - ${conn.name}] Connection closed by remote host.`);
    reconnect(key);
  });

  conn.session.on('error', (err) => {
    console.error(`[SMPP - ${conn.name}] Session connection error:`, err);
    reconnect(key);
  });
  
  // Handle incoming delivery receipts or mobile-originated (MO) SMS
  conn.session.on('deliver_sm', (pdu) => {
    console.log(`[SMPP - ${conn.name}] Incoming deliver_sm PDU received:`, pdu);
    
    // Always acknowledge the incoming deliver_sm request back to the SMSC
    conn.session.send(pdu.createResponse());
    
    handleIncomingDeliverSM(pdu);
  });
}

function startEnquireLink(key) {
  stopEnquireLink(key);
  const conn = connections[key];
  // Keep connection alive with heartbeats every 30 seconds
  conn.enquireLinkInterval = setInterval(() => {
    if (conn.session) {
      console.log(`[SMPP - ${conn.name}] Sending enquire_link heartbeat...`);
      conn.session.enquire_link({}, (pdu) => {
        if (pdu.command_status !== 0) {
          console.error(`[SMPP - ${conn.name}] Heartbeat enquire_link failed. Reconnecting...`);
          reconnect(key);
        }
      });
    }
  }, 30000);
}

function stopEnquireLink(key) {
  const conn = connections[key];
  if (conn.enquireLinkInterval) {
    clearInterval(conn.enquireLinkInterval);
    conn.enquireLinkInterval = null;
  }
}

function reconnect(key) {
  stopEnquireLink(key);
  const conn = connections[key];
  if (conn.session) {
    try {
      conn.session.close();
    } catch (e) {}
    conn.session = null;
  }
  conn.isConnecting = false;
  console.log(`[SMPP - ${conn.name}] Reconnecting in 5 seconds...`);
  setTimeout(() => connectSMPP(key), 5000);
}

// ── Outgoing SMS Routing Logic ───────────────────────────────────────────────

function getRoute(log) {
  const promoSenderIds = (process.env.SMPP_PROMO_SENDER_IDS || '')
    .split(',')
    .map(id => id.trim().toUpperCase())
    .filter(Boolean);

  const senderIdUpper = log.senderId.trim().toUpperCase();
  
  // If the senderId is in the list of promo sender IDs, route to promo
  if (promoSenderIds.includes(senderIdUpper)) {
    return 'promo';
  }
  
  // Custom keyword heuristics
  if (senderIdUpper.includes('PROMO') || senderIdUpper.includes('MARKETING')) {
    return 'promo';
  }

  return 'tx';
}

// ── Timezone & Scheduling Heuristics (Nigeria WAT = UTC+1) ───────────────────

function getNigeriaTime() {
  const d = new Date();
  // Get UTC time in milliseconds, then add 1 hour for West Africa Time (WAT = UTC+1)
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const watDate = new Date(utc + (3600000 * 1));
  return {
    hours: watDate.getHours(),
    minutes: watDate.getMinutes(),
    timeString: `${watDate.getHours().toString().padStart(2, '0')}:${watDate.getMinutes().toString().padStart(2, '0')}`
  };
}

function getAllowedRoutes() {
  const { hours, minutes } = getNigeriaTime();
  const minutesSinceMidnight = hours * 60 + minutes;

  // Transactional allowed: 8:00 AM to 8:00 PM WAT
  const startOfBroadcast = 8 * 60; // 08:00
  const endOfBroadcast = 20 * 60; // 20:00
  
  // Promotional allowed: 8:45 AM to 7:30 PM WAT
  const startOfPromo = 8 * 60 + 45; // 08:45
  const endOfPromo = 19 * 60 + 30; // 19:30

  return {
    tx: minutesSinceMidnight >= startOfBroadcast && minutesSinceMidnight < endOfBroadcast,
    promo: minutesSinceMidnight >= startOfPromo && minutesSinceMidnight < endOfPromo
  };
}

// ── Outgoing SMS Queue Processing (Supabase Database Queue) ───────────────────

async function processQueue() {
  if (isProcessing) return;

  const allowed = getAllowedRoutes();

  // If neither route is allowed (night blackout: 8:00 PM - 8:00 AM WAT), pause queue processing
  if (!allowed.tx && !allowed.promo) {
    const { timeString } = getNigeriaTime();
    console.log(`[Worker] Preemptive night blackout active (WAT: ${timeString}). Dispatches paused until 8:00 AM.`);
    isProcessing = false;
    setTimeout(processQueue, 30000); // Check again in 30 seconds
    return;
  }

  // Ensure corresponding connection is active
  const canSendTx = allowed.tx && !!connections.tx.session;
  const canSendPromo = allowed.promo && !!connections.promo.session;

  if (!canSendTx && !canSendPromo) {
    isProcessing = false;
    setTimeout(processQueue, 5000); // Check again in 5 seconds (active route is down/disconnected)
    return;
  }
  
  isProcessing = true;

  try {
    const promoSenderIds = (process.env.SMPP_PROMO_SENDER_IDS || '')
      .split(',')
      .map(id => id.trim().toUpperCase())
      .filter(Boolean);

    // Build the dynamic where clause based on active and allowed time windows
    const whereClause = { status: 'pending' };

    if (canSendTx && !canSendPromo) {
      // TX open, Promo closed: Exclude all promotional messages to prevent queue starvation
      whereClause.NOT = [
        { senderId: { in: promoSenderIds } },
        { senderId: { contains: 'PROMO' } },
        { senderId: { contains: 'Promo' } },
        { senderId: { contains: 'promo' } },
        { senderId: { contains: 'MARKETING' } },
        { senderId: { contains: 'Marketing' } },
        { senderId: { contains: 'marketing' } }
      ];
    } else if (!canSendTx && canSendPromo) {
      // Promo open, TX closed (theoretical): Fetch ONLY promotional messages
      whereClause.OR = [
        { senderId: { in: promoSenderIds } },
        { senderId: { contains: 'PROMO' } },
        { senderId: { contains: 'Promo' } },
        { senderId: { contains: 'promo' } },
        { senderId: { contains: 'MARKETING' } },
        { senderId: { contains: 'Marketing' } },
        { senderId: { contains: 'marketing' } }
      ];
    }

    // Pull pending messages from the Supabase database matching the schedule filter
    const pendingLogs = await prisma.smsLog.findMany({
      where: whereClause,
      take: 20 // Pull batch size corresponding to the 20 SMS/sec limit
    });

    if (pendingLogs.length === 0) {
      isProcessing = false;
      // Re-poll the database in 1 second
      setTimeout(processQueue, 1000);
      return;
    }

    console.log(`[Worker] Found ${pendingLogs.length} pending messages to dispatch.`);

    let skippedAny = false;
    for (const log of pendingLogs) {
      const result = await sendSMS(log);
      if (result && result.skipped) {
        skippedAny = true;
      }
      
      // Enforce pacing delay (approx. 50ms per message to respect the 20 SMS/sec limit)
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Delay re-polling if we skipped messages because a route was down
    const nextPollDelay = skippedAny ? 5000 : 100;
    setTimeout(processQueue, nextPollDelay);
  } catch (error) {
    console.error('[Worker] Error in queue processing loop:', error);
    setTimeout(processQueue, 1000);
  } finally {
    isProcessing = false;
  }
}

// Submit a single message via SMPP
async function sendSMS(log) {
  const routeKey = getRoute(log);
  const conn = connections[routeKey];

  return new Promise((resolve) => {
    if (!conn.session) {
      console.warn(`[Worker] Cannot send message ${log.id}: Route [${conn.name}] is not connected. Skipping for now.`);
      resolve({ skipped: true });
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

    console.log(`[Worker] Submitting SMS log ${log.id} to recipient ${cleanRecipient} via route [${conn.name}] using ${cleanSenderId}...`);

    conn.session.submit_sm(pduParams, async (pdu) => {
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
          console.error(`[Worker] SMS ${log.id} submission failed on route [${conn.name}]. SMPP Error code: ${pdu.command_status}`);
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
    console.log(`[Worker] Inbound message received from: "${from}" to: "${to}" | content: "${message}". Two-way SMS is disabled. Ignoring.`);
    return;
  } catch (err) {
    console.error('[Worker] Error processing incoming deliver_sm:', err);
  }
}

// ── Startup ──────────────────────────────────────────────────────────────────

// Start the worker process for both routes
connectSMPP('tx');
connectSMPP('promo');
console.log('[Worker] Standalone Background Worker started (Dual Route: TX & PROMO).');
