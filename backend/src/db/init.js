import Database from 'better-sqlite3';

const db = new Database('./zoom_share.db');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

export function initDB() {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create zoom_accounts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS zoom_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        zoom_user_id TEXT NOT NULL,
        zoom_email TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_expires_at DATETIME,
        account_name TEXT,
        webhook_token TEXT UNIQUE,
        webhook_verified BOOLEAN DEFAULT 0,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_synced_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create recordings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        zoom_account_id TEXT NOT NULL REFERENCES zoom_accounts(id),
        recording_id TEXT NOT NULL,
        recording_url TEXT NOT NULL,
        recording_type TEXT NOT NULL,
        duration INTEGER,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME
      )
    `);

    // Create share_links table
    db.exec(`
      CREATE TABLE IF NOT EXISTS share_links (
        id TEXT PRIMARY KEY,
        zoom_account_id TEXT NOT NULL REFERENCES zoom_accounts(id),
        recording_id TEXT NOT NULL REFERENCES recordings(id),
        token TEXT UNIQUE NOT NULL,
        created_by_user_id TEXT NOT NULL REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        access_count INTEGER DEFAULT 0,
        last_accessed DATETIME
      )
    `);

    // Create event_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id TEXT PRIMARY KEY,
        zoom_account_id TEXT NOT NULL REFERENCES zoom_accounts(id),
        event_type TEXT NOT NULL,
        recording_id TEXT,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getPool() {
  return db;
}