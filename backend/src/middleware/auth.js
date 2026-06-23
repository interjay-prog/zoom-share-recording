import { verifyToken } from '../services/auth.js';

/**
 * Middleware to validate JWT token
 * Extracts user info from token and attaches to req.user
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token, just leaves req.user undefined
 */
export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
}
