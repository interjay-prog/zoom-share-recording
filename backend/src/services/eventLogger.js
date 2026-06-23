import { getPool } from '../db/init.js';

/**
 * Log webhook events to database
 * @param {string} eventType - Type of event (e.g., 'recording.completed')
 * @param {object} payload - Event payload
 */
export async function logEvent(eventType, payload) {
  const pool = getPool();

  const query = `
    INSERT INTO event_logs (event_type, recording_id, payload)
    VALUES ($1, $2, $3)
  `;

  try {
    const recordingId = payload.object?.id || null;
    await pool.query(query, [eventType, recordingId, JSON.stringify(payload)]);
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

/**
 * Get recent events
 * @param {number} limit - Number of events to return
 * @returns {Promise<array>} - Array of events
 */
export async function getRecentEvents(limit = 50) {
  const pool = getPool();

  const query = `
    SELECT * FROM event_logs
    ORDER BY created_at DESC
    LIMIT $1
  `;

  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Get events by type
 * @param {string} eventType - Type of event
 * @param {number} limit - Number of events to return
 * @returns {Promise<array>} - Array of events
 */
export async function getEventsByType(eventType, limit = 50) {
  const pool = getPool();

  const query = `
    SELECT * FROM event_logs
    WHERE event_type = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [eventType, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching events by type:', error);
    throw error;
  }
}
