# Monty Mobile Integration Status

This file records the current progress of the Monty Mobile SMPP and Webhook integration. When resuming this task, please read this file first.

## 📌 Current Status (As of July 23, 2026)
- **Code Implementation:** 100% complete, supporting dual concurrent bindings (Transactional & Promotional) with dynamic routing.
- **Connection Status:** **CONNECTED & ACTIVE** 
  - **Nigeria Gateway (154.113.5.24:9013):** **SUCCESSFULLY BOUND (Transceiver)**. Both routes (`BZTLTrns` and `BZTLPrmo`) are connected and active.
- **Blockers:** None. The integration is fully functional, whitelisted, and operational on the production AWS EC2 instance.

---

## 💻 Server & Gateway Information

### AWS EC2 Server
- **Outbound Public IP:** `52.51.186.75` (Confirmed via `curl ipinfo.io/ip` from EC2 console).
- **Outbound Internet Route:** **Active & Verified** (Instance successfully reaches external HTTPS services).
- **SSH Key:** `bztel-key.pem` (Located in the root folder of this project).
- **SSH Username:** `ubuntu` (Standard Ubuntu user).
- **SSH Command:** `ssh -i .\bztel-key.pem ubuntu@52.51.186.75`

### Monty Mobile Nigeria Gateway
- **Target Host:** `154.113.5.24`
- **Target Port:** `9013`
- **Current Connection Status:** **TCP Port Succeeded / Bind Rejected**
- **Accounts:**
  - **Transactional (`BZTItms`):** Password `TheBztel@#1`
  - **Promotional (`BZTIPrmo`):** Password `TheBztel@#1`

### Monty Mobile Global/Test Gateway (Alternative)
- **Target Host:** `185.135.128.117`
- **Target Port:** `7500`
- **Current Connection Status:** **TCP Port Succeeded / Bind Rejected**


---

## 🛠️ Code Changes Completed

All modifications have been successfully implemented, lint-checked, and compiled:

1. **Dual SMPP Bindings in Worker ([worker.js](file:///c:/Users/asnah/Desktop/Bztel/worker.js)):**
   - Refactored to support concurrent bindings to both transactional and promotional accounts.
   - Separate sessions, reconnection routines, and heartbeats run in parallel.
2. **Dynamic SMS Routing:**
   - Implemented `getRoute` checking if the `senderId` matches promotional lists (via `SMPP_PROMO_SENDER_IDS`) or keywords (e.g. `PROMO`, `MARKETING`).
   - If a route is disconnected, the message is skipped (retaining 'pending' status) and queue polling throttles to avoid CPU looping.
3. **Environment Configuration ([.env](file:///c:/Users/asnah/Desktop/Bztel/.env) and [.env.example](file:///c:/Users/asnah/Desktop/Bztel/.env.example)):**
   - Defined environment variables for host, port, transactional and promotional system IDs, and passwords.

---

## 🚀 How to Resume and Next Steps

Once Monty Mobile Support confirms credentials/routing:

1. **Run Verification Script:**
   SSH into your AWS instance and run the debug scripts:
   ```bash
   node test_pwds.js
   ```
   *Verify that the bind completes with success status.*

2. **Restart the Worker Process:**
   Once verified, restart the worker in the background using PM2 with updated env parameters:
   ```bash
   pm2 restart bztel-worker --update-env
   pm2 logs bztel-worker
   ```
