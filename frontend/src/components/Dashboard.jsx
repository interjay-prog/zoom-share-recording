import { useState } from 'react';
import StatsGrid from './StatsGrid';
import RecordingsList from './RecordingsList';
import EventLog from './EventLog';
import ZoomAccounts from './ZoomAccounts';
import './Dashboard.css';

export default function Dashboard({ stats, recordings, events }) {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="dashboard">
      <StatsGrid stats={stats} />

      {/* Zoom Accounts Section */}
      <ZoomAccounts />

      <div className="dashboard-content">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'recordings' ? 'active' : ''}`}
            onClick={() => setActiveTab('recordings')}
          >
            📚 Recordings ({recordings.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📋 Event Log ({events.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'recordings' && (
            <RecordingsList recordings={recordings} />
          )}
          {activeTab === 'events' && <EventLog events={events} />}
        </div>
      </div>
    </div>
  );
}
