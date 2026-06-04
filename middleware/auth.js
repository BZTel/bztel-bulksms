import jwt from 'jsonwebtoken';
import { queryGet } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bztel-sms-app-secret-key-12345';

// Authenticates JWT and checks the user's account status on every request
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Check live account status so suspensions take effect immediately
    try {
      const dbUser = await queryGet('SELECT id, status FROM users WHERE id = ?', [user.id]);
      if (!dbUser) {
        return res.status(403).json({ error: 'Account not found' });
      }
      if (dbUser.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      }
    } catch (lookupErr) {
      return res.status(500).json({ error: 'Authentication error' });
    }

    req.user = user;
    next();
  });
}

// Restricts a route to admin users only (checks is_admin from JWT payload)
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
