export default function StatusPanel({ state }) {
  if (!state.online) {
    return (
      <div className="panel status-panel">
        <h2>Bot Status</h2>
        <div className="status-offline">Bot is offline</div>
      </div>
    );
  }

  return (
    <div className="panel status-panel">
      <h2>Bot Status</h2>

      <div className="status-grid">
        <div className="stat">
          <label>Player</label>
          <span>{state.username}</span>
        </div>
        <div className="stat">
          <label>Status</label>
          <span className="badge online">Online</span>
        </div>
        <div className="stat">
          <label>Health</label>
          <div className="bar-container">
            <div className="bar health-bar" style={{ width: `${(state.health / 20) * 100}%` }} />
            <span className="bar-label">{state.health}/20</span>
          </div>
        </div>
        <div className="stat">
          <label>Food</label>
          <div className="bar-container">
            <div className="bar food-bar" style={{ width: `${(state.food / 20) * 100}%` }} />
            <span className="bar-label">{state.food}/20</span>
          </div>
        </div>
        <div className="stat">
          <label>Position</label>
          <span className="coords">
            {state.position?.x}, {state.position?.y}, {state.position?.z}
          </span>
        </div>
        <div className="stat">
          <label>Dimension</label>
          <span>{state.dimension || '—'}</span>
        </div>
      </div>
    </div>
  );
}
