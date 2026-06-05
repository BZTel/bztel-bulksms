import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import database to trigger initialization
import './db.js';
import { queryGet, queryRun } from './db.js';

// Import routes
import authRoutes from './routes/auth.js';
import smsRoutes from './routes/sms.js';
import contactsRoutes from './routes/contacts.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import teamsRoutes from './routes/teams.js';
import birthdayRoutes from './routes/birthday.js';
import supportRoutes from './routes/support.js';
import voiceRoutes from './routes/voice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Enforce HTTPS redirection in production environment (e.g., Azure App Services)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(join(__dirname, 'public')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api', apiRoutes);         // API keys & public endpoints
app.use('/api/admin', adminRoutes); // Admin management endpoints
app.use('/api/billing', billingRoutes); // Wallet & transaction history
app.use('/api/teams', teamsRoutes);
app.use('/api/birthday', birthdayRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/voice', voiceRoutes);

// Marketing subpages routing
app.get('/bulk-sms', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'bulk-sms.html'));
});

app.get('/software-development', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'software-development.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'pricing.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'contact.html'));
});

// Serve the Bulk SMS App Dashboard on /app
app.get('/app', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'app.html'));
});

// Serve the Admin Portal on /admin
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

// Catch-all route to serve the public landing page index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ─── Seed Admin Account ──────────────────────────────────────────────────────
async function seedAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bztel.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const existing = await queryGet('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      await queryRun('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)', [adminEmail, hash, true]);
      console.log(`  Admin account created: ${adminEmail}`);
    } else {
      console.log(`  Admin account ready: ${adminEmail}`);
    }
  } catch (err) {
    console.error('  Failed to seed admin account:', err);
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`  Bztel Bulk SMS Server is running!               `);
  console.log(`  Customer Portal: http://localhost:${PORT}/app   `);
  console.log(`  Admin Portal:    http://localhost:${PORT}/admin `);
  console.log(`==================================================`);
  await seedAdminAccount();
  console.log(`==================================================`);
});
