const { goals } = require('mineflayer-pathfinder');
const { findNearestBlock, navigateTo } = require('./base');

module.exports = {
  name: 'store',
  description: 'Store or retrieve items from a nearby chest',
  usage: 'store <deposit|withdraw|all> [item_name]',

  async execute(bot, args, io, ctx) {
    const action = args[0]?.toLowerCase() || 'all';
    const itemFilter = args.slice(1).join('_').toLowerCase() || null;

    // Find nearest chest
    const chestBlock = findNearestBlock(bot, 'chest');
    if (!chestBlock) {
      ctx.emitLog('No chest found nearby.');
      return;
    }

    // Navigate to the chest
    ctx.emitLog('Heading to chest…');
    const goal = new goals.GoalLookAtBlock(chestBlock.position, bot.world);
    await navigateTo(bot, goal, ctx);
    if (ctx.isCancelled()) return;

    // Open the chest
    const chest = await bot.openContainer(bot.blockAt(chestBlock.position));

    try {
      if (action === 'deposit' || action === 'store' || action === 'all') {
        const items = bot.inventory.items();
        let deposited = 0;

        for (const item of items) {
          if (ctx.isCancelled()) break;
          if (itemFilter && !item.name.includes(itemFilter)) continue;

          try {
            await chest.deposit(item.type, null, item.count);
            deposited += item.count;
          } catch (e) { /* chest might be full */ }
        }

        ctx.emitLog(`Deposited ${deposited} items.`);
      } else if (action === 'withdraw' || action === 'take') {
        const chestItems = chest.containerItems();

        if (!itemFilter) {
          ctx.emitLog(`Chest contains: ${chestItems.map(i => `${i.name} x${i.count}`).join(', ') || 'nothing'}`);
          return;
        }

        let withdrawn = 0;
        for (const item of chestItems) {
          if (ctx.isCancelled()) break;
          if (!item.name.includes(itemFilter)) continue;

          try {
            await chest.withdraw(item.type, null, item.count);
            withdrawn += item.count;
          } catch (e) { /* inventory might be full */ }
        }

        ctx.emitLog(`Withdrew ${withdrawn} items.`);
      }
    } finally {
      chest.close();
    }
  },

  cancel(bot) {
    bot.pathfinder.setGoal(null);
    bot.closeWindow(bot.currentWindow);
  }
};
