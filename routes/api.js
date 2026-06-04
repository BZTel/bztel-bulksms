import express from 'express';
import crypto from 'crypto';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get active API keys
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    const keys = await queryAll(
      'SELECT id, name, key, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    // Mask API keys for safety before returning
    const maskedKeys = keys.map(k => ({
      ...k,
      key: k.key.substring(0, 11) + '...' + k.key.substring(k.key.length - 4)
    }));
    res.json({ keys: maskedKeys });
  } catch (error) {
    console.error('Fetch keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Generate new API key
router.post('/keys', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'API key name is required' });
  }

  // Generate secure token: bztel_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const secureKey = 'bztel_live_' + crypto.randomBytes(20).toString('hex');

  try {
    const result = await queryRun(
      'INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)',
      [req.user.id, secureKey, name.trim()]
    );

    res.status(201).json({
      message: 'API Key generated successfully. Make sure to copy it now, it will not be shown again.',
      apiKey: {
        id: result.id,
        name: name.trim(),
        key: secureKey,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Delete/Revoke API key
router.delete('/keys/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const keyExists = await queryGet('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!keyExists) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await queryRun('DELETE FROM api_keys WHERE id = ?', [id]);
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/* PUBLIC API ENDPOINT FOR SMS SENDING */
// This allows developers to integrate bulk SMS using their generated keys
router.post('/v1/sms/send', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1]; // Bearer bztel_live_xxx

  if (!apiKey) {
    return res.status(401).json({ error: 'API key missing in Authorization header' });
  }

  try {
    // Find key in database
    const keyData = await queryGet('SELECT user_id FROM api_keys WHERE key = ?', [apiKey]);
    if (!keyData) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    const userId = keyData.user_id;
    const { senderId, recipients, message } = req.body;

    if (!senderId || !recipients || !message) {
      return res.status(400).json({ error: 'Sender ID, Recipients, and Message are required' });
    }

    const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();
    const rawMessage = message.trim();

    // Parse recipients
    let recipientList = [];
    if (Array.isArray(recipients)) {
      recipientList = recipients;
    } else if (typeof recipients === 'string') {
      recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);
    }

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'Recipients list is empty' });
    }

    // Credits count
    const creditsPerMessage = Math.max(1, Math.ceil(rawMessage.length / 160));
    const totalCreditsNeeded = creditsPerMessage * recipientList.length;

    // Check balance
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User associated with key not found' });
    }

    if (user.balance < totalCreditsNeeded) {
      return res.status(400).json({
        error: `Insufficient credits. Required: ${totalCreditsNeeded}, Balance: ${user.balance}`
      });
    }

    // Deduct credits
    await queryRun('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCreditsNeeded, userId]);

    // Insert pending logs
    const logIds = [];
    await queryRun('BEGIN TRANSACTION');
    for (const phone of recipientList) {
      const result = await queryRun(
        `INSERT INTO sms_logs (user_id, sender_id, recipient, message, credits, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, cleanSenderId, phone.trim(), rawMessage, creditsPerMessage]
      );
      logIds.push(result.id);
    }
    await queryRun('COMMIT');

    // Simulate async delivery
    setTimeout(async () => {
      try {
        await queryRun('BEGIN TRANSACTION');
        for (const id of logIds) {
          const isDelivered = Math.random() > 0.05;
          await queryRun('UPDATE sms_logs SET status = ? WHERE id = ?', [isDelivered ? 'sent' : 'failed', id]);
        }
        await queryRun('COMMIT');
      } catch (err) {}
    }, 3500);

    res.status(202).json({
      success: true,
      message: `Enqueued ${recipientList.length} messages via API.`,
      credits_deducted: totalCreditsNeeded,
      remaining_balance: user.balance - totalCreditsNeeded
    });
  } catch (error) {
    console.error('Public API send SMS error:', error);
    res.status(500).json({ error: 'Failed to process SMS request' });
  }
});

export default router;
