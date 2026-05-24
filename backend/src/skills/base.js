// Shared utilities used across all skills

let mcData = null;

function setMcData(data) {
  mcData = data;
}

function getMcData() {
  return mcData;
}

// Find the nearest block of a given type
function findNearestBlock(bot, blockName, maxDistance = 64) {
  const blockType = mcData.blocksByName[blockName];
  if (!blockType) return null;

  return bot.findBlock({
    matching: blockType.id,
    maxDistance,
    count: 1
  });
}

// Find multiple blocks of a given type
function findBlocks(bot, blockName, maxDistance = 64, count = 10) {
  const blockType = mcData.blocksByName[blockName];
  if (!blockType) return [];

  return bot.findBlocks({
    matching: blockType.id,
    maxDistance,
    count
  });
}

// Equip the best tool for breaking a specific block
async function equipBestTool(bot, block) {
  const items = bot.inventory.items();
  let bestItem = null;
  let bestTime = block.digTime(null, false, false, false);

  for (const item of items) {
    const time = block.digTime(item.type, false, false, false);
    if (time < bestTime) {
      bestTime = time;
      bestItem = item;
    }
  }

  if (bestItem) {
    await bot.equip(bestItem, 'hand');
  }
}

// Find the best weapon in inventory
function getBestWeapon(bot) {
  const items = bot.inventory.items();
  const weaponPriority = ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword',
    'netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe'];

  for (const name of weaponPriority) {
    const item = items.find(i => i.name === name);
    if (item) return item;
  }
  return null;
}

// Find food items in inventory, sorted by saturation (best first)
function findFoodInInventory(bot) {
  const items = bot.inventory.items();
  const foodPriority = [
    'golden_apple', 'enchanted_golden_apple',
    'cooked_beef', 'cooked_porkchop', 'cooked_mutton',
    'cooked_salmon', 'cooked_chicken', 'cooked_rabbit', 'cooked_cod',
    'bread', 'baked_potato', 'beetroot_soup', 'mushroom_stew',
    'apple', 'melon_slice', 'sweet_berries', 'carrot', 'potato',
    'raw_beef', 'raw_porkchop', 'raw_mutton', 'raw_chicken',
    'raw_cod', 'raw_salmon', 'beetroot', 'dried_kelp', 'cookie'
  ];

  for (const name of foodPriority) {
    const item = items.find(i => i.name === name);
    if (item) return item;
  }
  return null;
}

// Navigate to a position and wait until arrival or cancellation
function navigateTo(bot, goal, ctx) {
  return new Promise((resolve, reject) => {
    if (ctx.isCancelled()) return resolve(false);

    bot.pathfinder.setGoal(goal);

    const onReached = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const checkCancel = setInterval(() => {
      if (ctx.isCancelled()) {
        bot.pathfinder.setGoal(null);
        onCancel();
      }
    }, 500);

    function cleanup() {
      clearInterval(checkCancel);
      bot.removeListener('goal_reached', onReached);
      bot.removeListener('path_stop', onReached);
    }

    bot.once('goal_reached', onReached);
    bot.once('path_stop', onReached);

    // Timeout after 30 seconds
    setTimeout(() => {
      cleanup();
      bot.pathfinder.setGoal(null);
      resolve(false);
    }, 30000);
  });
}

// Sleep that can be cancelled
function sleepUnlessCancelled(ms, ctx) {
  return new Promise((resolve) => {
    if (ctx.isCancelled()) return resolve(false);

    const timer = setTimeout(() => resolve(true), ms);
    const check = setInterval(() => {
      if (ctx.isCancelled()) {
        clearTimeout(timer);
        clearInterval(check);
        resolve(false);
      }
    }, 200);

    // Also clear interval when timer fires
    setTimeout(() => clearInterval(check), ms + 100);
  });
}

// Count how many of a specific item the bot has
function countItem(bot, itemName) {
  return bot.inventory.items()
    .filter(i => i.name === itemName)
    .reduce((sum, i) => sum + i.count, 0);
}

// Check if bot has a specific item
function hasItem(bot, itemName) {
  return countItem(bot, itemName) > 0;
}

module.exports = {
  setMcData, getMcData,
  findNearestBlock, findBlocks,
  equipBestTool, getBestWeapon, findFoodInInventory,
  navigateTo, sleepUnlessCancelled,
  countItem, hasItem
};
