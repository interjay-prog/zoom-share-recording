import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initDB() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS zoom_accounts (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        zoom_user_id VARCHAR(255) NOT NULL,
        zoom_email VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_expires_at TIMESTAMP,
        account_name VARCHAR(255),
        webhook_token VARCHAR(255) UNIQUE,
        webhook_verified BOOLEAN DEFAULT FALSE,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recordings (
        id UUID PRIMARY KEY,
        zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id) ON DELETE CASCADE,
        recording_id VARCHAR(255) NOT NULL,
        recording_url TEXT NOT NULL,
        recording_type VARCHAR(50) NOT NULL,
        duration INTEGER,
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS share_links (
        id UUID PRIMARY KEY,
        zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id) ON DELETE CASCADE,
        recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id UUID PRIMARY KEY,
        zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        recording_id VARCHAR(255),
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indices
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_zoom_accounts_user_id ON zoom_accounts(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_zoom_accounts_zoom_user_id ON zoom_accounts(zoom_user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_recordings_zoom_account_id ON recordings(zoom_account_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_share_links_recording_id ON share_links(recording_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_logs_zoom_account_id ON event_logs(zoom_account_id);`);

    console.log('Database initialized successfully');
    return pool;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getPool() {
  return pool;
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});