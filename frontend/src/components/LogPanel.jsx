import { useEffect, useRef } from 'react';

function getEntryClass(entry) {
  if (entry.message.startsWith('>')) return 'cmd';
  if (entry.type === 'reply') return 'reply';
  return '';
}

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
          <div className="log-empty">No logs yet. Start the bot and say something!</div>
        )}
        {logs.map((entry, i) => (
          <div key={i} className={`log-entry ${getEntryClass(entry)}`}>
            <span className="log-time">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {entry.type === 'reply' && <span className="reply-tag">BOT</span>}
            <span className="log-msg">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
