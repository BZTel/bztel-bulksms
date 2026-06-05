import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get support tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const tickets = await queryAll(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    res.json({ tickets });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Create support ticket
router.post('/tickets', authenticateToken, async (req, res) => {
  const { subject, priority, description } = req.body;
  const ownerId = req.user.owner_id;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and Description are required' });
  }

  try {
    const result = await queryRun(
      `INSERT INTO support_tickets (user_id, subject, priority, description) 
       VALUES (?, ?, ?, ?)`,
      [ownerId, subject.trim(), priority || 'medium', description.trim()]
    );
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: result.id,
        subject,
        priority,
        status: 'Open',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to submit support ticket' });
  }
});

// Get custom service requests
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const requests = await queryAll(
      'SELECT * FROM service_requests WHERE user_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    res.json({ requests });
  } catch (error) {
    console.error('Fetch service requests error:', error);
    res.status(500).json({ error: 'Failed to fetch custom service requests' });
  }
});

// Create custom service request
router.post('/services', authenticateToken, async (req, res) => {
  const { serviceType, repName, phone, description } = req.body;
  const ownerId = req.user.owner_id;

  if (!serviceType || !repName || !phone || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await queryRun(
      `INSERT INTO service_requests (user_id, service_type, rep_name, phone, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [ownerId, serviceType, repName.trim(), phone.trim(), description.trim()]
    );
    res.status(201).json({
      message: 'Custom service request submitted successfully',
      request: {
        id: result.id,
        serviceType,
        repName,
        phone,
        description,
        status: 'Reviewing',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Failed to submit custom service request' });
  }
});

export default router;
