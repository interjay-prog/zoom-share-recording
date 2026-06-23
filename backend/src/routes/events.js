import express from 'express';
import { getPool } from '../db/init.js';

const router = express.Router();

/**
 * GET /api/events/recent
 * Get recent events
 */
router.get('/recent', async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM event_logs
      ORDER BY created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/by-type/:type
 * Get events by type
 */
router.get('/by-type/:type', async (req, res) => {
  const { type } = req.params;
  const { limit = 50 } = req.query;

  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM event_logs
      WHERE event_type = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [type, parseInt(limit)]);

    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();

    const totalEventsResult = await pool.query(`
      SELECT COUNT(*) as total FROM event_logs
      WHERE event_type = 'recording.completed'
    `);

    const originalRecordingsResult = await pool.query(`
      SELECT COUNT(*) as total FROM recordings
      WHERE recording_type = 'original'
    `);

    const shareLinksResult = await pool.query(`
      SELECT COUNT(*) as total FROM share_links
    `);

    const totalAccessesResult = await pool.query(`
      SELECT COALESCE(SUM(access_count), 0) as total FROM share_links
    `);

    res.json({
      success: true,
      stats: {
        total_events: parseInt(totalEventsResult.rows[0].total) || 0,
        original_recordings: parseInt(originalRecordingsResult.rows[0].total) || 0,
        share_links_generated: parseInt(shareLinksResult.rows[0].total) || 0,
        total_accesses: parseInt(totalAccessesResult.rows[0].total) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/events/recordings
 * Get all recorded videos
 */
router.get('/recordings', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT r.*, sl.token FROM recordings r
      LEFT JOIN share_links sl ON r.id = sl.recording_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);

    res.json({ success: true, recordings: result.rows });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

export default router;