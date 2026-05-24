const { sleepUnlessCancelled, hasItem } = require('./base');

module.exports = {
  name: 'fish',
  description: 'Go fishing at nearby water (need a fishing rod)',
  usage: 'fish [count]',

  async execute(bot, args, io, ctx) {
    const count = parseInt(args[0]) || 5;

    // Check for fishing rod
    const rod = bot.inventory.items().find(i => i.name === 'fishing_rod');
    if (!rod) {
      ctx.emitLog("Don't have a fishing rod! Craft one first.");
      return;
    }

    await bot.equip(rod, 'hand');
    ctx.emitLog(`Fishing for ${count} catches…`);

    let caught = 0;

    for (let i = 0; i < count; i++) {
      if (ctx.isCancelled()) break;

      // Cast the line
      try {
        bot.activateItem();
      } catch (e) {
        ctx.emitLog('Failed to cast line.');
        break;
      }

      // Wait for a bite (playerCollect event or bobber sound)
      const didCatch = await waitForBite(bot, ctx);

      if (ctx.isCancelled()) break;

      if (didCatch) {
        // Reel in
        bot.activateItem();
        caught++;
        ctx.emitLog(`Caught something! (${caught}/${count})`);
        await sleepUnlessCancelled(1000, ctx);
      }
    }

    ctx.emitLog(`Fishing done! Caught ${caught} fish.`);
  },

  cancel(bot) {
    try { bot.deactivateItem(); } catch (e) { /* ignore */ }
  }
};

function waitForBite(bot, ctx) {
  return new Promise((resolve) => {
    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 30000);

    // Check for cancellation
    const cancelCheck = setInterval(() => {
      if (ctx.isCancelled()) {
        cleanup();
        resolve(false);
      }
    }, 500);

    // Listen for the collect event (fish caught)
    const onCollect = (collector, collected) => {
      if (collector === bot.entity) {
        cleanup();
        resolve(true);
      }
    };

    // Also listen for the sound that plays when a fish bites
    const onSound = (soundName) => {
      if (soundName === 'entity.fishing_bobber.splash') {
        cleanup();
        resolve(true);
      }
    };

    bot.on('playerCollect', onCollect);
    bot.on('soundEffectHeard', onSound);

    function cleanup() {
      clearTimeout(timeout);
      clearInterval(cancelCheck);
      bot.removeListener('playerCollect', onCollect);
      bot.removeListener('soundEffectHeard', onSound);
    }
  });
}
