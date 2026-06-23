import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db/init.js';

const router = express.Router();

// Zoom webhook signature validation middleware
function validateZoomWebhook(req, res, next) {
  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  const body = JSON.stringify(req.body);

  const token = process.env.ZOOM_WEBHOOK_TOKEN;

  if (!token) {
    console.warn('ZOOM_WEBHOOK_TOKEN not configured');
    return next();
  }

  const message = `v0:${timestamp}:${body}`;
  const hash = crypto
    .createHmac('sha256', token)
    .update(message)
    .digest('hex');
  const computedSignature = `v0=${hash}`;

  if (signature !== computedSignature) {
    console.warn('Invalid Zoom webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Handle Zoom webhooks
router.post('/zoom', validateZoomWebhook, async (req, res) => {
  const { event, payload } = req.body;

  try {
    console.log(`📬 Webhook: ${event}`);

    if (event === 'recording.completed' && payload.object?.type === 'original') {
      const recording = payload.object;
      console.log(`✅ Original recording: ${recording.id}`);

      try {
        const pool = getPool();

        // Find the zoom account
        const accountResult = await pool.query(
          'SELECT id, user_id FROM zoom_accounts WHERE zoom_user_id = $1',
          [recording.host_id]
        );
        const account = accountResult.rows[0];

        if (!account) {
          console.log(`⚠️  Account not found for ${recording.host_id}`);
          return res.json({ success: true });
        }

        // Insert recording
        const recordingId = uuidv4();
        await pool.query(`
          INSERT INTO recordings (
            id, zoom_account_id, recording_id, recording_url,
            recording_type, duration, file_size, started_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          recordingId,
          account.id,
          recording.id,
          recording.download_url,
          recording.type,
          recording.duration,
          recording.file_size,
          recording.start_time
        ]);

        // Generate share link
        const shareId = uuidv4();
        const shareToken = uuidv4();

        await pool.query(`
          INSERT INTO share_links (
            id, zoom_account_id, recording_id, token, created_by_user_id
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
          shareId,
          account.id,
          recordingId,
          shareToken,
          account.user_id
        ]);

        console.log(`📎 Share link: ${shareToken}`);

        return res.json({
          success: true,
          recording_id: recording.id,
          share_token: shareToken
        });
      } catch (dbError) {
        console.error('💥 DB error:', dbError.message);
        return res.json({ success: true });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

/**
 * POST /api/webhooks/zoom/test
 * Test endpoint for development (saves to DB)
 */
router.post('/zoom/test', async (req, res) => {
  const { event, payload } = req.body;

  console.log('🧪 Test webhook:', event);

  try {
    if (event === 'recording.completed' && payload.object?.type === 'original') {
      const recording = payload.object;
      console.log(`✅ Original recording: ${recording.id}`);

      try {
        const pool = getPool();

        // Find the zoom account
        const accountResult = await pool.query(
          'SELECT id, user_id FROM zoom_accounts WHERE zoom_user_id = $1',
          [recording.host_id]
        );
        const account = accountResult.rows[0];

        if (!account) {
          console.log(`⚠️  Account not found for ${recording.host_id}`);
          return res.json({ success: true });
        }

        // Insert recording
        const recordingId = uuidv4();
        await pool.query(`
          INSERT INTO recordings (
            id, zoom_account_id, recording_id, recording_url,
            recording_type, duration, file_size, started_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          recordingId,
          account.id,
          recording.id,
          recording.download_url,
          recording.type,
          recording.duration,
          recording.file_size,
          recording.start_time
        ]);

        // Generate share link
        const shareId = uuidv4();
        const shareToken = uuidv4();

        await pool.query(`
          INSERT INTO share_links (
            id, zoom_account_id, recording_id, token, created_by_user_id
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
          shareId,
          account.id,
          recordingId,
          shareToken,
          account.user_id
        ]);

        console.log(`📎 Share link: ${shareToken}`);

        return res.json({
          success: true,
          recording_id: recording.id,
          share_token: shareToken
        });
      } catch (dbError) {
        console.error('💥 DB error:', dbError.message);
        return res.json({ success: true });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
