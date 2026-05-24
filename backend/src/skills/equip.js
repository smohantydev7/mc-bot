const { getBestWeapon } = require('./base');

const ARMOR_SLOTS = {
  helmet: 'head',
  chestplate: 'torso',
  leggings: 'legs',
  boots: 'feet'
};

const MATERIAL_TIER = ['leather', 'golden', 'chainmail', 'iron', 'diamond', 'netherite'];

module.exports = {
  name: 'equip',
  description: 'Equip the best tools and armor from inventory',
  usage: 'equip [best|armor|sword|pickaxe]',

  async execute(bot, args, io, ctx) {
    const what = args[0]?.toLowerCase() || 'best';
    const items = bot.inventory.items();

    if (what === 'armor' || what === 'best') {
      // Equip best armor in each slot
      for (const [type, slot] of Object.entries(ARMOR_SLOTS)) {
        const armorPieces = items.filter(i => i.name.includes(type));
        if (armorPieces.length === 0) continue;

        // Sort by material tier (best last)
        armorPieces.sort((a, b) => {
          const tierA = MATERIAL_TIER.findIndex(m => a.name.includes(m));
          const tierB = MATERIAL_TIER.findIndex(m => b.name.includes(m));
          return tierB - tierA;
        });

        await bot.equip(armorPieces[0], slot);
        ctx.emitLog(`Equipped ${armorPieces[0].name}`);
      }
    }

    if (what === 'sword' || what === 'best') {
      const weapon = getBestWeapon(bot);
      if (weapon) {
        await bot.equip(weapon, 'hand');
        ctx.emitLog(`Equipped ${weapon.name}`);
      } else {
        ctx.emitLog('No weapons in inventory.');
      }
    }

    if (what === 'pickaxe' || what === 'axe' || what === 'shovel') {
      const tool = items.find(i => i.name.includes(what));
      if (tool) {
        await bot.equip(tool, 'hand');
        ctx.emitLog(`Equipped ${tool.name}`);
      } else {
        ctx.emitLog(`No ${what} in inventory.`);
      }
    }

    ctx.emitLog('Equipment check done.');
  }
};
