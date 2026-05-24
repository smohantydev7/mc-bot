const { goals } = require('mineflayer-pathfinder');
const { findNearestBlock, getMcData, navigateTo, sleepUnlessCancelled } = require('./base');

const MATURE_CROPS = {
  wheat: 7,
  carrots: 7,
  potatoes: 7,
  beetroots: 3
};

const SEED_MAP = {
  wheat: 'wheat_seeds',
  carrots: 'carrot',
  potatoes: 'potato',
  beetroots: 'beetroot_seeds'
};

module.exports = {
  name: 'farm',
  description: 'Farm crops: harvest, plant, till soil, or auto-cycle',
  usage: 'farm <harvest|plant|till|auto>',

  async execute(bot, args, io, ctx) {
    const action = args[0]?.toLowerCase() || 'auto';

    switch (action) {
      case 'harvest':
        await harvest(bot, ctx);
        break;
      case 'plant':
        await plant(bot, args.slice(1), ctx);
        break;
      case 'till':
        await till(bot, ctx);
        break;
      case 'auto':
        await harvest(bot, ctx);
        if (!ctx.isCancelled()) await plant(bot, [], ctx);
        break;
      default:
        ctx.emitLog(`Unknown farm action "${action}". Try: harvest, plant, till, auto`);
    }
  },

  cancel(bot) {
    bot.pathfinder.setGoal(null);
    try { bot.stopDigging(); } catch (e) { /* ignore */ }
  }
};

async function harvest(bot, ctx) {
  const mcData = getMcData();
  let harvested = 0;

  for (const [cropName, matureAge] of Object.entries(MATURE_CROPS)) {
    if (ctx.isCancelled()) break;

    const cropBlock = mcData.blocksByName[cropName];
    if (!cropBlock) continue;

    // Find mature crops
    const blocks = bot.findBlocks({
      matching: cropBlock.id,
      maxDistance: 32,
      count: 50,
      useExtraInfo: (block) => {
        // Check if crop is mature using properties
        const age = block.getProperties?.()?.age;
        return age !== undefined ? age >= matureAge : true;
      }
    });

    for (const pos of blocks) {
      if (ctx.isCancelled()) break;

      const block = bot.blockAt(pos);
      if (!block || !bot.canDigBlock(block)) continue;

      const goal = new goals.GoalLookAtBlock(pos, bot.world);
      await navigateTo(bot, goal, ctx);
      if (ctx.isCancelled()) break;

      const target = bot.blockAt(pos);
      if (target) {
        try {
          await bot.dig(target);
          harvested++;
        } catch (e) { /* skip */ }
      }
      await sleepUnlessCancelled(200, ctx);
    }
  }

  ctx.emitLog(`Harvested ${harvested} crops.`);
}

async function plant(bot, args, ctx) {
  const mcData = getMcData();
  const farmland = mcData.blocksByName['farmland'];
  if (!farmland) return;

  // Find empty farmland
  const plots = bot.findBlocks({
    matching: farmland.id,
    maxDistance: 32,
    count: 50
  });

  let planted = 0;

  for (const pos of plots) {
    if (ctx.isCancelled()) break;

    // Check if there's already a crop on top
    const above = bot.blockAt(pos.offset(0, 1, 0));
    if (above && above.name !== 'air') continue;

    // Find seeds in inventory
    const seeds = bot.inventory.items().find(i =>
      i.name.includes('seeds') || i.name === 'carrot' || i.name === 'potato' || i.name === 'beetroot_seeds'
    );
    if (!seeds) {
      ctx.emitLog('Out of seeds!');
      break;
    }

    const goal = new goals.GoalLookAtBlock(pos, bot.world);
    await navigateTo(bot, goal, ctx);
    if (ctx.isCancelled()) break;

    try {
      await bot.equip(seeds, 'hand');
      const farmBlock = bot.blockAt(pos);
      if (farmBlock) {
        await bot.placeBlock(farmBlock, new (require('vec3'))(0, 1, 0));
        planted++;
      }
    } catch (e) { /* skip */ }
    await sleepUnlessCancelled(200, ctx);
  }

  ctx.emitLog(`Planted ${planted} seeds.`);
}

async function till(bot, ctx) {
  const mcData = getMcData();

  // Find dirt/grass near water
  const dirtTypes = ['dirt', 'grass_block'].map(n => mcData.blocksByName[n]?.id).filter(Boolean);

  const blocks = bot.findBlocks({
    matching: dirtTypes,
    maxDistance: 16,
    count: 20
  });

  // Equip hoe
  const hoe = bot.inventory.items().find(i => i.name.includes('hoe'));
  if (!hoe) {
    ctx.emitLog('No hoe in inventory! Craft one first.');
    return;
  }

  await bot.equip(hoe, 'hand');
  let tilled = 0;

  for (const pos of blocks) {
    if (ctx.isCancelled()) break;

    const goal = new goals.GoalLookAtBlock(pos, bot.world);
    await navigateTo(bot, goal, ctx);
    if (ctx.isCancelled()) break;

    const block = bot.blockAt(pos);
    if (block) {
      try {
        await bot.activateBlock(block);
        tilled++;
      } catch (e) { /* skip */ }
    }
    await sleepUnlessCancelled(300, ctx);
  }

  ctx.emitLog(`Tilled ${tilled} blocks of soil.`);
}
