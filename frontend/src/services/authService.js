import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get stored JWT token from localStorage
 * @returns {string|null} - JWT token or null
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Get stored user from localStorage
 * @returns {object|null} - User object or null
 */
export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if token exists
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Set token and user in localStorage
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear auth data from localStorage
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Get axios instance with auth header
 * @returns {object} - Axios instance with authorization header
 */
export function getAuthenticatedAPI() {
  const token = getToken();
  const instance = axios.create({
    baseURL: API_BASE_URL
  });

  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return instance;
}

/**
 * Verify token with backend
 * @returns {Promise<boolean>} - True if token is valid
 */
export async function verifyToken() {
  try {
    const api = getAuthenticatedAPI();
    const response = await api.post('/auth/verify');
    return response.data.success;
  } catch (error) {
    console.error('Token verification failed:', error);
    clearAuth();
    return false;
  }
}

/**
 * Logout user
 * @returns {Promise<boolean>} - True if logout successful
 */
export async function logout() {
  try {
    const api = getAuthenticatedAPI();
    await api.post('/auth/logout');
    clearAuth();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local auth anyway
    clearAuth();
    return true;
  }
}
