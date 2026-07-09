# Monty Mobile Integration Status

This file records the current progress of the Monty Mobile SMPP and Webhook integration. When resuming this task, please read this file first.

## 📌 Current Status (As of July 9, 2026)
- **Code Implementation:** 100% complete, compiled, and database-verified.
- **Connection Status:** Currently **Blocked/Timing Out**.
- **Blocker:** Waiting for Monty Mobile Support to activate/fix the firewall whitelist on their end for our AWS EC2 instance public IP.

---

## 💻 Server & Gateway Information

### AWS EC2 Server
- **Outbound Public IP:** `176.34.210.141` (Confirmed via `curl ipinfo.io/ip` from EC2 console).
- **Outbound Internet Route:** **Active & Verified** (Instance successfully reaches external HTTPS services).
- **SSH Key:** `bztel-key.pem` (Located in the root folder of this project).
- **SSH Username:** `ubuntu` (Standard Ubuntu user).
- **SSH Command:** `ssh -i .\bztel-key.pem ubuntu@176.34.210.141`

### Monty Mobile Gateway
- **Target Host:** `154.113.5.24`
- **Target Port:** `9013`
- **Current Telnet Status:** **Timing out / Hanging** (Blocked on Monty Mobile's firewall).

---

## 🛠️ Code Changes Completed

All modifications have been successfully implemented, lint-checked, and compiled:

1. **Next.js Queue Bypass ([lib/queue.ts](file:///c:/Users/asnah/Desktop/Bztel/lib/queue.ts)):**
   - Configured to bypass the in-app mock queue processor when `SMPP_ENABLED=true` is set, leaving pending logs in the DB for the standalone SMPP daemon.
2. **DLR Webhook ([app/api/sms/dlr/route.ts](file:///c:/Users/asnah/Desktop/Bztel/app/api/sms/dlr/route.ts)):**
   - Upgraded search lookup to match message IDs case-insensitively using `mode: 'insensitive' as const`.
   - Integrated real-time dashboard telemetry broadcasts (`broadcastMessage`) upon status updates.
3. **SMPP Daemon Worker ([worker.js](file:///c:/Users/asnah/Desktop/Bztel/worker.js)):**
   - Sanitizes phone numbers (removes `+` and spaces).
   - Set correct TON/NPI values (Type of Number 5 for alphanumeric, 1 for numeric).
   - Configured `registered_delivery: 1` to request delivery receipts.
   - Added support for long messages (> 160 characters) using `message_payload`.
   - Enabled parsing of incoming DLR packets over the SMPP connection and robust case-insensitive matching.
4. **Environment Variables ([.env](file:///c:/Users/asnah/Desktop/Bztel/.env) and [.env.example](file:///c:/Users/asnah/Desktop/Bztel/.env.example)):**
   - Added Monty Mobile SMPP configurations pointing to `154.113.5.24:9013`.

---

## 🚀 How to Resume and Next Steps

Once Monty Mobile Support confirms that the whitelisting is active:

1. **Verify Connection:**
   SSH into your AWS instance and run:
   ```bash
   telnet 154.113.5.24 9013
   ```
   *Make sure it connects instantly.*

2. **Configure AWS `.env`:**
   Ensure the `.env` file on your AWS instance has the correct credentials:
   ```ini
   SMPP_ENABLED=true
   SMPP_HOST=154.113.5.24
   SMPP_PORT=9013
   SMPP_SYSTEM_ID=your_actual_system_id
   SMPP_PASSWORD=your_actual_password
   ```

3. **Run the Worker Process:**
   On the AWS instance, run the worker in the background using PM2:
   ```bash
   npm install -g pm2
   pm2 start worker.js --name "bztel-smpp-worker"
   pm2 save
   pm2 startup
   ```
