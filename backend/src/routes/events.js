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
    const db = getPool();
    const events = db.prepare(`
      SELECT * FROM event_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ success: true, events });
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
    const db = getPool();
    const events = db.prepare(`
      SELECT * FROM event_logs
      WHERE event_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(type, parseInt(limit));

    res.json({ success: true, events });
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
    const db = getPool();

    const totalEvents = db.prepare(`
      SELECT COUNT(*) as total FROM event_logs
      WHERE event_type = 'recording.completed'
    `).get();

    const originalRecordings = db.prepare(`
      SELECT COUNT(*) as total FROM recordings
      WHERE recording_type = 'original'
    `).get();

    const shareLinks = db.prepare(`
      SELECT COUNT(*) as total FROM share_links
    `).get();

    const totalAccesses = db.prepare(`
      SELECT COALESCE(SUM(access_count), 0) as total FROM share_links
    `).get();

    res.json({
      success: true,
      stats: {
        total_events: totalEvents.total || 0,
        original_recordings: originalRecordings.total || 0,
        share_links_generated: shareLinks.total || 0,
        total_accesses: totalAccesses.total || 0
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
    const db = getPool();
    const recordings = db.prepare(`
      SELECT r.*, sl.token FROM recordings r
      LEFT JOIN share_links sl ON r.id = sl.recording_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `).all();

    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

export default router;