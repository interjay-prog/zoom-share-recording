import express from 'express';
import { getRecordingByToken, updateAccessCount } from '../services/linkGenerator.js';

const router = express.Router();

/**
 * GET /api/share/:token
 * Returns recording info or redirect to download
 */
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const recording = await getRecordingByToken(token);

    if (!recording) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Update access count
    await updateAccessCount(token);

    // Return recording info with download URL
    res.json({
      success: true,
      recording: {
        id: recording.recording_id,
        download_url: recording.recording_url,
        duration: recording.duration,
        file_size: recording.file_size,
        created_at: recording.created_at,
        access_count: recording.access_count + 1
      }
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    res.status(500).json({ error: 'Failed to retrieve recording' });
  }
});

/**
 * POST /api/share/:token/redirect
 * Redirect to Zoom download URL
 */
router.post('/:token/redirect', async (req, res) => {
  const { token } = req.params;

  try {
    const recording = await getRecordingByToken(token);

    if (!recording) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Update access count
    await updateAccessCount(token);

    // Redirect to Zoom download URL
    res.redirect(recording.recording_url);
  } catch (error) {
    console.error('Error redirecting to download:', error);
    res.status(500).json({ error: 'Failed to redirect' });
  }
});

/**
 * GET /api/share/:token/info
 * Get detailed link info (for dashboard)
 */
router.get('/:token/info', async (req, res) => {
  const { token } = req.params;

  try {
    const recording = await getRecordingByToken(token);

    if (!recording) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    res.json({
      success: true,
      link_info: {
        token,
        recording_id: recording.recording_id,
        duration: recording.duration,
        file_size: recording.file_size,
        access_count: recording.access_count,
        created_at: recording.created_at,
        last_accessed: recording.last_accessed,
        share_url: `${process.env.API_URL}/api/share/${token}`
      }
    });
  } catch (error) {
    console.error('Error fetching link info:', error);
    res.status(500).json({ error: 'Failed to retrieve link info' });
  }
});

export default router;
