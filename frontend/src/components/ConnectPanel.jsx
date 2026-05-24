import { useState } from 'react';

export default function ConnectPanel({ serverUrl, connected, onConnect, onStartBot, onStopBot, botOnline }) {
  const [url, setUrl] = useState(serverUrl);
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('25565');
  const [username, setUsername] = useState('AIWorker');

  return (
    <div className="panel connect-panel">
      <h2>Connection</h2>

      {/* Backend server connection */}
      <div className="connect-section">
        <label>Backend Server</label>
        <div className="input-row">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="192.168.x.x:3001"
          />
          <button onClick={() => onConnect(url)} className={connected ? 'btn-secondary' : 'btn-primary'}>
            {connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Bot connection controls */}
      {connected && (
        <div className="connect-section">
          <label>Minecraft Server</label>
          <div className="input-row">
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Host"
              style={{ flex: 2 }}
            />
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="Port"
              style={{ flex: 1 }}
            />
          </div>
          <div className="input-row">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Bot username"
            />
          </div>
          <div className="input-row">
            {!botOnline ? (
              <button
                className="btn-primary btn-full"
                onClick={() => onStartBot({ host, port: parseInt(port), username })}
              >
                Start Bot
              </button>
            ) : (
              <button className="btn-danger btn-full" onClick={onStopBot}>
                Stop Bot
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
