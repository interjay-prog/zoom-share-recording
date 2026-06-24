import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';

/**
 * GET /api/zoom/auth-url
 * Generate the Zoom OAuth authorization URL
 */
router.get('/auth-url', authMiddleware, (req, res) => {
  try {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:5000/api/zoom/callback';

    const authUrl = `${ZOOM_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/zoom/callback
 * Zoom OAuth redirect endpoint - receives code and redirects to frontend
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code) {
      return res.redirect(`${frontendUrl}?error=no_code`);
    }

    // Redirect to frontend callback page with code
    res.redirect(`${frontendUrl}/zoom/callback?code=${code}`);
  } catch (error) {
    console.error('Error in callback:', error);
    res.redirect(`http://localhost:3000?error=callback_failed`);
  }
});

/**
 * POST /api/zoom/callback-exchange
 * Exchange authorization code for access token
 */
router.post('/callback-exchange', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    // Exchange authorization code for access token
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:5000/api/zoom/callback';

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Debug logging
    console.log('Token exchange attempt:');
    console.log('  Code:', code);
    console.log('  Redirect URI:', redirectUri);
    console.log('  Client ID:', clientId);
    console.log('  Token URL:', ZOOM_TOKEN_URL);

    const tokenResponse = await axios.post(
      ZOOM_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get Zoom user info
    const userResponse = await axios.get('https://zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const zoomUserId = userResponse.data.user_id || userResponse.data.id;
    const zoomEmail = userResponse.data.email || userResponse.data.email_address;

    // Save to database
    const pool = getPool();
    const accountId = uuidv4();
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();
    const webhookToken = uuidv4();

    await pool.query(`
      INSERT INTO zoom_accounts (
        id, user_id, zoom_user_id, zoom_email, access_token,
        refresh_token, token_expires_at, webhook_token, account_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      accountId,
      userId,
      zoomUserId,
      zoomEmail,
      access_token,
      refresh_token,
      tokenExpiry,
      webhookToken,
      `Zoom Account - ${zoomEmail}`
    ]);

    res.json({
      success: true,
      account: {
        id: accountId,
        zoom_email: zoomEmail,
        zoom_user_id: zoomUserId,
        webhook_token: webhookToken
      }
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({
      error: 'Failed to connect Zoom account',
      details: error.message
    });
  }
});

/**
 * GET /api/zoom/accounts
 * Get all connected Zoom accounts for current user
 */
router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT id, zoom_email, zoom_user_id, account_name, webhook_verified, connected_at
      FROM zoom_accounts
      WHERE user_id = $1
      ORDER BY connected_at DESC
    `, [userId]);

    res.json({ success: true, accounts: result.rows });
  } catch (error) {
    console.error('Error fetching Zoom accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * DELETE /api/zoom/accounts/:accountId
 * Disconnect a Zoom account
 */
router.delete('/accounts/:accountId', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user.userId;
    const { accountId } = req.params;

    // Verify ownership
    const result = await pool.query('SELECT user_id FROM zoom_accounts WHERE id = $1', [accountId]);
    const account = result.rows[0];

    if (!account || account.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete account and related data (cascading delete handles this)
    await pool.query('DELETE FROM zoom_accounts WHERE id = $1', [accountId]);

    res.json({ success: true, message: 'Account disconnected' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

export default router;
