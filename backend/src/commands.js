const { goals } = require('mineflayer-pathfinder');
const { getBot, getBotState } = require('./bot');
const { toggleAutonomous, isAutonomousRunning } = require('./autonomous');

// Parse and execute commands from the browser console
function handleCommand(text, io) {
  const bot = getBot();
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  if (!bot || !bot.entity) {
    emitLog(io, 'Bot is not connected — cannot run command.');
    return;
  }

  try {
    switch (cmd) {
      // ---- Chat ----
      case 'say': {
        const msg = args.join(' ');
        if (!msg) return emitLog(io, 'Usage: say <message>');
        bot.chat(msg);
        emitLog(io, `Said: "${msg}"`);
        break;
      }

      // ---- Movement ----
      case 'jump': {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        emitLog(io, 'Jumped!');
        break;
      }

      case 'goto': {
        const [x, y, z] = args.map(Number);
        if ([x, y, z].some(isNaN)) return emitLog(io, 'Usage: goto <x> <y> <z>');
        emitLog(io, `Navigating to ${x}, ${y}, ${z}…`);
        bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
        break;
      }

      case 'follow': {
        const targetName = args[0];
        if (!targetName) return emitLog(io, 'Usage: follow <player>');
        const target = bot.players[targetName]?.entity;
        if (!target) return emitLog(io, `Player "${targetName}" not found nearby.`);
        emitLog(io, `Following ${targetName}…`);
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
        break;
      }

      case 'stop': {
        bot.pathfinder.setGoal(null);
        bot.clearControlStates();
        emitLog(io, 'Stopped all movement.');
        break;
      }

      // ---- Actions ----
      case 'look': {
        const yaw = (Math.random() * Math.PI * 2) - Math.PI;
        const pitch = (Math.random() * 0.6) - 0.3;
        bot.look(yaw, pitch);
        emitLog(io, 'Looking around…');
        break;
      }

      case 'attack': {
        const nearest = bot.nearestEntity((e) => e.type === 'mob' || e.type === 'hostile');
        if (!nearest) return emitLog(io, 'No mob nearby to attack.');
        bot.attack(nearest);
        emitLog(io, `Attacked ${nearest.name || 'entity'}!`);
        break;
      }

      // ---- Info ----
      case 'status': {
        const state = getBotState();
        emitLog(io, `Status — HP: ${state.health} | Food: ${state.food} | Pos: ${state.position.x}, ${state.position.y}, ${state.position.z}`);
        break;
      }

      case 'players': {
        const names = Object.keys(bot.players);
        emitLog(io, `Online players (${names.length}): ${names.join(', ')}`);
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
        const helpText = [
          'Commands:',
          '  say <msg>         — Send a chat message',
          '  jump              — Jump once',
          '  goto <x> <y> <z> — Navigate to coordinates',
          '  follow <player>  — Follow a player',
          '  stop              — Stop all movement',
          '  look              — Look in a random direction',
          '  attack            — Attack nearest mob',
          '  status            — Show bot status',
          '  players           — List online players',
          '  inventory         — Show inventory',
          '  auto              — Toggle autonomous mode',
          '  help              — Show this help'
        ].join('\n');
        emitLog(io, helpText);
        break;
      }

      default:
        emitLog(io, `Unknown command: "${cmd}" — type "help" for a list.`);
    }
  } catch (err) {
    emitLog(io, `Command error: ${err.message}`);
  }
}

function emitLog(io, message) {
  const entry = { timestamp: new Date().toISOString(), message };
  console.log(`[Cmd] ${message}`);
  io.emit('bot:log', entry);
}

module.exports = { handleCommand };
