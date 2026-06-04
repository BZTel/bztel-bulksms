import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFile = join(__dirname, 'db.json');

// Initialize local DB state
let data = {
  users: [],
  contacts: [],
  sms_logs: [],
  templates: [],
  api_keys: []
};

// Load existing data if present
if (fs.existsSync(dbFile)) {
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    data = JSON.parse(raw);
    // Ensure all tables exist in loaded file
    data.users = data.users || [];
    data.contacts = data.contacts || [];
    data.sms_logs = data.sms_logs || [];
    data.templates = data.templates || [];
    data.api_keys = data.api_keys || [];
  } catch (err) {
    console.error('Failed to parse database file, starting clean.', err);
  }
} else {
  saveDB();
}

function saveDB() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database state to file:', err);
  }
}

// Generate new ID for a table
function getNextId(table) {
  const list = data[table] || [];
  if (list.length === 0) return 1;
  return Math.max(...list.map(item => item.id)) + 1;
}

// Custom SQL statement router/executor
export const queryRun = async (sql, params = []) => {
  const sqlClean = sql.trim().replace(/\s+/g, ' ');
  
  // Transaction queries - ignore or mock
  if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(sqlClean)) {
    return { id: 0, changes: 0 };
  }

  // INSERT INTO users (email, password_hash) VALUES (?, ?)
  if (/^INSERT INTO users/i.test(sqlClean)) {
    const [email, password_hash] = params;
    const newUser = {
      id: getNextId('users'),
      email,
      password_hash,
      balance: 100,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveDB();
    return { id: newUser.id, changes: 1 };
  }

  // UPDATE users SET balance = balance - ? WHERE id = ?
  // OR UPDATE users SET balance = balance + ? WHERE id = ?
  if (/^UPDATE users SET balance = balance ([-+]) \? WHERE id = \?/i.test(sqlClean)) {
    const match = sqlClean.match(/^UPDATE users SET balance = balance ([-+]) \? WHERE id = \?/i);
    const operator = match[1];
    const amount = Number(params[0]);
    const userId = Number(params[1]);

    const user = data.users.find(u => u.id === userId);
    if (user) {
      if (operator === '-') {
        user.balance -= amount;
      } else {
        user.balance += amount;
      }
      saveDB();
      return { id: userId, changes: 1 };
    }
    return { id: 0, changes: 0 };
  }

  // INSERT INTO contacts (user_id, name, phone, group_name) VALUES (?, ?, ?, ?)
  if (/^INSERT INTO contacts/i.test(sqlClean)) {
    const [user_id, name, phone, group_name] = params;
    const newContact = {
      id: getNextId('contacts'),
      user_id: Number(user_id),
      name,
      phone,
      group_name: group_name || 'Default',
      created_at: new Date().toISOString()
    };
    data.contacts.push(newContact);
    saveDB();
    return { id: newContact.id, changes: 1 };
  }

  // DELETE FROM contacts WHERE id = ?
  if (/^DELETE FROM contacts WHERE id = \?/i.test(sqlClean)) {
    const id = Number(params[0]);
    const initialLength = data.contacts.length;
    data.contacts = data.contacts.filter(c => c.id !== id);
    if (data.contacts.length !== initialLength) {
      saveDB();
      return { id, changes: 1 };
    }
    return { id, changes: 0 };
  }

  // INSERT INTO sms_logs (user_id, sender_id, recipient, message, credits, status) VALUES (?, ?, ?, ?, ?, 'pending')
  if (/^INSERT INTO sms_logs/i.test(sqlClean)) {
    const [user_id, sender_id, recipient, message, credits, status] = params;
    const newLog = {
      id: getNextId('sms_logs'),
      user_id: Number(user_id),
      sender_id,
      recipient,
      message,
      credits: Number(credits || 1),
      status: status || 'pending',
      sent_at: new Date().toISOString()
    };
    data.sms_logs.push(newLog);
    saveDB();
    return { id: newLog.id, changes: 1 };
  }

  // UPDATE sms_logs SET status = ? WHERE id = ?
  if (/^UPDATE sms_logs SET status = \? WHERE id = \?/i.test(sqlClean)) {
    const [status, id] = params;
    const log = data.sms_logs.find(l => l.id === Number(id));
    if (log) {
      log.status = status;
      saveDB();
      return { id: Number(id), changes: 1 };
    }
    return { id: 0, changes: 0 };
  }

  // INSERT INTO templates (user_id, name, content) VALUES (?, ?, ?)
  if (/^INSERT INTO templates/i.test(sqlClean)) {
    const [user_id, name, content] = params;
    const newTemplate = {
      id: getNextId('templates'),
      user_id: Number(user_id),
      name,
      content,
      created_at: new Date().toISOString()
    };
    data.templates.push(newTemplate);
    saveDB();
    return { id: newTemplate.id, changes: 1 };
  }

  // DELETE FROM templates WHERE id = ?
  if (/^DELETE FROM templates WHERE id = \?/i.test(sqlClean)) {
    const id = Number(params[0]);
    const initialLength = data.templates.length;
    data.templates = data.templates.filter(t => t.id !== id);
    if (data.templates.length !== initialLength) {
      saveDB();
      return { id, changes: 1 };
    }
    return { id, changes: 0 };
  }

  // INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)
  if (/^INSERT INTO api_keys/i.test(sqlClean)) {
    const [user_id, key, name] = params;
    const newKey = {
      id: getNextId('api_keys'),
      user_id: Number(user_id),
      key,
      name,
      created_at: new Date().toISOString()
    };
    data.api_keys.push(newKey);
    saveDB();
    return { id: newKey.id, changes: 1 };
  }

  // DELETE FROM api_keys WHERE id = ?
  if (/^DELETE FROM api_keys WHERE id = \?/i.test(sqlClean)) {
    const id = Number(params[0]);
    const initialLength = data.api_keys.length;
    data.api_keys = data.api_keys.filter(k => k.id !== id);
    if (data.api_keys.length !== initialLength) {
      saveDB();
      return { id, changes: 1 };
    }
    return { id, changes: 0 };
  }

  console.warn('Unhandled queryRun statement:', sqlClean);
  return { id: 0, changes: 0 };
};

