import { useState, useRef } from 'react';

export default function CommandInput({ onSend, history, disabled }) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue('');
    setHistoryIndex(-1);
  }

  function handleKeyDown(e) {
    // Navigate command history with arrow keys
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setValue(history[history.length - 1 - newIndex] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setValue(newIndex < 0 ? '' : history[history.length - 1 - newIndex] || '');
    }
  }

  return (
    <form className="command-input" onSubmit={handleSubmit}>
      <span className="prompt-char">&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Not connected…' : 'Type a command (try "help")'}
        disabled={disabled}
        autoFocus
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
