import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get SMS stats for dashboard (uses owner_id for team shared wallet stats)
router.get('/stats', authenticateToken, async (req, res) => {
  const ownerId = req.user.owner_id;
  try {
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [ownerId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const counts = await queryAll(
      `SELECT status, COUNT(*) as count, SUM(credits) as total_credits 
       FROM sms_logs 
       WHERE user_id = ? 
       GROUP BY status`,
      [ownerId]
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
        totalCreditsUsed += c.total_credits || 0;
      }
    });

    // Get daily stats for chart (last 7 days)
    const chartData = await queryAll(
      `SELECT CONVERT(varchar(10), sent_at, 120) as date, COUNT(*) as count, SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as delivered
       FROM sms_logs 
       WHERE user_id = ? AND sent_at >= DATEADD(day, -7, GETDATE())
       GROUP BY CONVERT(varchar(10), sent_at, 120)
       ORDER BY date ASC`,
      [ownerId]
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
  const ownerId = req.user.owner_id;
  try {
    const history = await queryAll(
      'SELECT TOP 100 * FROM sms_logs WHERE user_id = ? ORDER BY sent_at DESC',
      [ownerId]
    );
    res.json({ history });
  } catch (error) {
    console.error('Fetch SMS history error:', error);
    res.status(500).json({ error: 'Failed to fetch SMS logs' });
  }
});

// Send SMS API (Simulated Gateway) - Dispatchers/Marketers/Owners/Admins only
router.post('/send', authenticateToken, requireRole(['Owner', 'Administrator', 'Dispatcher', 'Marketing Agent']), async (req, res) => {
  const { senderId, recipients, message } = req.body;
  const ownerId = req.user.owner_id;

  if (!senderId || !recipients || !message) {
    return res.status(400).json({ error: 'Sender ID, Recipients, and Message are required' });
  }

  const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();
  const rawMessage = message.trim();

  let recipientList = [];
  if (Array.isArray(recipients)) {
    recipientList = recipients;
  } else if (typeof recipients === 'string') {
    recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);
  }

  if (recipientList.length === 0) {
    return res.status(400).json({ error: 'Recipients list is empty' });
  }

  const creditsPerMessage = Math.max(1, Math.ceil(rawMessage.length / 160));
  const totalCreditsNeeded = creditsPerMessage * recipientList.length;

  try {
    // Check balance of the owner (shared wallet)
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [ownerId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < totalCreditsNeeded) {
      return res.status(400).json({
        error: `Insufficient credits. Required: ${totalCreditsNeeded} credits, Balance: ${user.balance}`
      });
    }

    // Fetch user contacts for personalization
    const contacts = await queryAll('SELECT name, phone FROM contacts WHERE user_id = ?', [ownerId]);
    const contactsMap = new Map(contacts.map(c => [c.phone.replace(/[\s+()-]/g, ''), c.name]));

    // Deduct credits from owner account
    await queryRun('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCreditsNeeded, ownerId]);

    // Write transaction log under owner
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        ownerId, 'sms_debit', -totalCreditsNeeded,
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

      const personalizedMsg = rawMessage.replace(/\[Name\]/gi, contactName);

      const result = await queryRun(
        `INSERT INTO sms_logs (user_id, sender_id, recipient, message, credits, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [ownerId, cleanSenderId, rawPhone.trim(), personalizedMsg, creditsPerMessage]
      );
      logIds.push(result.id);
    }
    await queryRun('COMMIT');

    // Simulate async delivery
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

function simulateDelivery(logIds) {
  setTimeout(async () => {
    try {
      await queryRun('BEGIN TRANSACTION');
      for (const id of logIds) {
        const isDelivered = Math.random() > 0.05;
        await queryRun('UPDATE sms_logs SET status = ? WHERE id = ?', [isDelivered ? 'sent' : 'failed', id]);
      }
      await queryRun('COMMIT');
    } catch (error) {
      try {
        await queryRun('ROLLBACK');
      } catch (e) {}
    }
  }, 3500);
}

/* Templates Routes */

// Get templates
router.get('/templates', authenticateToken, async (req, res) => {
  const ownerId = req.user.owner_id;
  try {
    const templates = await queryAll('SELECT * FROM templates WHERE user_id = ? ORDER BY name ASC', [ownerId]);
    res.json({ templates });
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/templates', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { name, content } = req.body;
  const ownerId = req.user.owner_id;

  if (!name || !content) {
    return res.status(400).json({ error: 'Template name and content are required' });
  }

  try {
    const result = await queryRun(
      'INSERT INTO templates (user_id, name, content) VALUES (?, ?, ?)',
      [ownerId, name.trim(), content.trim()]
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
router.delete('/templates/:id', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.owner_id;

  try {
    const template = await queryGet('SELECT id FROM templates WHERE id = ? AND user_id = ?', [id, ownerId]);
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
