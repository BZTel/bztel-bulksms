import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get SMS stats for dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const counts = await queryAll(
      `SELECT status, COUNT(*) as count, SUM(credits) as total_credits 
       FROM sms_logs 
       WHERE user_id = ? 
       GROUP BY status`,
      [req.user.id]
    );

    let sent = 0, failed = 0, pending = 0, totalCreditsUsed = 0;
    counts.forEach(c => {
      if (c.status === 'sent') {
        sent = c.count;
        totalCreditsUsed += c.total_credits || 0;
      } else if (c.status === 'failed') {
        failed = c.count;
      } else if (c.status === 'pending') {
        pending = c.count;
        totalCreditsUsed += c.total_credits || 0; // Count pending as used credits
      }
    });

    // Get daily stats for chart (last 7 days)
    const chartData = await queryAll(
      `SELECT DATE(sent_at) as date, COUNT(*) as count, SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as delivered
       FROM sms_logs 
       WHERE user_id = ? AND sent_at >= datetime('now', '-7 days')
       GROUP BY DATE(sent_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    res.json({
      balance: user.balance,
      total_sent: sent,
      total_failed: failed,
      total_pending: pending,
      total_credits_used: totalCreditsUsed,
      chart_data: chartData
    });
  } catch (error) {
    console.error('Fetch SMS stats error:', error);
    res.status(500).json({ error: 'Failed to fetch SMS statistics' });
  }
});

// Get SMS sending logs/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await queryAll(
      'SELECT * FROM sms_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json({ history });
  } catch (error) {
    console.error('Fetch SMS history error:', error);
    res.status(500).json({ error: 'Failed to fetch SMS logs' });
  }
});

// Send SMS API (Simulated Gateway)
router.post('/send', authenticateToken, async (req, res) => {
  const { senderId, recipients, message } = req.body;
  // recipients: array of phone numbers or string with comma-separated values

  if (!senderId || !recipients || !message) {
    return res.status(400).json({ error: 'Sender ID, Recipients, and Message are required' });
  }

  const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase(); // GSM limit 11 characters
  const rawMessage = message.trim();

  // Normalize recipients to array
  let recipientList = [];
  if (Array.isArray(recipients)) {
    recipientList = recipients;
  } else if (typeof recipients === 'string') {
    recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);
  }

  if (recipientList.length === 0) {
    return res.status(400).json({ error: 'Recipients list is empty' });
  }

  // Calculate credits per SMS page (160 characters per GSM page)
  const creditsPerMessage = Math.max(1, Math.ceil(rawMessage.length / 160));
  const totalCreditsNeeded = creditsPerMessage * recipientList.length;

  try {
    // Check balance
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < totalCreditsNeeded) {
      return res.status(400).json({
        error: `Insufficient credits. You need ${totalCreditsNeeded} credits, but only have ${user.balance} remaining.`
      });
    }

    // Fetch user contacts for personalization ([Name] placeholder replacement)
    const contacts = await queryAll('SELECT name, phone FROM contacts WHERE user_id = ?', [req.user.id]);
    const contactsMap = new Map(contacts.map(c => [c.phone.replace(/[\s+()-]/g, ''), c.name]));

    // Deduct credits from user
    await queryRun('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCreditsNeeded, req.user.id]);

    // Write sms_debit transaction
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id, 'sms_debit', -totalCreditsNeeded,
        user.balance, user.balance - totalCreditsNeeded,
        `SMS Batch \u2014 ${recipientList.length} recipient${recipientList.length !== 1 ? 's' : ''} via ${cleanSenderId}`
      ]
    );

    const logIds = [];

    // Queue messages in DB as pending
    await queryRun('BEGIN TRANSACTION');
    for (const rawPhone of recipientList) {
      const cleanPhone = rawPhone.replace(/[\s+()-]/g, '');
      const contactName = contactsMap.get(cleanPhone) || 'Customer';

      // Personalize message: replace [Name] with contact name
      const personalizedMsg = rawMessage.replace(/\[Name\]/gi, contactName);

      const result = await queryRun(
        `INSERT INTO sms_logs (user_id, sender_id, recipient, message, credits, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [req.user.id, cleanSenderId, rawPhone.trim(), personalizedMsg, creditsPerMessage]
      );
      logIds.push(result.id);
    }
    await queryRun('COMMIT');

    // Simulate SMS Gateway: Async status update (95% delivered, 5% failed)
    simulateDelivery(logIds);

    res.status(202).json({
      message: `Enqueued ${recipientList.length} messages. Credits deducted: ${totalCreditsNeeded}.`,
      batch_size: recipientList.length,
      credits_deducted: totalCreditsNeeded
    });
  } catch (error) {
    console.error('Send SMS error, rolling back:', error);
    try {
      await queryRun('ROLLBACK');
    } catch (rbErr) {}
    res.status(500).json({ error: 'Failed to process bulk SMS' });
  }
});

// Helper: Simulate Delivery
function simulateDelivery(logIds) {
  setTimeout(async () => {
    try {
      await queryRun('BEGIN TRANSACTION');
      for (const id of logIds) {
        // Randomly fail 5% of SMS
        const isDelivered = Math.random() > 0.05;
        const status = isDelivered ? 'sent' : 'failed';
        await queryRun('UPDATE sms_logs SET status = ? WHERE id = ?', [status, id]);
      }
      await queryRun('COMMIT');
      console.log(`Simulated gateway updated ${logIds.length} messages.`);
    } catch (error) {
      console.error('Error updating simulated delivery status:', error);
      try {
        await queryRun('ROLLBACK');
      } catch (e) {}
    }
  }, 3500); // 3.5 seconds delay
}

/* Templates Routes */

// Get templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = await queryAll('SELECT * FROM templates WHERE user_id = ? ORDER BY name ASC', [req.user.id]);
    res.json({ templates });
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/templates', authenticateToken, async (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ error: 'Template name and content are required' });
  }

  try {
    const result = await queryRun(
      'INSERT INTO templates (user_id, name, content) VALUES (?, ?, ?)',
      [req.user.id, name.trim(), content.trim()]
    );
    res.status(201).json({
      message: 'Template created successfully',
      template: {
        id: result.id,
        name: name.trim(),
        content: content.trim()
      }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Delete template
router.delete('/templates/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const template = await queryGet('SELECT id FROM templates WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await queryRun('DELETE FROM templates WHERE id = ?', [id]);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
