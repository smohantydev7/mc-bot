import { useEffect, useRef } from 'react';

export default function LogPanel({ logs }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="panel log-panel">
      <h2>Live Logs</h2>
      <div className="log-scroll">
        {logs.length === 0 && (
          <div className="log-empty">No logs yet. Start the bot to see activity.</div>
        )}
        {logs.map((entry, i) => (
          <div key={i} className={`log-entry ${entry.message.startsWith('>') ? 'cmd' : ''}`}>
            <span className="log-time">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span className="log-msg">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
