import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP or API key to 100 requests per windowMs
  message: 'Too many requests to Bztel API, please wait 15 minutes.'
});

const router = express.Router();

// Get active API keys
router.get('/keys', authenticateToken, async (req, res) => {
  const ownerId = req.user.owner_id;
  try {
    const keys = await queryAll(
      'SELECT id, name, key, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [ownerId]
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

// Generate new API key (Owners & Administrators only)
router.post('/keys', authenticateToken, requireRole(['Owner', 'Administrator']), async (req, res) => {
  const { name } = req.body;
  const ownerId = req.user.owner_id;

  if (!name) {
    return res.status(400).json({ error: 'API key name is required' });
  }

  const secureKey = 'bztel_live_' + crypto.randomBytes(20).toString('hex');

  try {
    const result = await queryRun(
      'INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)',
      [ownerId, secureKey, name.trim()]
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

// Delete/Revoke API key (Owners & Administrators only)
router.delete('/keys/:id', authenticateToken, requireRole(['Owner', 'Administrator']), async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.owner_id;

  try {
    const keyExists = await queryGet('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [id, ownerId]);
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
router.post('/v1/sms/send', apiRateLimiter, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1]; // Bearer bztel_live_xxx

  if (!apiKey) {
    return res.status(401).json({ error: 'API key missing in Authorization header' });
  }

  try {
    const keyData = await queryGet('SELECT user_id FROM api_keys WHERE key = ?', [apiKey]);
    if (!keyData) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    const userId = keyData.user_id; // This is the owner's ID
    const { senderId, recipients, message } = req.body;

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

    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User associated with key not found' });
    }

    if (user.balance < totalCreditsNeeded) {
      return res.status(400).json({
        error: `Insufficient credits. Required: ${totalCreditsNeeded}, Balance: ${user.balance}`
      });
    }

    await queryRun('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCreditsNeeded, userId]);

    // Log transaction
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId, 'sms_debit', -totalCreditsNeeded,
        user.balance, user.balance - totalCreditsNeeded,
        `Public API SMS Broadcast \u2014 ${recipientList.length} recipients via ${cleanSenderId}`
      ]
    );

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

// SMTP Email Notification helper for Contact Form
async function sendContactNotificationEmail(senderName, senderEmail, subject, bodyText) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'no-reply@bztel.com';
  const recipient = 'info@bztel.net';

  if (!host || !user || !pass) {
    console.log(`[SMTP Mailer] SMTP not configured. Simulating Contact Form Notification:`);
    console.log(`----------------------------------------`);
    console.log(`To: ${recipient}`);
    console.log(`From: ${from}`);
    console.log(`Subject: [New Contact Inquiry] ${subject}`);
    console.log(`Sender Name: ${senderName}`);
    console.log(`Sender Email: ${senderEmail}`);
    console.log(`Message:\n${bodyText}`);
    console.log(`----------------------------------------`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const html = `
      <h2>New Public Contact Form Submission</h2>
      <p>A new contact inquiry has been received from the Bztel website:</p>
      <ul>
        <li><strong>Sender Name:</strong> ${senderName}</li>
        <li><strong>Sender Email:</strong> ${senderEmail}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
        ${bodyText}
      </div>
      <br>
      <p>This message has been persisted in the database.</p>
    `;

    await transporter.sendMail({
      from,
      to: recipient,
      subject: `[New Contact Inquiry] ${subject}`,
      html
    });
    console.log(`[SMTP Mailer] Contact notification email sent successfully to ${recipient}`);
    return true;
  } catch (err) {
    console.error(`[SMTP Mailer] Failed to dispatch contact notification email:`, err);
    return false;
  }
}

// POST /api/contact - Public contact form submission
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields (name, email, subject, message) are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    // 1. Insert into database
    await queryRun(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    // 2. Dispatch email notification to info@bztel.net
    await sendContactNotificationEmail(name.trim(), email.trim(), subject.trim(), message.trim());

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. Our support desk will reach out within 12 hours.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact message. Please try again later.' });
  }
});

export default router;
