import express from 'express';
import { registerUser, loginUser, getUserById } from '../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Register user
    const result = await registerUser(email, password, name);

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Login user
    const result = await loginUser(email, password);

    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 * This is mostly for frontend - backend doesn't track logout
 * In production, could use token blacklist
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client.'
  });
});

/**
 * POST /api/auth/verify
 * Verify token is valid
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token is valid'
  });
});

export default router;
