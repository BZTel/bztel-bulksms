import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Voice Call logs history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const history = await queryAll(
      'SELECT TOP 100 * FROM voice_logs WHERE user_id = ? ORDER BY sent_at DESC',
      [ownerId]
    );
    res.json({ history });
  } catch (error) {
    console.error('Fetch voice history error:', error);
    res.status(500).json({ error: 'Failed to fetch voice broadcast logs' });
  }
});

// Dispatch Voice Broadcast Campaign (Simulated gateway)
router.post('/send', authenticateToken, requireRole(['Owner', 'Administrator', 'Dispatcher']), async (req, res) => {
  const { senderId, recipients, ttsText, audioUrl } = req.body;
  const ownerId = req.user.owner_id;

  if (!senderId || !recipients || (!ttsText && !audioUrl)) {
    return res.status(400).json({ error: 'Sender ID, Recipients, and either TTS Text or Audio URL are required' });
  }

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

  // Voice calls cost 2 credits per recipient
  const creditsPerCall = 2;
  const totalCreditsNeeded = creditsPerCall * recipientList.length;

  try {
    // Check balance
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [ownerId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < totalCreditsNeeded) {
      return res.status(400).json({
        error: `Insufficient credits. Required: ${totalCreditsNeeded} credits, Balance: ${user.balance}`
      });
    }

    // Deduct credits
    await queryRun('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCreditsNeeded, ownerId]);

    // Write transaction debit log
    const cleanSenderId = senderId.trim().toUpperCase();
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        ownerId, 'voice_debit', -totalCreditsNeeded,
        user.balance, user.balance - totalCreditsNeeded,
        `Voice Broadcast \u2014 ${recipientList.length} call${recipientList.length !== 1 ? 's' : ''} via ${cleanSenderId}`
      ]
    );

    const logIds = [];

    // Queue voice logs
    for (const phone of recipientList) {
      const result = await queryRun(
        `INSERT INTO voice_logs (user_id, sender_id, recipient, tts_text, audio_url, duration, credits, status)
         VALUES (?, ?, ?, ?, ?, 30, ?, 'pending')`,
        [ownerId, cleanSenderId, phone.trim(), ttsText || null, audioUrl || null, creditsPerCall]
      );
      logIds.push(result.id);
    }

    // Simulate Voice Gateway status update
    setTimeout(async () => {
      try {
        for (const id of logIds) {
          const isCompleted = Math.random() > 0.05; // 95% successful
          await queryRun("UPDATE voice_logs SET status = ? WHERE id = ?", [isCompleted ? 'completed' : 'failed', id]);
        }
        console.log(`[Voice Gateway] Dispatched and updated status for ${logIds.length} voice broadcast(s).`);
      } catch (err) {}
    }, 4000);

    res.status(202).json({
      message: `Enqueued ${recipientList.length} voice call(s). Credits deducted: ${totalCreditsNeeded}.`,
      credits_deducted: totalCreditsNeeded
    });

  } catch (error) {
    console.error('Voice send error:', error);
    res.status(500).json({ error: 'Failed to process voice broadcast campaign' });
  }
});

export default router;
