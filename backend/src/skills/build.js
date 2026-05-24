const { Vec3 } = require('vec3');
const { sleepUnlessCancelled } = require('./base');

// Find a placeable block in inventory
function getPlaceableBlock(bot) {
  const preferred = ['cobblestone', 'stone', 'dirt', 'oak_planks', 'spruce_planks',
    'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks',
    'cobbled_deepslate', 'sandstone', 'bricks'];

  const items = bot.inventory.items();
  for (const name of preferred) {
    const item = items.find(i => i.name === name);
    if (item) return item;
  }
  // Fallback: any block-like item
  return items.find(i => i.name.includes('planks') || i.name.includes('stone') || i.name.includes('dirt'));
}

module.exports = {
  name: 'build',
  description: 'Build simple structures: pillar, wall, floor, shelter',
  usage: 'build <pillar|wall|floor|shelter> [size]',

  async execute(bot, args, io, ctx) {
    const type = args[0]?.toLowerCase() || 'pillar';
    const size = parseInt(args[1]) || 4;

    const material = getPlaceableBlock(bot);
    if (!material) {
      ctx.emitLog('No building blocks in inventory! Gather some cobblestone or dirt first.');
      return;
    }

    ctx.emitLog(`Building ${type} (size ${size}) with ${material.name}…`);

    switch (type) {
      case 'pillar':
        await buildPillar(bot, material, size, ctx);
        break;
      case 'wall':
        await buildWall(bot, material, size, ctx);
        break;
      case 'floor':
        await buildFloor(bot, material, size, ctx);
        break;
      case 'shelter':
        await buildShelter(bot, material, ctx);
        break;
      default:
        ctx.emitLog(`Unknown structure "${type}". Try: pillar, wall, floor, shelter`);
    }
  },

  cancel(bot) {
    bot.pathfinder.setGoal(null);
  }
};

async function placeBlockAt(bot, item, refBlock, faceVec) {
  try {
    await bot.equip(item, 'hand');
    await bot.placeBlock(refBlock, faceVec);
    return true;
  } catch (err) {
    return false;
  }
}

async function buildPillar(bot, material, height, ctx) {
  const startPos = bot.entity.position.floored();

  for (let y = 0; y < height; y++) {
    if (ctx.isCancelled()) break;

    // Jump and place below
    bot.setControlState('jump', true);
    await sleepUnlessCancelled(400, ctx);
    bot.setControlState('jump', false);

    const below = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    if (below) {
      await placeBlockAt(bot, material, below, new Vec3(0, 1, 0));
    }
    await sleepUnlessCancelled(300, ctx);
  }
  ctx.emitLog(`Pillar of ${height} blocks built!`);
}

async function buildWall(bot, material, length, ctx) {
  const pos = bot.entity.position.floored();
  const yaw = bot.entity.yaw;
  // Direction the bot is facing
  const dx = Math.round(-Math.sin(yaw));
  const dz = Math.round(Math.cos(yaw));

  for (let i = 0; i < length; i++) {
    if (ctx.isCancelled()) break;

    const target = pos.offset(dx * i, 0, dz * i);
    const below = bot.blockAt(target.offset(0, -1, 0));
    if (below && below.name !== 'air') {
      await placeBlockAt(bot, material, below, new Vec3(0, 1, 0));
    }
    await sleepUnlessCancelled(400, ctx);
  }
  ctx.emitLog(`Wall of ${length} blocks built!`);
}

async function buildFloor(bot, material, size, ctx) {
  const origin = bot.entity.position.floored().offset(-Math.floor(size / 2), -1, -Math.floor(size / 2));

  let placed = 0;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      if (ctx.isCancelled()) return;

      const pos = origin.offset(x, 0, z);
      const block = bot.blockAt(pos);
      if (block && block.name === 'air') {
        const below = bot.blockAt(pos.offset(0, -1, 0));
        if (below && below.name !== 'air') {
          await placeBlockAt(bot, material, below, new Vec3(0, 1, 0));
          placed++;
        }
      }
      await sleepUnlessCancelled(200, ctx);
    }
  }
  ctx.emitLog(`Floor done! Placed ${placed} blocks.`);
}

async function buildShelter(bot, material, ctx) {
  ctx.emitLog('Building a simple shelter (this takes a moment)…');
  // Build 4 walls of height 3, 5 wide, then a roof
  // Simplified: pillar up 3 blocks to get safe from mobs
  await buildPillar(bot, material, 3, ctx);
  if (!ctx.isCancelled()) {
    ctx.emitLog('Built a pillar shelter — you\'re safe up here!');
  }
}
