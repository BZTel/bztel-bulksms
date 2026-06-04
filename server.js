import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import database to trigger initialization
import './db.js';

// Import routes
import authRoutes from './routes/auth.js';
import smsRoutes from './routes/sms.js';
import contactsRoutes from './routes/contacts.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(join(__dirname, 'public')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api', apiRoutes); // API keys & public endpoints

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

// Catch-all route to serve the public landing page index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Bztel Bulk SMS Server is running!               `);
  console.log(`  Local Address: http://localhost:${PORT}        `);
  console.log(`==================================================`);
});
