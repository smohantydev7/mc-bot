import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import StatusPanel from './components/StatusPanel.jsx';
import LogPanel from './components/LogPanel.jsx';
import CommandInput from './components/CommandInput.jsx';
import ConnectPanel from './components/ConnectPanel.jsx';

// Default to same host (works when frontend is served from the Windows machine).
// When accessing from Mac, change this to the Windows IP.
const DEFAULT_SERVER = window.location.hostname + ':3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [botState, setBotState] = useState({ online: false });
  const [logs, setLogs] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);

  // Connect to backend Socket.IO server
  function connectToServer(url) {
    if (socket) socket.disconnect();

    const s = io(`http://${url}`, {
      reconnection: true,
      reconnectionDelay: 2000
    });

    s.on('connect', () => {
      setConnected(true);
      addLog({ timestamp: new Date().toISOString(), message: 'Connected to backend server.' });
    });

    s.on('disconnect', () => {
      setConnected(false);
      addLog({ timestamp: new Date().toISOString(), message: 'Disconnected from backend.' });
    });

    s.on('bot:state', (state) => setBotState(state));

    s.on('bot:log', (entry) => addLog(entry));

    setSocket(s);
    setServerUrl(url);
  }

  function addLog(entry) {
    setLogs((prev) => [...prev.slice(-499), entry]); // keep last 500
  }

  function sendCommand(text) {
    if (!socket || !text.trim()) return;
    socket.emit('command', text.trim());
    setCommandHistory((prev) => [...prev, text.trim()]);
    addLog({ timestamp: new Date().toISOString(), message: `> ${text.trim()}` });
  }

  function startBot(config) {
    if (!socket) return;
    socket.emit('bot:start', config);
  }

  function stopBot() {
    if (!socket) return;
    socket.emit('bot:stop');
  }

  // Auto-connect on mount
  useEffect(() => {
    connectToServer(DEFAULT_SERVER);
    return () => socket?.disconnect();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>MC-Bot Control Console</h1>
        <div className="connection-status">
          <span className={`dot ${connected ? 'online' : 'offline'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <ConnectPanel
            serverUrl={serverUrl}
            connected={connected}
            onConnect={connectToServer}
            onStartBot={startBot}
            onStopBot={stopBot}
            botOnline={botState.online}
          />
          <StatusPanel state={botState} />
        </aside>

        <main className="console-area">
          <LogPanel logs={logs} />
          <CommandInput
            onSend={sendCommand}
            history={commandHistory}
            disabled={!connected}
          />
        </main>
      </div>
    </div>
  );
}
