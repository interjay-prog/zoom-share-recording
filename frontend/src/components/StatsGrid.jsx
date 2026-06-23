import './StatsGrid.css';

export default function StatsGrid({ stats }) {
  if (!stats) {
    return <div className="stats-grid loading">Loading statistics...</div>;
  }

  const statItems = [
    {
      label: 'Total Events',
      value: stats.total_events || 0,
      icon: '📥'
    },
    {
      label: 'Original Videos',
      value: stats.original_recordings || 0,
      icon: '✅'
    },
    {
      label: 'Share Links',
      value: stats.share_links_generated || 0,
      icon: '🔗'
    },
    {
      label: 'Total Accesses',
      value: stats.total_accesses || 0,
      icon: '👁️'
    }
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-icon">{item.icon}</div>
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
