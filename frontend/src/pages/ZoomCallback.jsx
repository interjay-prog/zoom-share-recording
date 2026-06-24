import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://zoom-share-recording-production.up.railway.app/api';

export default function ZoomCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');

        if (!code) {
          setStatus('❌ No authorization code received');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Exchange code for tokens
        const response = await axios.post(
          `${API_URL}/zoom/callback-exchange`,
          { code },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setStatus('✅ Zoom account connected successfully!');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setStatus('❌ Failed to connect account');
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        setStatus(`❌ Error: ${error.response?.data?.error || error.message}`);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, token, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>{status}</h1>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
