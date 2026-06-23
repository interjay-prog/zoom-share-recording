import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db/init.js';

/**
 * Generate a unique share token for a recording
 * @param {string} recordingId - Zoom recording ID
 * @returns {Promise<string>} - Share token
 */
export async function generateShareLink(recordingId) {
  const pool = getPool();
  const token = uuidv4();

  const query = `
    INSERT INTO share_links (token, recording_id)
    VALUES ($1, $2)
    RETURNING token
  `;

  try {
    const result = await pool.query(query, [token, recordingId]);
    return result.rows[0].token;
  } catch (error) {
    console.error('Error generating share link:', error);
    throw error;
  }
}

/**
 * Get recording by share token
 * @param {string} token - Share token
 * @returns {Promise<object|null>} - Recording data or null
 */
export async function getRecordingByToken(token) {
  const pool = getPool();

  const query = `
    SELECT r.*, sl.token, sl.access_count, sl.last_accessed
    FROM share_links sl
    JOIN recordings r ON sl.recording_id = r.id
    WHERE sl.token = $1
  `;

  try {
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching recording by token:', error);
    throw error;
  }
}

/**
 * Increment access count for a share link
 * @param {string} token - Share token
 */
export async function updateAccessCount(token) {
  const pool = getPool();

  const query = `
    UPDATE share_links
    SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
    WHERE token = $1
  `;

  try {
    await pool.query(query, [token]);
  } catch (error) {
    console.error('Error updating access count:', error);
  }
}