export const queryGet = async (sql, params = []) => {
  const sqlClean = sql.trim().replace(/\s+/g, ' ');

  // SELECT id FROM users WHERE email = ?
  if (/^SELECT id FROM users WHERE email = \?/i.test(sqlClean)) {
    const email = params[0]?.toLowerCase();
    const user = data.users.find(u => u.email.toLowerCase() === email);
    return user ? { id: user.id } : null;
  }

  // SELECT * FROM users WHERE email = ?
  if (/^SELECT \* FROM users WHERE email = \?/i.test(sqlClean)) {
    const email = params[0]?.toLowerCase();
    const user = data.users.find(u => u.email.toLowerCase() === email);
    return user || null;
  }

  // SELECT id, email, balance FROM users WHERE id = ?
  if (/^SELECT id, email, balance FROM users WHERE id = \?/i.test(sqlClean)) {
    const id = Number(params[0]);
    const user = data.users.find(u => u.id === id);
    return user ? { id: user.id, email: user.email, balance: user.balance } : null;
  }

  // SELECT id FROM contacts WHERE id = ? AND user_id = ?
  if (/^SELECT id FROM contacts WHERE id = \? AND user_id = \?/i.test(sqlClean)) {
    const [id, user_id] = params.map(Number);
    const contact = data.contacts.find(c => c.id === id && c.user_id === user_id);
    return contact ? { id: contact.id } : null;
  }

  // SELECT id FROM templates WHERE id = ? AND user_id = ?
  if (/^SELECT id FROM templates WHERE id = \? AND user_id = \?/i.test(sqlClean)) {
    const [id, user_id] = params.map(Number);
    const template = data.templates.find(t => t.id === id && t.user_id === user_id);
    return template ? { id: template.id } : null;
  }

  // SELECT id FROM api_keys WHERE id = ? AND user_id = ?
  if (/^SELECT id FROM api_keys WHERE id = \? AND user_id = \?/i.test(sqlClean)) {
    const [id, user_id] = params.map(Number);
    const key = data.api_keys.find(k => k.id === id && k.user_id === user_id);
    return key ? { id: key.id } : null;
  }

  // SELECT user_id FROM api_keys WHERE key = ?
  if (/^SELECT user_id FROM api_keys WHERE key = \?/i.test(sqlClean)) {
    const key = params[0];
    const keyData = data.api_keys.find(k => k.key === key);
    return keyData ? { user_id: keyData.user_id } : null;
  }

  // SELECT balance FROM users WHERE id = ?
  if (/^SELECT balance FROM users WHERE id = \?/i.test(sqlClean)) {
    const id = Number(params[0]);
    const user = data.users.find(u => u.id === id);
    return user ? { balance: user.balance } : null;
  }

  console.warn('Unhandled queryGet statement:', sqlClean);
  return null;
};

