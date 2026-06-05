import 'dotenv/config';
import sql from 'mssql';

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'bztel_db',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

console.log(`[Database] Connecting to server: ${config.server}, database: ${config.database}...`);
const poolPromise = sql.connect(config);

// Auto-initialize the database schema if needed
async function initializeDatabase(pool) {
  try {
    const check = await pool.request().query("SELECT * FROM sys.tables WHERE name = 'users'");
    if (check.recordset.length === 0) {
      console.log("[Database] Initializing database tables for Azure SQL...");
      
      // Create users table
      await pool.request().query(`
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          is_admin BIT NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          balance INT NOT NULL DEFAULT 100,
          role VARCHAR(50) NOT NULL DEFAULT 'Owner',
          parent_user_id INT NULL FOREIGN KEY REFERENCES users(id),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Create contacts table
      await pool.request().query(`
        CREATE TABLE contacts (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          group_name VARCHAR(255) NOT NULL DEFAULT 'Default',
          birthdate VARCHAR(10) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create sms_logs table
      await pool.request().query(`
        CREATE TABLE sms_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          sender_id VARCHAR(11) NOT NULL,
          recipient VARCHAR(50) NOT NULL,
          message NVARCHAR(MAX) NOT NULL,
          credits INT NOT NULL DEFAULT 1,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          sent_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create templates table
      await pool.request().query(`
        CREATE TABLE templates (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          content NVARCHAR(MAX) NOT NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create api_keys table
      await pool.request().query(`
        CREATE TABLE api_keys (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          key VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create transactions table
      await pool.request().query(`
        CREATE TABLE transactions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          amount INT NOT NULL,
          balance_before INT NOT NULL,
          balance_after INT NOT NULL,
          description VARCHAR(255) NOT NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create birthday_campaigns table
      await pool.request().query(`
        CREATE TABLE birthday_campaigns (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          sender_id VARCHAR(11) NOT NULL,
          target_group VARCHAR(255) NOT NULL,
          dispatch_time VARCHAR(5) NOT NULL,
          message_template NVARCHAR(MAX) NOT NULL,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create support_tickets table
      await pool.request().query(`
        CREATE TABLE support_tickets (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(255) NOT NULL,
          priority VARCHAR(50) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Open',
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create service_requests table
      await pool.request().query(`
        CREATE TABLE service_requests (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          service_type VARCHAR(255) NOT NULL,
          rep_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Reviewing',
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create voice_logs table
      await pool.request().query(`
        CREATE TABLE voice_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          sender_id VARCHAR(15) NOT NULL,
          recipient VARCHAR(50) NOT NULL,
          audio_url VARCHAR(255) NULL,
          tts_text NVARCHAR(MAX) NULL,
          duration INT NOT NULL DEFAULT 0,
          credits INT NOT NULL DEFAULT 1,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          sent_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);

      // Create audit_logs table
      await pool.request().query(`
        CREATE TABLE audit_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NULL FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          details NVARCHAR(MAX) NOT NULL,
          ip_address VARCHAR(50) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        )
      `);
      
      console.log("[Database] Database tables created. Creating production indexes...");
      
      // Indexes to optimize joins, filterings, and stats lookups
      await pool.request().query("CREATE INDEX idx_users_parent ON users(parent_user_id)");
      await pool.request().query("CREATE INDEX idx_contacts_user ON contacts(user_id)");
      await pool.request().query("CREATE INDEX idx_contacts_group ON contacts(group_name)");
      await pool.request().query("CREATE INDEX idx_sms_logs_user_sent ON sms_logs(user_id, sent_at DESC)");
      await pool.request().query("CREATE INDEX idx_templates_user ON templates(user_id)");
      await pool.request().query("CREATE INDEX idx_api_keys_user ON api_keys(user_id)");
      await pool.request().query("CREATE INDEX idx_transactions_user ON transactions(user_id)");
      await pool.request().query("CREATE INDEX idx_birthday_campaigns_user ON birthday_campaigns(user_id)");
      await pool.request().query("CREATE INDEX idx_support_tickets_user ON support_tickets(user_id)");
      await pool.request().query("CREATE INDEX idx_service_requests_user ON service_requests(user_id)");
      await pool.request().query("CREATE INDEX idx_voice_logs_user ON voice_logs(user_id)");
      await pool.request().query("CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)");
      await pool.request().query("CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC)");
      
      console.log("[Database] Database tables and indexes initialized successfully.");
    } else {
      console.log("[Database] Database tables verified. Ready.");
    }
  } catch (err) {
    console.error("[Database] Failed to initialize database tables:", err);
  }
}

// Kick off connection and schema verification
(async () => {
  try {
    const pool = await poolPromise;
    console.log("[Database] Connected successfully.");
    await initializeDatabase(pool);
  } catch (err) {
    console.error("[Database] Connection failed:", err);
  }
})();

/**
 * Execute a query and return the first row (or null if empty)
 */
export async function queryGet(sqlStr, params = []) {
  const pool = await poolPromise;
  const request = pool.request();
  let index = 0;
  const convertedQuery = sqlStr.replace(/\?/g, () => {
    const paramName = `p${index}`;
    request.input(paramName, params[index]);
    index++;
    return `@${paramName}`;
  });
  
  const result = await request.query(convertedQuery);
  return result.recordset[0] || null;
}

/**
 * Execute a query and return all matching rows
 */
export async function queryAll(sqlStr, params = []) {
  const pool = await poolPromise;
  const request = pool.request();
  let index = 0;
  const convertedQuery = sqlStr.replace(/\?/g, () => {
    const paramName = `p${index}`;
    request.input(paramName, params[index]);
    index++;
    return `@${paramName}`;
  });
  
  const result = await request.query(convertedQuery);
  return result.recordset;
}

/**
 * Run an INSERT, UPDATE, or DELETE query.
 * For INSERT, it returns { id: insertedId, changes: rowsAffected }
 */
export async function queryRun(sqlStr, params = []) {
  const sqlClean = sqlStr.trim().replace(/\s+/g, ' ');
  
  // Transaction queries - ignore/mock to prevent connection pooling and transaction scoping issues
  if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(sqlClean)) {
    return { id: 0, changes: 0 };
  }

  const pool = await poolPromise;
  const request = pool.request();
  let index = 0;
  let convertedQuery = sqlStr.replace(/\?/g, () => {
    const paramName = `p${index}`;
    request.input(paramName, params[index]);
    index++;
    return `@${paramName}`;
  });

  // For inserts, append SELECT SCOPE_IDENTITY() to fetch the generated identity key
  const isInsert = /^\s*INSERT\s+INTO/i.test(convertedQuery);
  if (isInsert) {
    convertedQuery += '; SELECT SCOPE_IDENTITY() AS id;';
  }
  
  const result = await request.query(convertedQuery);
  const insertId = result.recordset?.[0]?.id || null;
  const rowsAffected = result.rowsAffected[0] || 0;
  
  return { 
    id: insertId, 
    changes: rowsAffected 
  };
}

/**
 * Cascade deletes a user (manually cascading to self-referencing child accounts to prevent SQL Server cycle restrictions, and letting ON DELETE CASCADE handle other tables)
 */
export async function deleteUserCascade(userId) {
  const id = Number(userId);
  // Manually delete child coworkers first
  await queryRun('DELETE FROM users WHERE parent_user_id = ?', [id]);
  const result = await queryRun('DELETE FROM users WHERE id = ?', [id]);
  return { changes: result.changes };
}

/**
 * Log an event to the audit_logs table for administrative auditing
 */
export async function logAuditEvent(userId, action, details, ipAddress = null) {
  try {
    await queryRun(
      `INSERT INTO audit_logs (user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?)`,
      [userId || null, action, typeof details === 'object' ? JSON.stringify(details) : details, ipAddress]
    );
  } catch (err) {
    console.error('[Database] Failed to write audit log event:', err);
  }
}

const db = {
  data: {
    users: [],
    contacts: [],
    sms_logs: [],
    templates: [],
    api_keys: [],
    transactions: []
  }
};

export default db;
