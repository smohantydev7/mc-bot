const { getMcData } = require('./base');

// Map friendly names to actual block names
const RESOURCE_MAP = {
  wood: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'cherry_log'],
  log: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'],
  stone: ['stone', 'cobblestone'],
  cobblestone: ['cobblestone'],
  sand: ['sand'],
  dirt: ['dirt'],
  gravel: ['gravel'],
  clay: ['clay'],
  coal: ['coal_ore', 'deepslate_coal_ore'],
  iron: ['iron_ore', 'deepslate_iron_ore'],
  gold: ['gold_ore', 'deepslate_gold_ore'],
  diamond: ['diamond_ore', 'deepslate_diamond_ore'],
  copper: ['copper_ore', 'deepslate_copper_ore'],
  redstone: ['redstone_ore', 'deepslate_redstone_ore'],
  lapis: ['lapis_ore', 'deepslate_lapis_ore']
};

module.exports = {
  name: 'gather',
  description: 'Gather common resources like wood, stone, iron, diamond (friendly names)',
  usage: 'gather <resource> [count]',

  async execute(bot, args, io, ctx) {
    if (args.length === 0) {
      ctx.emitLog('What should I gather? (wood, stone, iron, diamond, sand, dirt, coal…)');
      return;
    }

    const resource = args[0].toLowerCase();
    const count = parseInt(args[1]) || 16;

    // Resolve friendly name to block names
    const blockNames = RESOURCE_MAP[resource];
    if (!blockNames) {
      // Try as a direct block name
      const mcData = getMcData();
      if (mcData.blocksByName[resource]) {
        await ctx.executeSubSkill('mine', [resource, String(count)]);
        return;
      }
      ctx.emitLog(`Don't know what "${resource}" is. Try: wood, stone, iron, diamond, coal, sand…`);
      return;
    }

    ctx.emitLog(`Gathering ${count} ${resource}…`);

    // Try each block type until we find some
    for (const blockName of blockNames) {
      if (ctx.isCancelled()) break;

      const mcData = getMcData();
      if (!mcData.blocksByName[blockName]) continue;

      const block = bot.findBlock({
        matching: mcData.blocksByName[blockName].id,
        maxDistance: 64,
        count: 1
      });

      if (block) {
        await ctx.executeSubSkill('mine', [blockName, String(count)]);
        return;
      }
    }

    ctx.emitLog(`Couldn't find any ${resource} nearby.`);
  }
};
