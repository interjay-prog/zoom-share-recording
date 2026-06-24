import { useState, useEffect } from 'react';
import axios from 'axios';
import './ZoomAccounts.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://zoom-share-recording-production.up.railway.app/api';

export default function ZoomAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/zoom/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setAccounts(response.data.accounts);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZoom = async () => {
    try {
      setLoading(true);

      // Get the auth URL
      const response = await axios.get(`${API_URL}/zoom/auth-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        // Redirect to Zoom OAuth
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      console.error('Error getting auth URL:', err);
      setError('Failed to connect to Zoom');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!window.confirm('Disconnect this Zoom account?')) return;

    try {
      const response = await axios.delete(`${API_URL}/zoom/accounts/${accountId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
      setError('Failed to disconnect account');
    }
  };

  if (loading) {
    return <div className="zoom-accounts"><p>Loading accounts...</p></div>;
  }

  return (
    <div className="zoom-accounts">
      <div className="accounts-header">
        <h2>🔗 Connected Zoom Accounts</h2>
        <button className="btn-primary" onClick={handleConnectZoom}>
          + Add Zoom Account
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>No Zoom accounts connected yet.</p>
          <p>Click "Add Zoom Account" to get started!</p>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map(account => (
            <div key={account.id} className="account-card">
              <div className="account-info">
                <h3>{account.account_name}</h3>
                <p className="account-email">{account.zoom_email}</p>
                <p className="account-meta">
                  Connected: {new Date(account.connected_at).toLocaleDateString()}
                </p>
                {account.webhook_verified && (
                  <span className="badge-verified">✓ Webhook Verified</span>
                )}
              </div>
              <button
                className="btn-danger"
                onClick={() => handleDisconnect(account.id)}
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
