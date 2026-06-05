import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { queryGet, queryAll, queryRun, logAuditEvent } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get team members listing
router.get('/', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const members = await queryAll(
      `SELECT id, email, role, status, created_at 
       FROM users 
       WHERE id = ? OR parent_user_id = ? 
       ORDER BY CASE WHEN role = 'Owner' THEN 0 ELSE 1 END, email`,
      [ownerId, ownerId]
    );

    res.json({ members });
  } catch (error) {
    console.error('Fetch teams error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// SMTP Email Invitation Dispatcher Helper
async function sendInviteEmail(email, role, tempPassword = 'password123') {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'no-reply@bztel.com';

  if (!host || !user || !pass) {
    console.log(`[SMTP Mailer] SMTP not configured. Simulating invite dispatch to: ${email}`);
    console.log(`----------------------------------------`);
    console.log(`Subject: Welcome to Bztel bulk SMS team!`);
    console.log(`To: ${email}`);
    console.log(`Body: You have been invited to Bztel with role "${role}".`);
    console.log(`Your temporary password is: ${tempPassword}`);
    console.log(`Please login and change your password immediately.`);
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
      <h2>Welcome to Bztel Bulk SMS Dashboard</h2>
      <p>You have been invited to join Bztel with the role: <strong>${role}</strong>.</p>
      <p>Your login credentials are:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Temporary Password:</strong> ${tempPassword}</li>
      </ul>
      <p>For security, please login and update your password immediately.</p>
      <br>
      <p>Best regards,<br>The Bztel Team</p>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Welcome to Bztel — Coworker Invitation',
      html
    });
    console.log(`[SMTP Mailer] Invite email sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`[SMTP Mailer] Failed to dispatch invite email to ${email}:`, err);
    return false;
  }
}

// Invite team member
router.post('/invite', authenticateToken, requireRole(['Owner', 'Administrator']), async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and Role are required' });
  }

  const allowedRoles = ['Administrator', 'Dispatcher', 'Marketing Agent', 'Reporter'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid permission role selected' });
  }

  try {
    // Check if email already exists
    const existing = await queryGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered on Bztel' });
    }

    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt); // Default login credentials for coworkers

    const ownerId = req.user.owner_id;
    
    // Insert coworker
    const result = await queryRun(
      `INSERT INTO users (email, password_hash, role, parent_user_id, status, balance) 
       VALUES (?, ?, ?, ?, 'Pending', 0)`,
      [email.trim().toLowerCase(), passwordHash, role, ownerId]
    );

    // Send invite email (real or simulated fallback)
    const emailSent = await sendInviteEmail(email.trim().toLowerCase(), role, 'password123');

    // Audit log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(
      req.user.id,
      'TEAM_MEMBER_INVITE',
      `Invited coworker ${email} as ${role}. Email sent: ${emailSent}`,
      clientIp
    );

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      member: {
        id: result.id,
        email: email.trim().toLowerCase(),
        role,
        status: 'Pending'
      }
    });
  } catch (error) {
    console.error('Invite coworker error:', error);
    res.status(500).json({ error: 'Failed to complete team invitation' });
  }
});

// Remove team member
router.delete('/:id', authenticateToken, requireRole(['Owner', 'Administrator']), async (req, res) => {
  const memberId = Number(req.params.id);
  const ownerId = req.user.owner_id;

  if (memberId === ownerId) {
    return res.status(400).json({ error: 'Cannot remove the organization owner' });
  }

  try {
    // Check if coworker exists in organization
    const member = await queryGet('SELECT id, email FROM users WHERE id = ? AND parent_user_id = ?', [memberId, ownerId]);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await queryRun('DELETE FROM users WHERE id = ?', [memberId]);

    // Audit log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(
      req.user.id,
      'TEAM_MEMBER_REMOVE',
      `Removed coworker ID ${memberId} (${member.email}) from organization`,
      clientIp
    );

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove coworker error:', error);
    res.status(500).json({ error: 'Failed to remove coworker' });
  }
});

export default router;
