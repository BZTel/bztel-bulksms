import express from 'express';
import { queryGet, queryAll, queryRun, deleteUserCascade, logAuditEvent } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require a valid JWT AND admin flag
router.use(authenticateToken, requireAdmin);

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Returns all non-admin customers with their SMS stats
router.get('/users', async (req, res) => {
  try {
    // Get non-admin customers with their aggregated SMS stats in a single JOIN query.
    // This is clean, fast, and fully SQL Server/Azure SQL compliant.
    const customers = await queryAll(`
      SELECT 
        u.id, u.email, u.status, u.balance, u.created_at, u.is_admin,
        COALESCE(SUM(CASE WHEN l.status = 'sent' THEN 1 ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN l.status = 'failed' THEN 1 ELSE 0 END), 0) as total_failed,
        COALESCE(SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN l.status IN ('sent', 'pending') THEN l.credits ELSE 0 END), 0) as credits_used
      FROM users u
      LEFT JOIN sms_logs l ON u.id = l.user_id
      WHERE u.is_admin = 0
      GROUP BY u.id, u.email, u.status, u.balance, u.created_at, u.is_admin
      ORDER BY u.created_at DESC
    `, []);

    // Platform-wide totals (also useful for admin dashboard stats)
    const totals = await queryGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as total_failed
      FROM sms_logs
    `, []);

    res.json({
      customers,
      platform_stats: {
        total_customers: customers.length,
        active: customers.filter(u => u.status === 'active').length,
        suspended: customers.filter(u => u.status === 'suspended').length,
        total_sms_sent: totals.total_sent,
        total_sms_pending: totals.total_pending,
        total_sms_failed: totals.total_failed
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

    // Get SMS stats for this user
    const stats = await queryGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as total_failed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status IN ('sent', 'pending') THEN credits ELSE 0 END), 0) as credits_used
      FROM sms_logs
      WHERE user_id = ?
    `, [user.id]);

    // Get top 20 recent logs for this user using SQL Server OFFSET-FETCH syntax
    const recentLogs = await queryAll(`
      SELECT * FROM sms_logs 
      WHERE user_id = ? 
      ORDER BY sent_at DESC 
      OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
    `, [user.id]);

    res.json({ 
      customer: { ...safe, ...stats }, 
      recent_logs: recentLogs 
    });
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
    
    // Audit Log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(
      req.user.id, 
      'ADMIN_CREDIT_ADJUSTMENT', 
      `Admin adjusted user ID ${userId} balance by ${adj}. New balance: ${newBalance}`, 
      clientIp
    );

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

    // Audit Log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(
      req.user.id,
      status === 'suspended' ? 'ADMIN_USER_SUSPEND' : 'ADMIN_USER_REACTIVATE',
      `Admin updated user ID ${userId} status to ${status}`,
      clientIp
    );

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

    // Await the cascade delete operation in database
    const result = await deleteUserCascade(userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Audit Log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAuditEvent(
      req.user.id,
      'ADMIN_USER_DELETE',
      `Admin permanently deleted user ID ${userId} (${user.email}) and all their data`,
      clientIp
    );

    res.json({ message: `Customer ${user.email} and all their data deleted successfully.` });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
