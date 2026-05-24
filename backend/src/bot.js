const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { startAutonomous, stopAutonomous } = require('./autonomous');
const { isEnabled, interpret } = require('./ai');

let bot = null;
let reconnectTimer = null;
let botConfig = null;
let stateInterval = null;

// Default config — override via the browser console
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 25565,
  username: 'AIWorker'
  // version is omitted so Mineflayer auto-detects the server version
};

// ---- Public API ----

function createBot(overrides = {}, io) {
  // Merge user overrides with defaults
  botConfig = { ...DEFAULT_CONFIG, ...overrides };

  if (bot) {
    emitLog(io, 'Bot already running — stopping first…');
    destroyBot(io);
  }

  emitLog(io, `Connecting to ${botConfig.host}:${botConfig.port} as "${botConfig.username}"…`);

  try {
    const botOptions = {
      host: botConfig.host,
      port: botConfig.port,
      username: botConfig.username,
      hideErrors: false
    };
    // Only set version if explicitly provided — otherwise Mineflayer auto-detects
    if (botConfig.version) {
      botOptions.version = botConfig.version;
    }

    bot = mineflayer.createBot(botOptions);
  } catch (err) {
    emitLog(io, `Failed to create bot: ${err.message}`);
    bot = null;
    return;
  }

  // Load pathfinder plugin
  bot.loadPlugin(pathfinder);

  // ---- Bot event listeners ----

  bot.once('spawn', () => {
    emitLog(io, 'Bot spawned in world!');

    // Configure pathfinder movements
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    defaultMove.allowSprinting = true;
    bot.pathfinder.setMovements(defaultMove);

    // Start broadcasting state to the console
    startStateUpdates(io);

    // Start autonomous behavior loop
    startAutonomous(bot, io);

    io.emit('bot:state', getBotState());
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    emitLog(io, `[Chat] <${username}> ${message}`);

    // Reply to in-game chat using AI
    handleInGameChat(username, message, io);
  });

  bot.on('health', () => {
    io.emit('bot:state', getBotState());
  });

  bot.on('death', () => {
    emitLog(io, 'Bot died! Respawning…');
  });

  bot.on('kicked', (reason) => {
    emitLog(io, `Kicked: ${reason}`);
    cleanup();
    scheduleReconnect(io);
  });

  bot.on('error', (err) => {
    emitLog(io, `Error: ${err.message}`);
    // Don't let the error crash the process
  });

  bot.on('end', (reason) => {
    emitLog(io, `Disconnected: ${reason}`);
    bot = null;
    cleanup();
    scheduleReconnect(io);
  });
}

// Catch any unhandled errors so the backend process doesn't crash
process.on('uncaughtException', (err) => {
  console.error('[Bot] Uncaught exception (kept alive):', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('[Bot] Unhandled rejection (kept alive):', err.message || err);
});

function destroyBot(io) {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  stopAutonomous();
  cleanup();
  if (bot) {
    bot.quit();
    bot = null;
  }
  emitLog(io, 'Bot stopped.');
  io.emit('bot:state', getBotState());
}

function getBot() {
  return bot;
}

function getBotState() {
  if (!bot || !bot.entity) {
    return { online: false };
  }

  const pos = bot.entity.position;
  return {
    online: true,
    username: bot.username,
    health: bot.health,
    food: bot.food,
    position: {
      x: Math.round(pos.x * 10) / 10,
      y: Math.round(pos.y * 10) / 10,
      z: Math.round(pos.z * 10) / 10
    },
    gameMode: bot.game?.gameMode,
    dimension: bot.game?.dimension,
    time: bot.time?.timeOfDay
  };
}

// ---- Internal helpers ----

function cleanup() {
  if (stateInterval) {
    clearInterval(stateInterval);
    stateInterval = null;
  }
}

function startStateUpdates(io) {
  cleanup();
  // Push state to all connected consoles every second
  stateInterval = setInterval(() => {
    if (bot && bot.entity) {
      io.emit('bot:state', getBotState());
    }
  }, 1000);
}

function scheduleReconnect(io) {
  if (reconnectTimer) return;
  const delay = 5000;
  emitLog(io, `Reconnecting in ${delay / 1000}s…`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot(botConfig, io);
  }, delay);
}

function emitLog(io, message) {
  const entry = { timestamp: new Date().toISOString(), message };
  console.log(`[Bot] ${message}`);
  io.emit('bot:log', entry);
}

// Handle in-game chat — bot replies in Minecraft chat using AI
async function handleInGameChat(username, message, io) {
  if (!isEnabled() || !bot) return;

  try {
    const result = await interpret(`${username} says: ${message}`);
    if (result && result.reply) {
      bot.chat(result.reply);
      emitLog(io, `[Bot replied] ${result.reply}`);
    }
  } catch (err) {
    console.error('[Bot] Failed to reply to chat:', err.message);
  }
}

module.exports = { createBot, destroyBot, getBot, getBotState };
