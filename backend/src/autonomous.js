// Autonomous behavior loop — makes the bot wander, look around, and jump randomly

let autonomousInterval = null;
let running = false;

function startAutonomous(bot, io) {
  if (autonomousInterval) return;
  running = true;

  emitLog(io, 'Autonomous mode started.');

  autonomousInterval = setInterval(() => {
    if (!bot || !bot.entity) return;

    // Pick a random behavior
    const roll = Math.random();

    if (roll < 0.3) {
      // Wander: walk in a random direction for a short burst
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0);
      bot.setControlState('forward', true);
      setTimeout(() => {
        if (bot?.entity) bot.setControlState('forward', false);
      }, 1000 + Math.random() * 2000);
    } else if (roll < 0.5) {
      // Jump
      bot.setControlState('jump', true);
      setTimeout(() => {
        if (bot?.entity) bot.setControlState('jump', false);
      }, 500);
    } else if (roll < 0.7) {
      // Look around
      const yaw = (Math.random() * Math.PI * 2) - Math.PI;
      const pitch = (Math.random() * 0.8) - 0.4;
      bot.look(yaw, pitch);
    }
    // else: idle — do nothing this tick
  }, 3000);
}

function stopAutonomous() {
  if (autonomousInterval) {
    clearInterval(autonomousInterval);
    autonomousInterval = null;
  }
  running = false;
}

function toggleAutonomous(bot, io) {
  if (running) {
    stopAutonomous();
    emitLog(io, 'Autonomous mode stopped.');
    return false;
  } else {
    startAutonomous(bot, io);
    return true;
  }
}

function isAutonomousRunning() {
  return running;
}

function emitLog(io, message) {
  const entry = { timestamp: new Date().toISOString(), message };
  console.log(`[Auto] ${message}`);
  io.emit('bot:log', entry);
}

module.exports = { startAutonomous, stopAutonomous, toggleAutonomous, isAutonomousRunning };
