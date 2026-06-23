import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(email, password, name = '') {
  const pool = getPool();

  // Check if user already exists
  const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingResult.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = uuidv4();

  await pool.query(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES ($1, $2, $3, $4)
  `, [userId, email, passwordHash, name]);

  const user = {
    id: userId,
    email,
    name,
    created_at: new Date().toISOString()
  };

  const token = generateToken(user.id, user.email);

  return { user, token };
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  const pool = getPool();

  // Find user
  const result = await pool.query(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    },
    token
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const pool = getPool();

  const result = await pool.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Update user profile
 */
export async function updateUser(userId, updates) {
  const pool = getPool();

  const allowedFields = ['name', 'email'];
  const updateFields = Object.keys(updates)
    .filter(key => allowedFields.includes(key));

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClauses = updateFields.map((field, idx) => `${field} = $${idx + 1}`);
  const values = updateFields.map(field => updates[field]);
  values.push(userId);

  const query = `
    UPDATE users
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${updateFields.length + 1}
  `;

  await pool.query(query, values);

  const result = await pool.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0];
}