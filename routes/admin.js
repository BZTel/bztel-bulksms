import express from 'express';
import { queryGet, queryAll, queryRun, deleteUserCascade } from '../db.js';
import db from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require a valid JWT AND admin flag
router.use(authenticateToken, requireAdmin);

// ─── Helper: compute SMS stats for a user ───────────────────────────────────
function getUserSMSStats(userId) {
  const id = Number(userId);
  const logs = db.data.sms_logs.filter(l => l.user_id === id);
  let sent = 0, failed = 0, pending = 0, credits_used = 0;
  logs.forEach(l => {
    if (l.status === 'sent') { sent++; credits_used += l.credits || 0; }
    else if (l.status === 'failed') { failed++; }
    else if (l.status === 'pending') { pending++; credits_used += l.credits || 0; }
  });
  return { total_sent: sent, total_failed: failed, total_pending: pending, credits_used };
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Returns all non-admin customers with their SMS stats
router.get('/users', async (req, res) => {
  try {
    const allUsers = await queryAll('SELECT * FROM users ORDER BY created_at DESC', []);
    const customers = allUsers
      .filter(u => !u.is_admin)
      .map(u => {
        const { password_hash, ...safe } = u;
        return { ...safe, ...getUserSMSStats(u.id) };
      });

    // Platform-wide totals (also useful for admin dashboard stats)
    const totalSent = db.data.sms_logs.filter(l => l.status === 'sent').length;
    const totalPending = db.data.sms_logs.filter(l => l.status === 'pending').length;
    const totalFailed = db.data.sms_logs.filter(l => l.status === 'failed').length;

    res.json({
      customers,
      platform_stats: {
        total_customers: customers.length,
        active: customers.filter(u => u.status === 'active').length,
        suspended: customers.filter(u => u.status === 'suspended').length,
        total_sms_sent: totalSent,
        total_sms_pending: totalPending,
        total_sms_failed: totalFailed
      }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
// Returns a single customer's full profile + SMS history
router.get('/users/:id', async (req, res) => {
  try {
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user || user.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const { password_hash, ...safe } = user;
    const stats = getUserSMSStats(user.id);
    const recentLogs = db.data.sms_logs
      .filter(l => l.user_id === user.id)
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      .slice(0, 20);

    res.json({ customer: { ...safe, ...stats }, recent_logs: recentLogs });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ─── POST /api/admin/users/:id/credits ───────────────────────────────────────
// Adjust a customer's credit balance. Body: { amount: 500 } (positive = add, negative = deduct)
router.post('/users/:id/credits', async (req, res) => {
  const { amount } = req.body;
  const userId = Number(req.params.id);

  if (amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: 'A numeric amount is required' });
  }

  try {
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || user.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const adj = Number(amount);
    const newBalance = Math.max(0, user.balance + adj);

    await queryRun('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);

    // Write admin transaction log
    const txType = adj >= 0 ? 'admin_credit' : 'admin_debit';
    const txDesc = adj >= 0
      ? `Admin credit \u2014 ${Math.abs(adj).toLocaleString()} credits added`
      : `Admin debit \u2014 ${Math.abs(adj).toLocaleString()} credits removed`;
    await queryRun(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, txType, adj, user.balance, newBalance, txDesc]
    );

    const action = adj >= 0 ? 'added' : 'deducted';
    res.json({
      message: `Successfully ${action} ${Math.abs(adj)} credits.`,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Admin adjust credits error:', error);
    res.status(500).json({ error: 'Failed to adjust credits' });
  }
});

// ─── PATCH /api/admin/users/:id/status ───────────────────────────────────────
// Suspend or reactivate a customer account. Body: { status: 'suspended' | 'active' }
router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  const userId = Number(req.params.id);

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "active" or "suspended"' });
  }

  try {
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || user.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await queryRun('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    res.json({
      message: `Account ${status === 'suspended' ? 'suspended' : 'reactivated'} successfully.`,
      status
    });
  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Permanently delete a customer and all their data
router.delete('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || user.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = deleteUserCascade(userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: `Customer ${user.email} and all their data deleted successfully.` });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
