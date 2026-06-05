import express from 'express';
import { queryAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/billing/transactions — returns full transaction history + summary
router.get('/transactions', authenticateToken, async (req, res) => {
  const ownerId = req.user.owner_id;
  try {
    const transactions = await queryAll(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [ownerId]
    );

    let total_credited = 0;
    let total_debited = 0;

    transactions.forEach(tx => {
      if (tx.amount > 0) total_credited += tx.amount;
      else total_debited += Math.abs(tx.amount);
    });

    res.json({
      transactions,
      summary: {
        total_credited,
        total_debited,
        count: transactions.length
      }
    });
  } catch (error) {
    console.error('Billing transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

export default router;