export const queryAll = async (sql, params = []) => {
  const sqlClean = sql.trim().replace(/\s+/g, ' ');

  // SELECT * FROM contacts WHERE user_id = ? ORDER BY group_name, name
  if (/^SELECT \* FROM contacts WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const list = data.contacts.filter(c => c.user_id === userId);
    list.sort((a, b) => {
      const gComp = a.group_name.localeCompare(b.group_name);
      if (gComp !== 0) return gComp;
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  // SELECT name, phone FROM contacts WHERE user_id = ?
  if (/^SELECT name, phone FROM contacts WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    return data.contacts
      .filter(c => c.user_id === userId)
      .map(c => ({ name: c.name, phone: c.phone }));
  }

  // SELECT status, COUNT(*) as count, SUM(credits) as total_credits FROM sms_logs WHERE user_id = ? GROUP BY status
  if (/^SELECT status, COUNT\(\*\) as count, SUM\(credits\) as total_credits FROM sms_logs WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const userLogs = data.sms_logs.filter(l => l.user_id === userId);
    
    const groups = {};
    userLogs.forEach(l => {
      if (!groups[l.status]) {
        groups[l.status] = { status: l.status, count: 0, total_credits: 0 };
      }
      groups[l.status].count++;
      groups[l.status].total_credits += l.credits;
    });
    
    return Object.values(groups);
  }

  // SELECT DATE(sent_at) as date, COUNT(*) as count, SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as delivered FROM sms_logs WHERE user_id = ? AND sent_at >= datetime('now', '-7 days') GROUP BY DATE(sent_at) ORDER BY date ASC
  // Custom simple parser for last 7 days chart data
  if (/^SELECT DATE\(sent_at\) as date, COUNT\(\*\) as count/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userLogs = data.sms_logs.filter(l => {
      if (l.user_id !== userId) return false;
      const sentTime = new Date(l.sent_at);
      return sentTime >= sevenDaysAgo;
    });

    const datesMap = {};
    // Pre-populate last 7 days to make chart look complete
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      datesMap[dateStr] = { date: dateStr, count: 0, delivered: 0 };
    }

    userLogs.forEach(l => {
      const dateStr = l.sent_at.split('T')[0];
      if (datesMap[dateStr]) {
        datesMap[dateStr].count++;
        if (l.status === 'sent') {
          datesMap[dateStr].delivered++;
        }
      }
    });

    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  // SELECT * FROM sms_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT 100
  if (/^SELECT \* FROM sms_logs WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const list = data.sms_logs.filter(l => l.user_id === userId);
    list.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    return list.slice(0, 100);
  }

  // SELECT * FROM templates WHERE user_id = ? ORDER BY name ASC
  if (/^SELECT \* FROM templates WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const list = data.templates.filter(t => t.user_id === userId);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  // SELECT id, name, key, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC
  if (/^SELECT id, name, key, created_at FROM api_keys WHERE user_id = \?/i.test(sqlClean)) {
    const userId = Number(params[0]);
    const list = data.api_keys.filter(k => k.user_id === userId);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.map(k => ({
      id: k.id,
      name: k.name,
      key: k.key,
      created_at: k.created_at
    }));
  }

  console.warn('Unhandled queryAll statement:', sqlClean);
  return [];
};

const db = { data };
export default db;
