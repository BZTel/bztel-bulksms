import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryGet, queryRun } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bztel-sms-app-secret-key-12345';

// Check email regex helper
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// User Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await queryGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
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
    // Find user
    const user = await queryGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin || false }, JWT_SECRET, { expiresIn: '7d' });

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
    const user = await queryGet('SELECT id, email, balance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

  try {
    await queryRun('UPDATE users SET balance = balance + ? WHERE id = ?', [Number(credits), req.user.id]);
    const user = await queryGet('SELECT balance FROM users WHERE id = ?', [req.user.id]);

    // Write purchase transaction
    const balanceBefore = user.balance - Number(credits);
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'purchase', Number(credits), balanceBefore, user.balance, `Credit Top-Up — ${Number(credits).toLocaleString()} SMS Credits`]
    );

    res.json({
      message: `Successfully added ${credits} credits to your account!`,
      balance: user.balance
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ error: 'Failed to process topup' });
  }
});

export default router;
