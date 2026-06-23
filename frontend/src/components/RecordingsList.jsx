import { useState } from 'react';
import './RecordingsList.css';

export default function RecordingsList({ recordings }) {
  const [copiedToken, setCopiedToken] = useState(null);

  const copyToClipboard = (token) => {
    const shareUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = (bytes / (1024 * 1024 * 1024)).toFixed(2);
    return `${gb} GB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!recordings || recordings.length === 0) {
    return (
      <div className="recordings-list empty">
        <p>No recordings yet. Waiting for Zoom events...</p>
      </div>
    );
  }

  return (
    <div className="recordings-list">
      <div className="recordings-grid">
        {recordings.map((recording) => (
          <div key={recording.recording_id} className="recording-card">
            <div className="recording-header">
              <h3 className="recording-title">{recording.recording_id}</h3>
              <span className="recording-type">{recording.recording_type}</span>
            </div>

            <div className="recording-details">
              <div className="detail">
                <span className="label">Duration:</span>
                <span className="value">{formatDuration(recording.duration)}</span>
              </div>
              <div className="detail">
                <span className="label">Size:</span>
                <span className="value">{formatFileSize(recording.file_size)}</span>
              </div>
              <div className="detail">
                <span className="label">Created:</span>
                <span className="value">{formatDate(recording.created_at)}</span>
              </div>
            </div>

            {recording.token ? (
              <div className="share-section">
                <div className="share-token">
                  <input
                    type="text"
                    readOnly
                    value={recording.token}
                    className="token-input"
                  />
                  <button
                    className={`copy-button ${
                      copiedToken === recording.token ? 'copied' : ''
                    }`}
                    onClick={() => copyToClipboard(recording.token)}
                  >
                    {copiedToken === recording.token ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="share-section">
                <span className="no-share">No share link generated</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
