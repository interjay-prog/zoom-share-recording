import './EventLog.css';

export default function EventLog({ events }) {
  const getEventIcon = (eventType) => {
    const icons = {
      'recording.completed': '✅',
      'recording.registered': '📝',
      'recording.started': '⏺️',
      'recording.stopped': '⏹️'
    };
    return icons[eventType] || '📌';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return time;
  };

  if (!events || events.length === 0) {
    return (
      <div className="event-log empty">
        <p>No events yet...</p>
      </div>
    );
  }

  return (
    <div className="event-log">
      <div className="event-list">
        {events.map((event, idx) => (
          <div key={idx} className="event-item">
            <div className="event-icon">{getEventIcon(event.event_type)}</div>
            <div className="event-content">
              <div className="event-type">{event.event_type}</div>
              <div className="event-recording-id">
                Recording: {event.recording_id || 'N/A'}
              </div>
              <div className="event-time">{formatDate(event.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
