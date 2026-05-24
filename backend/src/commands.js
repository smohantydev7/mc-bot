const { goals } = require('mineflayer-pathfinder');
const { getBot, getBotState } = require('./bot');
const { toggleAutonomous, isAutonomousRunning } = require('./autonomous');
const { isEnabled, interpret } = require('./ai');

// Main entry point — routes through AI if enabled, otherwise uses direct commands
async function handleCommand(text, io) {
  const bot = getBot();

  if (!bot || !bot.entity) {
    emitLog(io, 'Bot is not connected — cannot run command.');
    return;
  }

  // If AI is enabled, interpret natural language first
  if (isEnabled()) {
    try {
      const result = await interpret(text);
      if (result) {
        // Show the friendly reply
        emitReply(io, result.reply);

        // Execute the action if there is one
        if (result.action) {
          executeAction(result.action, io);
        }
        return;
      }
    } catch (err) {
      emitLog(io, `AI error, falling back to direct command: ${err.message}`);
    }
  }

  // Fallback: direct command mode
  executeAction(text, io);
}

// Execute a parsed command string like "goto 100 64 200" or "follow Steve"
function executeAction(text, io) {
  const bot = getBot();
  if (!bot || !bot.entity) return;

  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  try {
    switch (cmd) {
      // ---- Chat ----
      case 'say': {
        const msg = args.join(' ');
        if (!msg) return emitLog(io, 'Nothing to say.');
        bot.chat(msg);
        emitLog(io, `[In-game chat] "${msg}"`);
        break;
      }

      // ---- Movement ----
      case 'jump': {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        break;
      }

      case 'goto': {
        const [x, y, z] = args.map(Number);
        if ([x, y, z].some(isNaN)) return emitLog(io, "I need coordinates — like 'go to 100 64 200'.");
        emitLog(io, `Navigating to ${x}, ${y}, ${z}…`);
        bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
        break;
      }

      case 'follow': {
        const targetName = args[0];
        if (!targetName) return emitLog(io, "Follow who? Give me a player name.");
        const target = bot.players[targetName]?.entity;
        if (!target) return emitLog(io, `Can't find "${targetName}" nearby.`);
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
        break;
      }

      case 'stop': {
        bot.pathfinder.setGoal(null);
        bot.clearControlStates();
        break;
      }

      // ---- Actions ----
      case 'look': {
        const yaw = (Math.random() * Math.PI * 2) - Math.PI;
        const pitch = (Math.random() * 0.6) - 0.3;
        bot.look(yaw, pitch);
        break;
      }

      case 'attack': {
        const nearest = bot.nearestEntity((e) => e.type === 'mob' || e.type === 'hostile');
        if (!nearest) return emitLog(io, 'No mobs around to fight.');
        bot.attack(nearest);
        emitLog(io, `Attacked ${nearest.name || 'something'}!`);
        break;
      }

      // ---- Info ----
      case 'status': {
        const state = getBotState();
        emitLog(io, `HP: ${state.health}/20 | Food: ${state.food}/20 | Pos: ${state.position.x}, ${state.position.y}, ${state.position.z}`);
        break;
      }

      case 'players': {
        const names = Object.keys(bot.players);
        emitLog(io, `Online (${names.length}): ${names.join(', ')}`);
        break;
      }

      case 'inventory': {
        const items = bot.inventory.items();
        if (!items.length) return emitLog(io, 'Inventory is empty.');
        const list = items.map((i) => `${i.name} x${i.count}`).join(', ');
        emitLog(io, `Inventory: ${list}`);
        break;
      }

      // ---- Autonomous mode ----
      case 'auto': {
        const running = toggleAutonomous(bot, io);
        emitLog(io, `Autonomous mode: ${running ? 'ON' : 'OFF'}`);
        break;
      }

      // ---- Help ----
      case 'help': {
        emitLog(io, 'Just talk to me naturally! Or use direct commands: say, jump, goto, follow, stop, look, attack, status, players, inventory, auto');
        break;
      }

      default:
        emitLog(io, `Not sure what "${cmd}" means.`);
    }
  } catch (err) {
    emitLog(io, `Error: ${err.message}`);
  }
}

function emitLog(io, message) {
  const entry = { timestamp: new Date().toISOString(), message, type: 'log' };
  console.log(`[Cmd] ${message}`);
  io.emit('bot:log', entry);
}

function emitReply(io, message) {
  const entry = { timestamp: new Date().toISOString(), message, type: 'reply' };
  console.log(`[Bot] ${message}`);
  io.emit('bot:log', entry);
}

module.exports = { handleCommand };
