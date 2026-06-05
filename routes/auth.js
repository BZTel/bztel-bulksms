import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryGet, queryRun, logAuditEvent } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bztel-sms-app-secret-key-12345';

// Check email regex helper
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Strict password strength validation regex
// Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

// User Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).' 
    });
  }

  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Check if user already exists
    const existingUser = await queryGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      await logAuditEvent(null, 'SIGNUP_FAILURE', `Attempted to register existing email: ${email}`, clientIp);
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (defaults to 100 balance)
    const result = await queryRun(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );

    // Create JWT
    const token = jwt.sign({ id: result.id, email, is_admin: false }, JWT_SECRET, { expiresIn: '7d' });

    // Write signup bonus transaction
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [result.id, 'signup_bonus', 100, 0, 100, 'Account signup — welcome bonus credits']
    );

    // Write audit log
    await logAuditEvent(result.id, 'SIGNUP_SUCCESS', `Account registered successfully for ${email}`, clientIp);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        email,
        balance: 100
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Find user
    const user = await queryGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await logAuditEvent(null, 'LOGIN_FAILURE', `Invalid login attempt for email: ${email}`, clientIp);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      await logAuditEvent(user.id, 'LOGIN_SUSPENDED', `Attempted login to suspended account: ${email}`, clientIp);
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAuditEvent(user.id, 'LOGIN_FAILURE', `Failed password attempt for email: ${email}`, clientIp);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-activate pending coworkers on successful first login
    if (user.status.toLowerCase() === 'pending') {
      await queryRun("UPDATE users SET status = 'active' WHERE id = ?", [user.id]);
      user.status = 'active';
      await logAuditEvent(user.id, 'COWORKER_ACTIVATION', `Coworker account activated upon first successful login: ${email}`, clientIp);
    }

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin || false }, JWT_SECRET, { expiresIn: '7d' });

    await logAuditEvent(user.id, 'LOGIN_SUCCESS', `User logged in successfully`, clientIp);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile (checks token validity and balance)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryGet('SELECT id, email, balance, role, parent_user_id FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Resolve shared wallet balance for team coworkers
    const ownerId = user.parent_user_id || user.id;
    if (user.parent_user_id) {
      const owner = await queryGet('SELECT balance FROM users WHERE id = ?', [ownerId]);
      if (owner) {
        user.balance = owner.balance;
      }
    }

    res.json({ user });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Top up user balance (Simulated payment success)
router.post('/topup', authenticateToken, async (req, res) => {
  const { credits } = req.body;
  if (!credits || isNaN(credits) || Number(credits) <= 0) {
    return res.status(400).json({ error: 'Valid credits amount is required' });
  }

  const ownerId = req.user.owner_id;

  try {
    await queryRun('UPDATE users SET balance = balance + ? WHERE id = ?', [Number(credits), ownerId]);
    const owner = await queryGet('SELECT balance FROM users WHERE id = ?', [ownerId]);

    // Write purchase transaction under the owner's ID
    const balanceBefore = owner.balance - Number(credits);
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [ownerId, 'purchase', Number(credits), balanceBefore, owner.balance, `Credit Top-Up — ${Number(credits).toLocaleString()} SMS Credits`]
    );

    res.json({
      message: `Successfully added ${credits} credits to your account!`,
      balance: owner.balance
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ error: 'Failed to process topup' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      error: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).' 
    });
  }

  try {
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await queryRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(req.user.id, 'PASSWORD_CHANGE', `User changed password successfully from IP: ${clientIp}`, clientIp);

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
