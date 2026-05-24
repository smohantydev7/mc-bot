const { goals } = require('mineflayer-pathfinder');
const { findNearestBlock, getMcData, navigateTo } = require('./base');

module.exports = {
  name: 'craft',
  description: 'Craft items if you have ingredients (e.g., craft wooden_pickaxe, craft sticks 8)',
  usage: 'craft <item_name> [count]',

  async execute(bot, args, io, ctx) {
    if (args.length === 0) {
      ctx.emitLog('What should I craft? (e.g., craft sticks, craft wooden_pickaxe, craft furnace)');
      return;
    }

    const itemName = args[0].toLowerCase();
    const count = parseInt(args[1]) || 1;
    const mcData = getMcData();

    // Find the item
    const item = mcData.itemsByName[itemName];
    if (!item) {
      ctx.emitLog(`Don't know what "${itemName}" is.`);
      return;
    }

    // Check recipes
    let craftingTable = null;

    // First try without crafting table (2x2)
    let recipes = bot.recipesFor(item.id, null, 1, null);

    if (recipes.length === 0) {
      // Try with crafting table
      const tableBlock = findNearestBlock(bot, 'crafting_table');
      if (tableBlock) {
        ctx.emitLog('Found a crafting table, heading there…');
        const goal = new goals.GoalLookAtBlock(tableBlock.position, bot.world);
        await navigateTo(bot, goal, ctx);
        if (ctx.isCancelled()) return;

        craftingTable = bot.blockAt(tableBlock.position);
        recipes = bot.recipesFor(item.id, null, 1, craftingTable);
      }
    }

    if (recipes.length === 0) {
      ctx.emitLog(`Can't craft ${itemName} — missing ingredients or need a crafting table.`);
      return;
    }

    ctx.emitLog(`Crafting ${count} ${itemName}…`);

    try {
      await bot.craft(recipes[0], count, craftingTable);
      ctx.emitLog(`Crafted ${count} ${itemName}!`);
    } catch (err) {
      ctx.emitLog(`Crafting failed: ${err.message}`);
    }
  }
};
