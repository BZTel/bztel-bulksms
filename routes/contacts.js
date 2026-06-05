import express from 'express';
import { queryGet, queryAll, queryRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all contacts of the authenticated user's organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contacts = await queryAll(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY group_name, name',
      [req.user.owner_id]
    );
    res.json({ contacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Add a single contact (Owner, Admin, and Marketing Agent roles only)
router.post('/', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { name, phone, group_name, birthdate } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }

  const group = group_name ? group_name.trim() : 'Default';

  try {
    const result = await queryRun(
      'INSERT INTO contacts (user_id, name, phone, group_name, birthdate) VALUES (?, ?, ?, ?, ?)',
      [req.user.owner_id, name.trim(), phone.trim(), group, birthdate ? birthdate.trim() : null]
    );

    res.status(201).json({
      message: 'Contact added successfully',
      contact: {
        id: result.id,
        user_id: req.user.owner_id,
        name: name.trim(),
        phone: phone.trim(),
        group_name: group,
        birthdate: birthdate ? birthdate.trim() : null
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// Bulk import contacts (Owner, Admin, and Marketing Agent roles only)
router.post('/bulk', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { contacts } = req.body; // Array of { name, phone, group_name, birthdate }

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty contacts list' });
  }

  try {
    await queryRun('BEGIN TRANSACTION');

    const inserted = [];
    for (const item of contacts) {
      const { name, phone, group_name, birthdate } = item;
      if (!name || !phone) continue; // Skip invalid rows

      const group = group_name ? group_name.trim() : 'Default';

      const result = await queryRun(
        'INSERT INTO contacts (user_id, name, phone, group_name, birthdate) VALUES (?, ?, ?, ?, ?)',
        [req.user.owner_id, name.trim(), phone.trim(), group, birthdate ? birthdate.trim() : null]
      );
      
      inserted.push({
        id: result.id,
        name: name.trim(),
        phone: phone.trim(),
        group_name: group,
        birthdate: birthdate ? birthdate.trim() : null
      });
    }

    await queryRun('COMMIT');

    res.status(201).json({
      message: `Successfully imported ${inserted.length} contacts`,
      count: inserted.length,
      contacts: inserted
    });
  } catch (error) {
    console.error('Bulk import error, rolling back:', error);
    try {
      await queryRun('ROLLBACK');
    } catch (rbError) {}
    res.status(500).json({ error: 'Failed to bulk import contacts' });
  }
});

// Delete a contact (Owner, Admin, and Marketing Agent roles only)
router.delete('/:id', authenticateToken, requireRole(['Owner', 'Administrator', 'Marketing Agent']), async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.owner_id;

  try {
    // Check ownership first
    const contact = await queryGet('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [id, ownerId]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await queryRun('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
