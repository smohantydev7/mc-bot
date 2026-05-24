const { goals } = require('mineflayer-pathfinder');
const { findNearestBlock, equipBestTool, sleepUnlessCancelled } = require('./base');

module.exports = {
  name: 'mine',
  description: 'Mine a specific block type nearby (e.g., stone, iron_ore, diamond_ore, oak_log)',
  usage: 'mine <block_type> [count]',

  async execute(bot, args, io, ctx) {
    if (args.length === 0) {
      ctx.emitLog('What should I mine? (e.g., mine stone, mine iron_ore 5)');
      return;
    }

    const blockName = args[0].toLowerCase();
    const count = parseInt(args[1]) || 1;
    let mined = 0;

    ctx.emitLog(`Mining ${count} ${blockName}…`);

    for (let i = 0; i < count; i++) {
      if (ctx.isCancelled()) break;

      const block = findNearestBlock(bot, blockName);
      if (!block) {
        ctx.emitLog(`No more ${blockName} found nearby. Mined ${mined} total.`);
        return;
      }

      // Equip best tool for this block
      await equipBestTool(bot, block);

      // Navigate close to the block
      const goal = new goals.GoalLookAtBlock(block.position, bot.world);
      bot.pathfinder.setGoal(goal);

      // Wait to arrive
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 15000);
        const onReach = () => { clearTimeout(timeout); resolve(); };
        bot.once('goal_reached', onReach);
        bot.once('path_stop', onReach);
      });

      if (ctx.isCancelled()) break;

      // Dig the block
      const targetBlock = bot.blockAt(block.position);
      if (targetBlock && bot.canDigBlock(targetBlock)) {
        try {
          await bot.dig(targetBlock);
          mined++;
        } catch (err) {
          ctx.emitLog(`Couldn't dig: ${err.message}`);
        }
      }

      // Short pause between blocks
      await sleepUnlessCancelled(300, ctx);
    }

    ctx.emitLog(`Done! Mined ${mined} ${blockName}.`);
  },

  cancel(bot) {
    bot.pathfinder.setGoal(null);
    try { bot.stopDigging(); } catch (e) { /* ignore */ }
  }
};
