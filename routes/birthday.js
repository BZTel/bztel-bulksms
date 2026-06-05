import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get active birthday campaigns
router.get('/campaigns', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const campaigns = await queryAll(
      'SELECT * FROM birthday_campaigns WHERE user_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    res.json({ campaigns });
  } catch (error) {
    console.error('Fetch birthday campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch birthday campaigns' });
  }
});

// Save or Enable Birthday Campaign
router.post('/campaigns', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { senderId, targetGroup, dispatchTime, messageTemplate } = req.body;
  const ownerId = req.user.owner_id;

  if (!senderId || !targetGroup || !dispatchTime || !messageTemplate) {
    return res.status(400).json({ error: 'Sender ID, Target Group, Dispatch Time, and Message Template are required' });
  }

  try {
    // Check if campaign already exists for this group
    const existing = await queryGet(
      'SELECT id FROM birthday_campaigns WHERE user_id = ? AND target_group = ?',
      [ownerId, targetGroup.trim()]
    );

    if (existing) {
      // Update existing campaign
      await queryRun(
        `UPDATE birthday_campaigns 
         SET sender_id = ?, dispatch_time = ?, message_template = ?, is_active = 1
         WHERE id = ?`,
        [senderId.trim().toUpperCase(), dispatchTime, messageTemplate.trim(), existing.id]
      );
      res.json({ message: 'Birthday campaign updated successfully!' });
    } else {
      // Insert new campaign
      await queryRun(
        `INSERT INTO birthday_campaigns (user_id, sender_id, target_group, dispatch_time, message_template) 
         VALUES (?, ?, ?, ?, ?)`,
        [ownerId, senderId.trim().toUpperCase(), targetGroup.trim(), dispatchTime, messageTemplate.trim()]
      );
      res.status(201).json({ message: 'Birthday campaign activated successfully!' });
    }
  } catch (error) {
    console.error('Save birthday campaign error:', error);
    res.status(500).json({ error: 'Failed to save birthday campaign' });
  }
});

// Delete Birthday Campaign
router.delete('/campaigns/:id', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const campaignId = Number(req.params.id);
  const ownerId = req.user.owner_id;

  try {
    const existing = await queryGet('SELECT id FROM birthday_campaigns WHERE id = ? AND user_id = ?', [campaignId, ownerId]);
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await queryRun('DELETE FROM birthday_campaigns WHERE id = ?', [campaignId]);
    res.json({ message: 'Birthday campaign disabled' });
  } catch (error) {
    console.error('Delete birthday campaign error:', error);
    res.status(500).json({ error: 'Failed to delete birthday campaign' });
  }
});

// ─── Automated Birthday Greetings Scheduler Daemon ───────────────────────────
// Runs inside the server process to scan the database and send greetings

async function checkAndSendBirthdays() {
  console.log('[Birthday Daemon] Scanning contacts for birthdays...');
  try {
    const today = new Date();
    // Format Month-Day as 'MM-DD'
    const todayMD = today.toISOString().substring(5, 10);

    // SQL Server SUBSTRING is 1-indexed. 'YYYY-MM-DD' substring starting at index 6, length 5 gets 'MM-DD'
    const matchingContacts = await queryAll(
      `SELECT c.id AS contact_id, c.user_id, c.name, c.phone, b.sender_id, b.message_template 
       FROM contacts c
       JOIN birthday_campaigns b ON c.user_id = b.user_id
         AND (b.target_group = 'All' OR c.group_name = b.target_group)
       WHERE SUBSTRING(c.birthdate, 6, 5) = ? AND b.is_active = 1`,
      [todayMD]
    );

    if (matchingContacts.length === 0) {
      console.log('[Birthday Daemon] No birthday contacts found today.');
      return;
    }

    console.log(`[Birthday Daemon] Found ${matchingContacts.length} contact(s) with birthdays today.`);

    for (const contact of matchingContacts) {
      // Check if we already sent them a birthday wish today
      const alreadySent = await queryGet(
        `SELECT id FROM sms_logs 
         WHERE recipient = ? AND user_id = ? AND CONVERT(date, sent_at) = CONVERT(date, GETDATE())
           AND message LIKE '%Birthday%'`,
        [contact.phone, contact.user_id]
      );

      if (alreadySent) {
        console.log(`[Birthday Daemon] Birthday wish already sent today to ${contact.name} (${contact.phone}). Skipping.`);
        continue;
      }

      // Check balance
      const user = await queryGet('SELECT balance FROM users WHERE id = ?', [contact.user_id]);
      if (!user || user.balance < 1) {
        console.warn(`[Birthday Daemon] Insufficient balance for user_id ${contact.user_id} to send birthday wish.`);
        continue;
      }

      // Personalize message
      const msg = contact.message_template.replace(/\[Name\]/gi, contact.name);

      // Deduct credit
      await queryRun('UPDATE users SET balance = balance - 1 WHERE id = ?', [contact.user_id]);

      // Log transaction
      await queryRun(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) 
         VALUES (?, 'sms_debit', -1, ?, ?, ?)`,
        [contact.user_id, user.balance, user.balance - 1, `Automated Birthday Greetings to ${contact.name}`]
      );

      // Insert SMS log
      const insertResult = await queryRun(
        `INSERT INTO sms_logs (user_id, sender_id, recipient, message, credits, status)
         VALUES (?, ?, ?, ?, 1, 'pending')`,
        [contact.user_id, contact.sender_id, contact.phone, msg]
      );

      // Simulate gateway delivery (MTN/Telecel/AT status updater callback)
      setTimeout(async () => {
        try {
          await queryRun("UPDATE sms_logs SET status = 'sent' WHERE id = ?", [insertResult.id]);
          console.log(`[Birthday Daemon] Auto-greeting sent to ${contact.name} (${contact.phone}).`);
        } catch (e) {}
      }, 3000);
    }

  } catch (err) {
    console.error('[Birthday Daemon] Error during scan:', err);
  }
}

// Start Birthday daemon: check on boot after 5 seconds, then poll every hour
setTimeout(checkAndSendBirthdays, 5000);
setInterval(checkAndSendBirthdays, 60 * 60 * 1000); // 1 hour

export default router;
